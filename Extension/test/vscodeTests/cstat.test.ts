import * as Assert from "assert";
import * as Vscode from "vscode";
import * as path from "path";
import { VscodeTestsUtils } from "./utils";
import { OsUtils } from "../../utils/osUtils";
import { readdir, unlink } from "fs/promises";
import { VscodeTestsSetup } from "./setup";
import { ExtensionState } from "../../src/extension/extensionstate";

namespace Utils {
    export function assertDiagnosticEquals(actual: Vscode.Diagnostic, expected: Vscode.Diagnostic) {
        Assert.strictEqual(actual.message, expected.message);
        Assert.strictEqual(actual.source, expected.source);
        Assert.strictEqual(actual.severity, expected.severity);
        Assert.deepStrictEqual(actual.range, expected.range);
        Assert.strictEqual(actual.relatedInformation?.length, expected.relatedInformation?.length, "Related information does not match for " + expected.message);
        actual.relatedInformation?.forEach((relatedInformation, i) => {
            Assert.strictEqual(relatedInformation.message, expected.relatedInformation![i]!.message, "Related information does not match for " + expected.message);
            Assert.deepStrictEqual(relatedInformation.location.range, expected.relatedInformation![i]!.location.range, "Related information does not match for " + expected.message);
            Assert(OsUtils.pathsEqual(relatedInformation.location.uri.fsPath, expected.relatedInformation![i]!.location.uri.fsPath), "Related information does not match for " + expected.message);
        });
    }
}

