"use strict";

import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

main()
  .catch((error) => {
    console.error("Could not run tests, got an error.");
    console.error(error);
    process.exit(1);
  })
  .then(() => console.error("Ran tests successfully."));

async function main() {
  const testDirBasename = "tests";
  const testDirPath = path.resolve(import.meta.dirname, "tests");
  const testDirFiles = fs.readdirSync(testDirPath, {
    recursive: true,
  });
  const testFiles = testDirFiles.filter((file) => file.endsWith("test.js"));
  assert(
    testFiles.length > 0,
    `Found 0 test files in dir ${testDirPath}, this is probably a bug.`
  );

  const allTests = [];
  for (const file of testFiles) {
    // I think node modules need to use posix path (/), not windows (\).
    const nodeModulePath = "./" + path.posix.join(testDirBasename, file);
    let testModule;
    try {
      testModule = await import(nodeModulePath);
    } catch (error) {
      console.error(`Could not import test module ${nodeModulePath}.`);
      throw error;
    }
    assert(
      testModule.tests.length > 0,
      "Test module exports no tests, this is probably a bug."
    );
    const tests = testModule.tests.map((test) => {
      assert(test.name, `Test in file ${nodeModulePath} is missing a name.`);
      assert(
        test.script,
        `Test in file ${nodeModulePath} is missing a script.`
      );
      const testWithPath = {
        ...test,
        filePath: nodeModulePath,
      };
      return testWithPath;
    });
    allTests.push(...tests);
  }

  let testsToRun = [];
  const foundOnlyOption = allTests.some((test) => test.only);
  if (foundOnlyOption) {
    testsToRun = allTests.filter((test) => test.only);
  } else {
    testsToRun = allTests;
  }

  if (foundOnlyOption) {
    console.log(
      `Only running ${testsToRun.length}/${allTests.length} tests...\n`
    );
  }

  const testResults = [];
  for (const test of testsToRun) {
    let pass;
    let scriptError = null;
    try {
      await test.script();
      pass = true;
    } catch (error) {
      pass = false;
      scriptError = error;
    }
    const result = {
      pass,
      error: scriptError,
      name: test.name,
      filePath: test.filePath,
    };
    const passLabel = result.pass ? "PASS" : "FAIL";
    console.log(`${passLabel} ${result.filePath} ${result.name}`);
    testResults.push(result);
  }
  console.log();

  assert(
    testResults.length > 0,
    "Have 0 test results, this is probably a bug."
  );

  const numFailed = testResults.filter((result) => !result.pass).length;
  if (numFailed > 0) {
    console.log(`${numFailed}/${testResults.length} tests failed`);
    const failResults = testResults.filter((result) => !result.pass);
    for (const failResult of failResults) {
      console.log(
        `FAIL ${failResult.filePath} "${
          failResult.name
        }" ${failResult.error.toString()}`
      );
      console.error(failResult.error);
      console.log();
    }
  }

  if (numFailed == 0) {
    console.log(`${testResults.length}/${testResults.length} tests passed`);
    console.log();
  }
}
