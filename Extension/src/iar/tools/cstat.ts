/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */



import { OsUtils } from "../../utils/utils";
import { spawn, spawnSync } from "child_process";
import { join, dirname } from "path";
import CsvParser = require("csv-parse/lib/sync");
import * as Fs from "fs";

/**
 * Functions for interacting with C-STAT
 */
export namespace CStat {

    export enum CStatWarningSeverity {
        LOW = 0,
        MEDIUM = 1,
        HIGH = 2,
    }
    export interface CStatWarning {
        file: string;
        line: number;
        col: number;
        message: string;
        severity: CStatWarningSeverity;
        checkId: string;
    }

    // Names of relevant columns in the 'warnings' table of the cstat db
    enum CStatWarningField {
        FILE_NAME = "file_name",
        LINE = "line_num",
        COLUMN = "column_num",
        MSG = "msg",
        SEVERITY = "severity",
        // TRACE = "encoded_trace",
    }
    const fieldsToLoad: string[] = Object.values(CStatWarningField);


    /**
     * Runs a C-STAT analysis on a given project and configuration,
     * using IarBuild.
     * @param builderPath path to the IarBuild to use
     * @param projectPath path to the project to run for
     * @param configurationName name of the project configuration
     * @param extensionPath path to the root of this extension
     * @param onWrite an output channel for writing logs and other messages while running
     */
    export async function runAnalysis(builderPath: string, projectPath: string, configurationName: string,
        extensionPath: string, onWrite?: (msg: string) => void): Promise<CStatWarning[]> {

        if (!Fs.existsSync(builderPath)) {
            return Promise.reject(new Error(`The builder ${builderPath} does not exists.`));
        }

        // Try to guess where the cstat db will be created. This is the best we can do without parsing the .ewt file ourselves.
        const output = spawnSync(builderPath).stdout.toString(); // Spawn without args to get help list
        let dbPath: string;
        if (output.includes("-cstat_cmds")) { // Filifjonkan
            dbPath = join(dirname(projectPath), configurationName, "C-STAT", "cstat.db");
        } else {
            onWrite?.("Detected pre-9.X workbench.");
            dbPath = join(dirname(projectPath), configurationName, "Obj", "cstat.db");
        }

        // It seems we need to delete the db and regenerate it every time to get around
        // some weird behaviour where the db keeps references to files outside the project
        // (specifically when the project is moved or the db is accidentally put under VCS).
        // It seems EW solves this by checking if each file in the db is in the project,
        // but i'm not sure how I would do that in VS Code
        if (Fs.existsSync(dbPath)) {
            Fs.unlinkSync(dbPath);
        }
        const iarbuild = spawn(builderPath, [projectPath, "-cstat_analyze", configurationName, "-log", "info"]);
        iarbuild.stdout.on("data", data => {
            onWrite?.(data.toString());
        });

        await new Promise<void>((resolve, reject) => {
            iarbuild.on("exit", (code) => {
                if (code !== 0) {
                    reject(new Error("C-STAT exited with code: " + code));
                } else {
                    resolve(); // C-STAT is done!
                }
            });
        });

        return getAllWarnings(dbPath, extensionPath);
    }

    export function SeverityStringToSeverityEnum(severity: string): CStatWarningSeverity {
        switch (severity) {
        case "Low":    return CStatWarningSeverity.LOW;
        case "Medium": return CStatWarningSeverity.MEDIUM;
        case "High":   return CStatWarningSeverity.HIGH;
        default:
            console.log("Unrecognized C-STAT severity: " + severity);
            return CStatWarningSeverity.HIGH;
        }
    }

    /**
     * Returns all warnings from the last C-STAT analysis.
     */
    function getAllWarnings(dbPath: string, extensionPath: string): Promise<CStatWarning[]> {
        // we use the sqlite3 executable CLI to perform queries against the database
        const sqliteBin = getSqliteBinaryName();
        if (sqliteBin === null) {
            return Promise.reject(new Error("Couldn't find sqlite binaries for cstat. Your OS likely isn't supported."));
        }
        const sqliteBinPath = join(extensionPath, "sqlite-bin", sqliteBin);
        if (!Fs.existsSync(dbPath)) {
            return Promise.reject(new Error("Couldn't find cstat DB: " + dbPath));
        }

        return new Promise((resolve, reject) => {
            const sqlProc = spawn(sqliteBinPath, [dbPath, "-csv"]); // we want csv output for easier parsing

            sqlProc.stdin.write("SELECT sql FROM sqlite_master WHERE type IS 'table' AND name IS 'warnings';\n");
            sqlProc.stdout.once("data", tableData => {
                // The name of the check is contained in property_alias if present, otherwise in property_id
                const checkIdColumn = tableData.toString().includes("property_alias") ? "property_alias" : "property_id";

                sqlProc.stdin.write("SELECT Count(*) FROM warnings;\n");
                sqlProc.stdout.once("data", data => {
                    const expectedRows = Number(data.toString());

                    if (expectedRows > 0) {
                        const query = `SELECT ${fieldsToLoad.join(",")},${checkIdColumn} FROM warnings;\n`;
                        sqlProc.stdin.write(query);
                        let output = "";
                        sqlProc.stdout.on("data", data => {
                            output += data.toString();
                            try {
                                const warnsRaw: string[][] = CsvParser(output);
                                const warnings = warnsRaw.map(row => parseWarning(row));
                                if (warnings.length === expectedRows) {
                                    resolve(warnings);  // We are done
                                    sqlProc.kill();
                                }
                            } catch (e) { } // CsvParser will throw if we havent recieved all output yet
                        });
                    } else {
                        resolve([]);
                        sqlProc.kill();
                    }

                }); /* stdout.once() */
            }); /* stdout.once() */

            sqlProc.stderr.on("data", data => {
                reject(data.toString());
                sqlProc.kill();
            });
        }); /* new Promise() */
    }

    function parseWarning(warnRow: string[]): CStatWarning {
        const file     = warnRow[fieldsToLoad.indexOf(CStatWarningField.FILE_NAME)];
        const line     = warnRow[fieldsToLoad.indexOf(CStatWarningField.LINE)];
        const col      = warnRow[fieldsToLoad.indexOf(CStatWarningField.COLUMN)];
        const message  = warnRow[fieldsToLoad.indexOf(CStatWarningField.MSG)];
        const severity = warnRow[fieldsToLoad.indexOf(CStatWarningField.SEVERITY)];
        const checkId  = warnRow[warnRow.length - 1];
        if (!file || !line || !col || !message || !severity || !checkId) {
            throw new Error("One or more fields missing from row: " + warnRow.toString());
        }
        return {
            file: file,
            line: Number(line),
            col: Number(col),
            message: message,
            severity: SeverityStringToSeverityEnum(severity),
            checkId: checkId,
        };
    }

    function getSqliteBinaryName(): string | null {
        switch (OsUtils.detectOsType()) {
        case OsUtils.OsType.Windows:
            return "sqlite-v3.26.0-win32-x86.exe";
        case OsUtils.OsType.Linux:
            if (OsUtils.detectArchitecture() === OsUtils.Architecture.x64) {
                return "sqlite-v3.26.0-linux-x64";
            } else {
                return "sqlite-v3.26.0-linux-x86";
            }
        case OsUtils.OsType.Mac:
            return "sqlite-v3.26.0-osx-x86";
        default:
            return null;
        }
    }
}