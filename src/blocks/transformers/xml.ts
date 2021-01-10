/*
 * Copyright (C) 2021 Pixie Brix, LLC
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

import { Transformer } from "@/types";
import { BlockArg, Schema } from "@/core";
import { propertiesToSchema } from "@/validators/generic";
import { registerBlock } from "@/blocks/registry";
import { mapValues } from "lodash";

export class XMLParser extends Transformer {
  constructor() {
    super(
      "@pixiebrix/xml/parser",
      "Parse an XML document",
      "Parse a string into an XML document"
    );
  }

  inputSchema: Schema = propertiesToSchema({
    input: {
      type: "string",
      description: "The XML string",
    },
    selectors: {
      type: "object",
      additionalProperties: {
        type: "string",
        description: "An XPath selector expression",
      },
    },
  });

  outputSchema: Schema = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    type: "object",
    additionalProperties: true,
  };

  async transform({
    input,
    selectors,
  }: BlockArg): Promise<Record<string, unknown>> {
    // https://developer.mozilla.org/en-US/docs/Web/XPath/Introduction_to_using_XPath_in_JavaScript
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, "application/xml");

    console.debug("Parse XML document", { input, doc });

    return mapValues(selectors, (expr) => {
      const result = doc.evaluate(
        expr,
        doc,
        null,
        XPathResult.STRING_TYPE,
        null
      );
      console.debug(`XPath ${expr}`, { result });
      return result.stringValue;
      // return (result.iterateNext() as any)?.value;
    });
  }
}

registerBlock(new XMLParser());
