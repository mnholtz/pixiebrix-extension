/*
 * Copyright (C) 2020 Pixie Brix, LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Effect } from "@/types";
import { registerBlock } from "@/blocks/registry";
import {
  appendRows,
  createTab,
  getHeaders,
} from "@/contrib/google/sheets/handlers";
import { BlockArg, BlockOptions, Schema } from "@/core";
import { propertiesToSchema } from "@/validators/generic";
import { isNullOrBlank } from "@/utils";

type CellValue = string | number | null;

interface RowValue {
  header: string;
  value: CellValue;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim();
}

export const APPEND_SCHEMA: Schema = propertiesToSchema(
  {
    spreadsheetId: {
      type: "string",
      description: "The ID of the spreadsheet to update.",
    },
    tabName: {
      type: "string",
      description: "The tab name of the spreadsheet to update.",
    },
    rowValues: {
      oneOf: [
        {
          type: "object",
          description: "The row to append to the sheet",
          additionalProperties: { type: ["number", "string", "null"] },
        },
        {
          type: "array",
          description: "The row to append to the sheet",
          items: {
            type: "object",
            properties: {
              header: { type: "string" },
              value: { type: ["number", "string", "null"] },
            },
            required: ["header"],
          },
          minItems: 1,
        },
      ],
    },
  },
  ["spreadsheetId", "tabName", "rowValues"]
);

function makeValues(headerRow: string[], rowValues: RowValue[]): CellValue[] {
  const row = [];
  const matched = new Set();

  const fields = headerRow.map(normalizeHeader);
  console.debug(`Normalized headers: ${fields.join(", ")}`);

  for (const header of fields) {
    const normalizedHeader = normalizeHeader(header);
    const rowValue = rowValues.find(
      (x) => normalizeHeader(x.header) === normalizedHeader
    );
    if (rowValue) {
      matched.add(rowValue.header);
      row.push(rowValue.value);
    } else {
      row.push(null);
    }
  }
  const unmatched = rowValues
    .map((x) => x.header)
    .filter((x) => !matched.has(x));
  if (unmatched.length) {
    console.warn(
      `${unmatched.length} field(s) were unmatched: ${unmatched.join(", ")}`
    );
  }
  return row;
}

export const GOOGLE_SHEETS_API_ID = "@pixiebrix/google/sheets-append";

function isAuthError(error: { code: number }): boolean {
  return [404, 401, 403].includes(error.code);
}

export class GoogleSheetsAppend extends Effect {
  constructor() {
    super(
      GOOGLE_SHEETS_API_ID,
      "Add Google sheet row",
      "Add a row of data to a Google sheet",
      "faTable"
    );
  }

  inputSchema: Schema = APPEND_SCHEMA;

  async effect(
    { spreadsheetId, tabName, rowValues: rawValues = {} }: BlockArg,
    { logger }: BlockOptions
  ): Promise<void> {
    const rowValues =
      typeof rawValues === "object"
        ? Object.entries(rawValues).map(([header, value]) => ({
            header,
            value,
          }))
        : rawValues;

    const valueHeaders = rowValues.map((x: RowValue) => x.header);
    let currentHeaders: string[];

    try {
      currentHeaders = await getHeaders(spreadsheetId, tabName);
      console.debug(
        `Found headers for ${tabName}: ${currentHeaders.join(", ")}`
      );
    } catch (error) {
      logger.warn(`Error retrieving headers: ${error.toString()}`, error);
      if (isAuthError(error)) {
        throw error;
      }
      logger.info(`Creating tab ${tabName}`);
      await createTab(spreadsheetId, tabName);
    }

    if (!currentHeaders || currentHeaders.every((x) => isNullOrBlank(x))) {
      logger.info(`Writing header row for ${tabName}`);
      await appendRows(spreadsheetId, tabName, [valueHeaders]);
      currentHeaders = valueHeaders;
    }

    await appendRows(spreadsheetId, tabName, [
      makeValues(currentHeaders, rowValues),
    ]);
  }
}

registerBlock(new GoogleSheetsAppend());
