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

  // For better performance, it's possible to parse the file contents in one pass.
  // For reduced complexity, break parsing down into two passes.
  // Parsing pass 1: Split file contents into records.
  // Csv records are separated by newlines. But csv fields can be enclosed by
  // double quotes, so any newlines that appear within them are part of the
  // field's value.
  const fileContentsSplitByRecord = [];
  let recordBuffer = "";
  let enclosedField = false;
  for (let i = 0; i < fileContent.length + 1; i++) {
    const char = fileContent[i];
    const nextChar = fileContent[i + 1];

    if (char === '"') {
      // One double quote (") indicates the start of an enclosed field.
      if (!enclosedField) {
        enclosedField = true;
        continue;
      }
      // Two double quotes ("") is an escaped double quote.
      if (char + nextChar === '""') {
        recordBuffer += char;
        // Jump forward two indices since we just parsed two characters.
        i++;
        continue;
      }
      // Only remaining possibility is that this quote indicates the end of an
      // enclosed field.
      enclosedField = false;
      continue;
    }

    // Any character within a double quote enclosed field is part of the field.
    if (enclosedField) {
      recordBuffer += char;
      continue;
    }

    // Newlines indicate the end of a record.
    // \n is a Posix newline, \r\n is a Windows newline.
    if (char === "\n") {
      fileContentsSplitByRecord.push(recordBuffer);
      recordBuffer = "";
      continue;
    }
    if (char + nextChar === "\r\n") {
      fileContentsSplitByRecord.push(recordBuffer);
      recordBuffer = "";
      // Jump forward two indices since we just parsed two characters.
      i++;
      continue;
    }
    // The loop iterates 1 index past the file content's length. If this
    // character is undefined it means we've finished parsing the file's
    // contents.
    if (char === undefined) {
      fileContentsSplitByRecord.push(recordBuffer);
      recordBuffer = "";
      continue;
    }

    // If the character isn't any of the above, it must be a normal character.
    recordBuffer += char;
  }

  // Parsing pass 2: Split records into fields.
  const recordList = fileContentsSplitByRecord.map((record) =>
    record.split(",")
  );

  return recordList;
};
