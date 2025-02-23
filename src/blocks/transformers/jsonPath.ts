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

import { JSONPath } from "jsonpath-plus";
import { Transformer } from "@/types";
import { registerBlock } from "@/blocks/registry";
import { BlockArg, BlockOptions, Schema } from "@/core";

export class JSONPathTransformer extends Transformer {
  constructor() {
    super(
      "@pixiebrix/jsonpath",
      "JSONPath",
      "Apply a JSONPath expression: https://github.com/s3u/JSONPath",
      "faCode"
    );
  }

  inputSchema: Schema = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "JSONPath expression",
      },
    },
  };

  async transform(
    { path }: BlockArg,
    { ctxt }: BlockOptions
  ): Promise<unknown> {
    return JSONPath({ preventEval: true, path, json: ctxt });
  }
}

registerBlock(new JSONPathTransformer());
