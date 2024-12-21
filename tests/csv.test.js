import assert from "node:assert/strict";
import path from "node:path";

import { parse } from "../src/index.js";
import { FileNotFoundError } from "../src/errors.js";

export const tests = [
  {
    name: "throws an error if there is no file",
    script: async () => {
      let capturedError;
      try {
        await parse("non-existant-file.csv");
      } catch (error) {
        capturedError = error;
      }
      assert(capturedError instanceof FileNotFoundError);
    },
  },
  {
    name: "does not throw if there is a csv file",
    script: async () => {
      const csvPath = path.resolve(import.meta.dirname, "empty.csv");
      await parse(csvPath);
    },
  },
];