suite("Test C-STAT", ()=>{
    const ANALYSIS_TASK = "Run C-STAT Analysis";
    const ANALYSIS_TASK_CONFIGURED = "iar-cstat: Run C-STAT Analysis (configured)";
    const CLEAR_TASK = "Clear C-STAT Diagnostics";
    const CLEAR_TASK_CONFIGURED = "iar-cstat: Clear C-STAT Diagnostics (configured)";

    const TARGET_PROJECT = "C-STATProject";

    let sandboxPath: string;
    let originalFilterLevel: string | undefined;
    let srcFilePath: string;

    suiteSetup(async() => {
        await VscodeTestsUtils.ensureExtensionIsActivated();
        sandboxPath = VscodeTestsSetup.setup();
        originalFilterLevel = Vscode.workspace.getConfiguration("iarvsc").get("c-stat.filterLevel");
        srcFilePath = path.join(sandboxPath, TARGET_PROJECT, "main.c");
        // Remove all backup files, since too many backup files will cause iarbuild to fail
        const nodes = await readdir(path.join(sandboxPath, TARGET_PROJECT));
        return Promise.all(
            nodes.filter(node => node.startsWith("Backup")).map(node => unlink(path.join(sandboxPath, TARGET_PROJECT, node)))
        );
    });

    suiteTeardown(() => {
        Vscode.workspace.getConfiguration("iarvsc").update("c-stat.filterLevel", originalFilterLevel);
    });

    // Gets all diagnostics in the c-stat test project.
    const getDiagnostics = () => {
        const projectDir = path.join(sandboxPath, TARGET_PROJECT);
        return Vscode.languages.getDiagnostics().filter(diag => !path.relative(projectDir, diag[0].fsPath).startsWith(".."));
    };

    test("Tasks exist", async() => {
        const expectedTasks = [ANALYSIS_TASK, CLEAR_TASK, ANALYSIS_TASK_CONFIGURED, CLEAR_TASK_CONFIGURED];

        const tasks = await Vscode.tasks.fetchTasks({ type: "iar-cstat" });
        const taskNames = tasks.map(task => task.name);
        Assert.deepStrictEqual(taskNames.sort(), expectedTasks.sort());
    });

    const makePosition = (line: number, col: number) => {
        return new Vscode.Position(Math.max(line - 1, 0), Math.max(col - 1, 0));
    };
    const makeRange = (line: number, col: number) => {
        const pos = makePosition(line, col);
        return new Vscode.Range(pos, pos);
    };

    const generateExpectedDiagnostics: () => Vscode.Diagnostic[] = () => [
        { message: "An integer constant is used with a pointer in the expression `0'", source: "MISRAC2012-Rule-11.9 [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(9, 12), relatedInformation: [] },
        { message: "Variable `arr' is only used once", source: "MISRAC++2008-0-1-4_a [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(25, 10), relatedInformation: [] },
        { message: "Variable `local' is not modified and should be declared `const'", source: "MISRAC++2008-7-1-1 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(15, 9), relatedInformation: [] },
        { message: "The return value of this call to `printf()' is discarded", source: "MISRAC++2008-0-1-7,MISRAC2012-Rule-17.7 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(19, 5), relatedInformation: [] },
        { message: "Implicit conversion of `a' from essential type signed 32-bit int to different or narrower essential type character", source: "MISRAC2012-Rule-10.3 [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(26, 14), relatedInformation: [
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "if (a) is false"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(26, 1)), "narrow_or_different_essential_type"),
        ] },
        { message: "Function call `bad_fun()' is immediately dereferenced, without checking for NULL", source: "PTR-null-fun-pos [High]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(23, 18), relatedInformation: [
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "if (a) is true"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "possible_null"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "Entering into bad_fun"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(9, 1)), "Return NULL"),
        ] },
        { message: "Array `arr' 1st subscript 4 is out of bounds [0,3]", source: "ARR-inv-index,MISRAC++2008-5-0-16_c,MISRAC2012-Rule-18.1_a,CERT-ARR30-C_a [High]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(26, 8), relatedInformation: [] },
        { message: "Missing return statement on some paths", source: "MISRAC++2008-8-4-3,MISRAC2004-16.8,MISRAC2012-Rule-17.4 [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(13, 5), relatedInformation: [
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(13, 1)), "MISRAC++2008-8-4-3,MISRAC2004-16.8,MISRAC2012-Rule-17.4,SPC-return"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "if (a) is false"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(14, 1)), "return"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(27, 1)), "End of function "),
        ] },
        { message: "Calling standard library function `printf' without detecting and handling errors or casting explicitly to `void'", source: "CERT-ERR33-C_c [High]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(19, 5), relatedInformation: [
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(19, 1)), "Calling standard library function `printf' "),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "if (a) is false"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(14, 1)), "fn_return"),
        ] },
        { message: "`addOne' does not have a valid prototype, calls bypass all type checking", source: "FUNC-unprototyped-used [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(17, 11), relatedInformation: [] },
        { message: "A // style comment", source: "MISRAC2004-2.2 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(4, 1), relatedInformation: [] },
        { message: "A // style comment", source: "MISRAC2004-2.2 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(24, 5), relatedInformation: [] },
        { message: "Definition of externally-linked `global' has no compatible declaration", source: "MISRAC2012-Rule-8.4 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(6, 5), relatedInformation: [] },
        { message: "Definition of externally-linked `bad_fun()' has no compatible declaration", source: "MISRAC2012-Rule-8.4 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(8, 6), relatedInformation: [] },
        { message: "`addOne' does not have a valid prototype", source: "MISRAC2004-8.1,MISRAC2012-Rule-17.3,CERT-DCL31-C [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(17, 11), relatedInformation: [] },
        { message: "Source file is not compiled in strict C89 mode without extensions", source: "MISRAC2004-1.1 [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(0, 0), relatedInformation: [] },
        { message: "`main' does not have a valid prototype", source: "MISRAC2004-16.5,MISRAC2012-Rule-8.2_a [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(13, 5), relatedInformation: [] },
        { message: "`bad_fun' does not have a valid prototype", source: "MISRAC2004-16.5,MISRAC2012-Rule-8.2_a [Medium]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(8, 6), relatedInformation: [] },
        { message: "Use of <stdio.h> is not compliant", source: "MISRAC++2008-27-0-1,MISRAC2004-20.9,MISRAC2012-Rule-21.6 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(1, 19), relatedInformation: [] },
        { message: "Function `addOne' declared at block scope", source: "MISRAC2004-8.6 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(17, 11), relatedInformation: [] },
        { message: "Externally-linked object or function `bad_fun' is referenced in only one translation unit", source: "MISRAC2004-8.10,MISRAC2012-Rule-8.7 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(8, 6), relatedInformation: [] },
        { message: "Externally-linked object or function `addOne' is referenced in only one translation unit", source: "MISRAC2004-8.10,MISRAC2012-Rule-8.7 [Low]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(17, 11), relatedInformation: [] }
    ];

    // Expected to time out until VSC-75 is fixed (a bug in the VS Code platform)
    test("Run C-STAT on all listed EWs", async function() {
        this.timeout(50000);
        Vscode.workspace.getConfiguration("iarvsc").update("c-stat.filterLevel", "Low");
        const listedEws = ExtensionState.getInstance().workbench.workbenches;
        console.log(listedEws);
        for (const ew of listedEws) {
            VscodeTestsUtils.activateWorkbench(ew.name);

            // Make sure diagnostics are empty before we start
            let diagnostics = getDiagnostics().flatMap(pair => pair[1]);
            Assert.deepStrictEqual(diagnostics, [], "There were diagnostics before starting C-STAT task, check the test setup, or a previous test failed");

            await VscodeTestsUtils.runTaskForProject(ANALYSIS_TASK, TARGET_PROJECT, "Debug");
            const fileDiagnostics = getDiagnostics().filter(diag => diag[1].length > 0);
            Assert.strictEqual(fileDiagnostics.length, 1, "Expected diagnostics in main file (only)");
            Assert(OsUtils.pathsEqual(fileDiagnostics[0]![0].fsPath, srcFilePath));

            diagnostics = fileDiagnostics.flatMap(pair => pair[1]);
            const expectedDiagnostics = generateExpectedDiagnostics();
            Assert.strictEqual(diagnostics.length, expectedDiagnostics.length, "Actual and expected diagnostics are not the same length");
            diagnostics.sort((a, b) => a.message < b.message ? -1 : 1);
            expectedDiagnostics.sort((a, b) => a.message < b.message ? -1 : 1);
            diagnostics.forEach((diag, i) => {
                Utils.assertDiagnosticEquals(diag, expectedDiagnostics[i]!);
            });

            await VscodeTestsUtils.runTaskForProject(CLEAR_TASK, TARGET_PROJECT, "Debug");
            diagnostics = getDiagnostics().flatMap(pair => pair[1]);
            Assert.deepStrictEqual(diagnostics, [], "Not all C-STAT warnings were cleared");
        }
    });

    test("Run C-STAT with configured tasks", async()=>{
        Vscode.workspace.getConfiguration("iarvsc").update("c-stat.filterLevel", "Low");
        const targetProject = "C-STATProject";
        const listedEws = ExtensionState.getInstance().workbench.workbenches;
        for (const ew of listedEws) {
            VscodeTestsUtils.activateWorkbench(ew.name);

            // Make sure diagnostics are empty before we start
            let diagnostics = getDiagnostics().flatMap(pair => pair[1]);
            Assert.deepStrictEqual(diagnostics, [], "There were diagnostics before starting C-STAT task, check the test setup, or a previous test failed");

            await VscodeTestsUtils.runTaskForProject(ANALYSIS_TASK_CONFIGURED, targetProject, "Debug");
            const fileDiagnostics = getDiagnostics().filter(diag => diag[1].length > 0);
            Assert.strictEqual(fileDiagnostics.length, 1, "Expected diagnostics in main file (only)");
            Assert(OsUtils.pathsEqual(fileDiagnostics[0]![0].fsPath, srcFilePath));

            diagnostics = fileDiagnostics.flatMap(pair => pair[1]);
            const expectedDiagnostics = generateExpectedDiagnostics();
            Assert.strictEqual(diagnostics.length, expectedDiagnostics.length, "Actual and expected diagnostics are not the same length");
            diagnostics.sort((a, b) => a.message < b.message ? -1 : 1);
            expectedDiagnostics.sort((a, b) => a.message < b.message ? -1 : 1);
            diagnostics.forEach((diag, i) => {
                Utils.assertDiagnosticEquals(diag, expectedDiagnostics[i]!);
            });

            await VscodeTestsUtils.runTaskForProject(CLEAR_TASK_CONFIGURED, targetProject, "Debug");
            diagnostics = getDiagnostics().flatMap(pair => pair[1]);
            Assert.deepStrictEqual(diagnostics, [], "Not all C-STAT warnings were cleared");
        }
    });
    const generateExpectedDiagnosticsHigh: () => Vscode.Diagnostic[] = () => [
        { message: "Calling standard library function `printf' without detecting and handling errors or casting explicitly to `void'", source: "CERT-ERR33-C_c [High]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(19, 5), relatedInformation: [
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(19, 1)), "Calling standard library function `printf' "),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "if (a) is false"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(14, 1)), "fn_return"),
        ] },
        { message: "Array `arr' 1st subscript 4 is out of bounds [0,3]", source: "ARR-inv-index,MISRAC++2008-5-0-16_c,MISRAC2012-Rule-18.1_a,CERT-ARR30-C_a [High]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(26, 8), relatedInformation: [] },
        { message: "Function call `bad_fun()' is immediately dereferenced, without checking for NULL", source: "PTR-null-fun-pos [High]", severity: Vscode.DiagnosticSeverity.Warning, range: makeRange(23, 18), relatedInformation: [
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "if (a) is true"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "possible_null"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(23, 1)), "Entering into bad_fun"),
            new Vscode.DiagnosticRelatedInformation(new Vscode.Location(Vscode.Uri.file(srcFilePath), makePosition(9, 1)), "Return NULL"),
        ] },
    ];
    test("Run C-STAT with high filter level", async()=>{
        const targetProject = "C-STATProject";
        Vscode.workspace.getConfiguration("iarvsc").update("c-stat.filterLevel", "High");

        const listedEws = ExtensionState.getInstance().workbench.workbenches;
        for (const ew of listedEws) {
            VscodeTestsUtils.activateWorkbench(ew.name);

            // Make sure diagnostics are empty before we start
            let diagnostics = getDiagnostics().flatMap(pair => pair[1]);
            Assert.deepStrictEqual(diagnostics, [], "There were diagnostics before starting C-STAT task, check the test setup, or a previous test failed");

            await VscodeTestsUtils.runTaskForProject(ANALYSIS_TASK, targetProject, "Debug");
            const fileDiagnostics = getDiagnostics().filter(diag => diag[1].length > 0);
            Assert.strictEqual(fileDiagnostics.length, 1, "Expected diagnostics in main file (only)");
            Assert(OsUtils.pathsEqual(fileDiagnostics[0]![0].fsPath, srcFilePath));

            diagnostics = fileDiagnostics.flatMap(pair => pair[1]);
            const expectedDiagnosticsHigh = generateExpectedDiagnosticsHigh();
            Assert.strictEqual(diagnostics.length, expectedDiagnosticsHigh.length, "Actual and expected diagnostics are not the same length");
            diagnostics.sort((a, b) => a.message < b.message ? -1 : 1);
            expectedDiagnosticsHigh.sort((a, b) => a.message < b.message ? -1 : 1);
            diagnostics.forEach((diag, i) => {
                Utils.assertDiagnosticEquals(diag, expectedDiagnosticsHigh[i]!);
            });

            await VscodeTestsUtils.runTaskForProject(CLEAR_TASK_CONFIGURED, targetProject, "Debug");
            diagnostics = getDiagnostics().flatMap(pair => pair[1]);
            Assert.deepStrictEqual(diagnostics, [], "Not all C-STAT warnings were cleared");
        }
    });
});