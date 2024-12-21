import fs from "node:fs";
import assert from "node:assert/strict";

import { FileNotFoundError } from "./errors.js";

export const parse = (csvPath) => {
  assert(csvPath && csvPath.length > 0, "Missing path to csv.");

  let csvFileContent;
  try {
    csvFileContent = fs.readFileSync(csvPath, { encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new FileNotFoundError();
    }
    throw error;
  }
};
