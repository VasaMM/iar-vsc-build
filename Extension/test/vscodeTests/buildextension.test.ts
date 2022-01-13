
import { fail, deepEqual } from "assert";
import * as assert from "assert";
import {UI} from "../../src/extension/ui/app";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Settings } from "../../src/extension/settings";
import {ProjectListModel} from "../../src/extension/model/selectproject";
import { TestUtils } from "../../utils/testutils/testUtils";
import { Project } from "../../src/iar/project/project";
import {IarUtils} from "../../utils/iarUtils";
import { TestSandbox } from "../../utils/testutils/testSandbox";
import { VscodeTestsUtils } from "./utils";
import { readdir, rm } from "fs/promises";
import { VscodeTestsSetup } from "./setup";
import { FsUtils } from "../../src/utils/fs";

export namespace Utils{
    export const EXTENSION_ROOT = path.join(path.resolve(__dirname), "../../../");
    export const TEST_PROJECTS_ROOT = path.join(EXTENSION_ROOT, "test/vscodeTests/TestProjects");

    // Tags for the tasks that can be executed
    export const  BUILD = "Iar Build";
    export const  REBUILD = "Iar Rebuild";
    export const  CLEAN = "Iar Clean";
    export const  OPEN = "Iar Open";

    export async function assertFileExists(path: string) {
        assert(await FsUtils.exists(path), `Expected ${path} to exist`);
    }
    export async function assertFileNotExists(path: string) {
        assert(!(await FsUtils.exists(path)), `Expected ${path} not to exist`);
    }



    export async function createProject(projName: string) {
        const exWorkbench = await UI.getInstance().extendedWorkbench.selectedPromise;
        if (!exWorkbench) {
            fail("Failed to get the active workbench");
        }

        // Locate the Test folder in the workspace.
        const workspaces = vscode.workspace.workspaceFolders;
        if (!workspaces) {
            fail("Failed to list the folders in the workspace: This test requires a workspace");
        }

        const newProj = path.join(workspaces[0]!.uri.fsPath, projName);
        const proj = await exWorkbench.createProject(newProj);

        (UI.getInstance().project.model as ProjectListModel).addProject(proj);
        return newProj;
    }

    export function setupProject(id: number, target: string, ewpFile: string, sandbox: TestSandbox) {
        // The unique output folder
        const outputFolder = sandbox.copyToSandbox(path.dirname(ewpFile), "Test_" + target + "_" + id);
        // The unique name of the ewp-file.
        const ewpId = `${path.basename(ewpFile, ".ewp")}_${target}_${id}.ewp`;

        // Generate the name of the outputfile
        const outputFile: string = path.join(outputFolder, ewpId);
        // Generate the ewp-file to work with.
        TestUtils.patchEwpFile(target, ewpFile, outputFile);
        // Add the ewp-file to the list of project.
        (UI.getInstance().project.model as ProjectListModel).addProject(new Project(outputFile));

        // Remove the unpatched ewp from the sandbox
        fs.unlinkSync(path.join(outputFolder, path.basename(ewpFile)));

        return {ewp: ewpId, folder: outputFolder};
    }
}



