import assert from "node:assert/strict";
import path from "node:path";

import { parse } from "../src/index.js";
import { FileNotFoundError } from "../src/errors.js";

export const tests = [
  {
    name: "throws an error if there is no file",
    script: async () => {
      await assert.rejects(parse("non-existant-file.csv"), FileNotFoundError);
    },
  },
  {
    name: "does not throw if there is a csv file",
    script: async () => {
      const csvPath = path.resolve(import.meta.dirname, "empty.csv");
      await parse(csvPath);
    },
  },
  {
    name: "reads three records from csv",
    script: async () => {
      const csvPath = path.resolve(import.meta.dirname, "three-records.csv");
      const records = await parse(csvPath);
      const expected = [
        ["10", "20"],
        ["30", "40"],
        ["50", "60"],
      ];
      assert.deepEqual(records, expected);
    },
  },
  {
    name: "reads double quote enclosed fields from csv",
    script: async () => {
      const csvPath = path.resolve(
        import.meta.dirname,
        "double-quote-enclosed-fields.csv"
      );
      const records = await parse(csvPath);
      const expected = [
        ["10", "20"],
        ["30", "40"],
      ];
      assert.deepEqual(records, expected);
    },
  },
  {
    name: "reads escaped double quotes from csv",
    script: async () => {
      const csvPath = path.resolve(
        import.meta.dirname,
        "escaped-double-quotes.csv"
      );
      const records = await parse(csvPath);
      const expected = [
        ['"', '""'],
        ['"""', '""""'],
      ];
      assert.deepEqual(records, expected);
    },
  },
];
