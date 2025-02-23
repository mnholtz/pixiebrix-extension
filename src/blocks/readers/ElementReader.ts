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

import { Reader } from "@/types";
import { Schema } from "@/core";
import { registerBlock } from "@/blocks/registry";
import { fromPairs } from "lodash";

class ElementReader extends Reader {
  constructor() {
    super(
      "@pixiebrix/html/element",
      "HTML element reader",
      "Read all attributes and JQuery data from an HTML element."
    );
  }

  async read(elementOrDocument: HTMLElement | Document) {
    const element = elementOrDocument as HTMLElement;

    if (!element?.tagName) {
      throw new Error(`Expected an HTML Element`);
    }

    const $element = $(element);

    return {
      tagName: element.tagName,
      attrs: fromPairs(
        Object.values(element.attributes).map((x) => [x.name, x.value])
      ),
      text: $element.text().trim(),
      data: $element.data(),
    };
  }

  outputSchema: Schema = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    type: "object",
    properties: {
      tagName: {
        type: "string",
      },
      text: {
        type: "string",
        description:
          "The combined text contents of element, including its descendants. See https://api.jquery.com/text/",
      },
      attrs: {
        type: "object",
        additionalProperties: { type: "string" },
      },
      data: {
        type: "object",
        additionalProperties: true,
      },
    },
    required: ["tagName", "attrs", "data", "text"],
    additionalProperties: false,
  };

  async isAvailable() {
    return true;
  }
}

registerBlock(new ElementReader());
