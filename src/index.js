import fs from "node:fs";
import assert from "node:assert/strict";

import { FileNotFoundError } from "./errors.js";

export const parse = async (csvPath) => {
  assert(csvPath && csvPath.length > 0, "Missing path to csv.");

  let fileContent;
  try {
    fileContent = await fs.promises.readFile(csvPath, { encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new FileNotFoundError();
    }
    throw error;
  }

  // TODO: come up with some simpler way of doing this.
  const records = [];
  let recordBuffer = [];
  let fieldBuffer = "";
  let isDoubleQuoteEnclosedField = false;
  for (let i = 0; i < fileContent.length; i++) {
    const char = fileContent[i];
    const nextChar = fileContent[i + 1];
    if (char == '"') {
      if (!isDoubleQuoteEnclosedField) {
        isDoubleQuoteEnclosedField = true;
        continue;
      }

      if (nextChar != '"') {
        isDoubleQuoteEnclosedField = false;
        continue;
      }

      // If char is a double quote and next char is another quote then it is an escaped double quote.
      fieldBuffer += char + nextChar;
      i++;
      continue;
    }

    if (isDoubleQuoteEnclosedField) {
      fieldBuffer += char;
      continue;
    }

    if (char == ",") {
      recordBuffer.push(fieldBuffer);
      fieldBuffer = "";
      continue;
    }

    const isPosixNewline = char == "\n";
    if (isPosixNewline) {
      recordBuffer.push(fieldBuffer);
      fieldBuffer = "";
      records.push(recordBuffer);
      recordBuffer = [];
      continue;
    }

    const nextCharIsEndOfFile = nextChar == undefined;
    if (nextCharIsEndOfFile) {
      fieldBuffer += char;
      recordBuffer.push(fieldBuffer);
      fieldBuffer = "";
      records.push(recordBuffer);
      recordBuffer = [];
      continue;
    }

    const isWindowsNewline = char + nextChar == "\r\n";
    if (isWindowsNewline) {
      recordBuffer.push(fieldBuffer);
      fieldBuffer = "";
      records.push(recordBuffer);
      recordBuffer = [];
      // Advance an additional index to Move past both the \r and upcoming \n.
      i++;
      continue;
    }

    fieldBuffer += char;
  }

  if (fieldBuffer.length > 0) {
    recordBuffer.push(fieldBuffer);
    fieldBuffer = "";
  }

  if (recordBuffer.length > 0) {
    records.push(recordBuffer);
    recordBuffer = [];
  }

  return records;
};
