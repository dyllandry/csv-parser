import assert from "node:assert/strict";

/**
 * These are smoke tests to make sure the test runner works.
 */
export const tests = [
  {
    name: "2 plus 2 equals 4",
    script: () => {
      assert(2 + 2 == 4);
    },
  },
  {
    name: "9 minus 3 equals 6",
    script: () => {
      assert(9 - 3 == 6);
    },
  },
];