suite("Test build extension", ()=>{

    let sandbox: TestSandbox;

    suiteSetup(async() => {
        await VscodeTestsUtils.ensureExtensionIsActivated();
        VscodeTestsSetup.setup();
        sandbox = VscodeTestsSetup.sandbox!;
        // Remove any build results from previous runs
        const nodes = await readdir(sandbox.path);
        return Promise.all(
            nodes.filter(node => node.match(/^Test_\w+_\d+/)).map(node => {
                return rm(path.join(sandbox.path, node), {recursive: true, force: true});
            })
        );
    });

    test("Load projects in directory", ()=>{
        const allProjects = VscodeTestsUtils.getEntries(VscodeTestsUtils.PROJECT);
        VscodeTestsUtils.assertNodelistContains(allProjects, "BasicDebugging");
        VscodeTestsUtils.assertNodelistContains(allProjects, "C-STATProject");
        VscodeTestsUtils.assertNodelistContains(allProjects, "LedFlasher");
    });

    test("No backups in project list", ()=>{
        const allProjects = VscodeTestsUtils.getEntries(VscodeTestsUtils.PROJECT);
        if (Array.isArray(allProjects)) {
            allProjects.forEach(project => {
                if (project.label?.toString().startsWith("Backup ")) {
                    fail("Backup files should not be included in the list of projects");
                }
            });
        }
    });

    test("Load all configurations", async()=>{
        await VscodeTestsUtils.activateProject("BasicDebugging").then(()=>{
            const allConfigurations = VscodeTestsUtils.getEntries(VscodeTestsUtils.CONFIG);
            VscodeTestsUtils.assertNodelistContains(allConfigurations, "Debug");
            VscodeTestsUtils.assertNodelistContains(allConfigurations, "Release");
        });
    } );

    test("Check IAR tasks exist", async()=>{
        const taskToFind: string[] = [Utils.BUILD, Utils.REBUILD, Utils.CLEAN, Utils.OPEN];
        // Needs to be awaited otherwise the fetchtasks does not return anything.
        await VscodeTestsUtils.activateProject("BasicDebugging");

        return vscode.tasks.fetchTasks({type : "iar"}).then((iarTasks)=>{
            const taskNames = iarTasks.map(task => task.name);
            assert.deepStrictEqual(taskNames.sort(), taskToFind.sort());
        }, (err)=>{
            fail(err);
        });
    });

    test("Build and clean project with all listed EW:s", async function() {
        this.timeout(50000);
        const ewpFile = path.join(path.join(Utils.EXTENSION_ROOT, "test/vscodeTests/BasicProject", "BasicProject.ewp"));
        const listedEws = VscodeTestsUtils.getEntries(VscodeTestsUtils.EW);
        let id = 1;
        if (Array.isArray(listedEws)) {
            for (const ew of listedEws) {
                assert.strictEqual(typeof ew.label, "string");
                VscodeTestsUtils.activateWorkbench(ew.label as string);
                // The tooltip is the absolute path to the current workbench. Read all the targets from the workbench.
                const targets: string[] = IarUtils.getTargetsFromEwPath(ew.tooltip!.toString());
                for (const target of targets) {
                    // Generate a testproject to build using the generic template
                    const testEwp = Utils.setupProject(id++, target.toUpperCase(), ewpFile, sandbox);
                    // Build the project.
                    await VscodeTestsUtils.runTaskForProject(Utils.BUILD, path.basename(testEwp.ewp, ".ewp"), "Debug");
                    // Check that an output file has been created
                    const exeFile = path.join(testEwp.folder, "Debug", "Exe", path.basename(testEwp.ewp, ".ewp") + ".out");
                    await Utils.assertFileExists(exeFile);
                    // Check that warnings are parsed correctly
                    // Doesn't seem like diagnostics are populated instantly after running tasks, so wait a bit
                    await new Promise((p, _) => setTimeout(p, 2000));
                    const srcFile = path.join(testEwp.folder, "main.c");
                    const diagnostics = vscode.languages.getDiagnostics(vscode.Uri.file(srcFile));
                    assert.strictEqual(diagnostics[0]?.message,  "variable \"unused\" was declared but never referenced");
                    assert.deepStrictEqual(diagnostics[0]?.range, new vscode.Range(new vscode.Position(2, 0), new vscode.Position(2, 0)));
                    assert.strictEqual(diagnostics[0]?.severity, vscode.DiagnosticSeverity.Warning);

                    // Clean the project.
                    await VscodeTestsUtils.runTaskForProject(Utils.CLEAN, path.basename(testEwp.ewp, ".ewp"), "Debug");
                    await Utils.assertFileNotExists(exeFile);
                }
            }
        }
    });

    test("Check that all EW's are listed", ()=>{
        // Get the list of configured workbenches.
        const configuredEws: string[] | undefined = vscode.workspace.getConfiguration("iarvsc").get<string[]>(Settings.ExtensionSettingsField.IarInstallDirectories);
        if (!configuredEws) {
            fail("No listed workbenches found");
        }

        // Get the list of selectable ew:s
        const listedEws = VscodeTestsUtils.getEntries(VscodeTestsUtils.EW);
        if (Array.isArray(listedEws)) {
            // Check that the lists are the same.
            deepEqual(configuredEws?.length, listedEws.length);
            for (const configuredEw of configuredEws) {
                const ewId: string = path.basename(configuredEw.toString());
                VscodeTestsUtils.assertNodelistContains(listedEws, ewId);
            }
        } else {
            fail("Failed to collect configurable workbenches.");
        }
    });

});