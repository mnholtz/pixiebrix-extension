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

import { Renderer } from "@/types";
import { registerBlock } from "@/blocks/registry";
import { isEmpty } from "lodash";
import { BlockArg, BlockOptions, Schema } from "@/core";
import { v4 as uuidv4 } from "uuid";
import { Permissions } from "webextension-polyfill-ts";
import { executeForNonce } from "@/background/executor";

export class UiPathAppRenderer extends Renderer {
  constructor() {
    super(
      "@pixiebrix/uipath/app",
      "UiPath App",
      "Render a UiPath App with optional parameters"
    );
  }

  permissions: Permissions.Permissions = {
    origins: ["https://cloud.uipath.com/*"],
  };

  inputSchema: Schema = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The full UiPath app URL",
      },
      inputs: {
        type: "object",
        description: "Optional inputs to pass to the app",
        additionalProperties: true,
      },
      title: {
        type: "string",
        description: "The title of the iframe",
        default: "UiPath App",
      },
      width: {
        type: "string",
        description: "The width of the iframe",
        default: "100%",
      },
      height: {
        type: "string",
        description: "The height of the iframe",
        default: "400",
      },
    },
    required: ["url"],
  };

  async render(
    {
      url,
      inputs: rawInputs = {},
      title = "UiPath App",
      height = 400,
      width = "100%",
    }: BlockArg,
    { logger }: BlockOptions
  ): Promise<string> {
    // https://transitory.technology/browser-extensions-and-csp-headers/
    const frameSrc = chrome.extension.getURL("frame.html");

    const nonce = uuidv4();

    const frameURL = new URL(frameSrc);
    frameURL.searchParams.set("url", url);
    frameURL.searchParams.set("nonce", nonce);

    const inputs = rawInputs as Record<string, unknown>;

    if (!isEmpty(inputs)) {
      executeForNonce(
        nonce,
        "@pixiebrix/forms/set",
        {
          inputs: Object.entries(inputs).map(([key, value]) => ({
            selector: `[placeholder="in:${key}"]`,
            value,
          })),
        },
        {
          isAvailable: {
            // UiPath apps lazy load the inputs, so make sure they've been rendered before trying
            // to set the values
            selectors: [
              !isEmpty(inputs) ? ".root-container input" : ".root-container",
            ],
          },
          ctxt: {},
          messageContext: {
            blockId: this.id,
          },
        }
      ).catch((error) => {
        logger.error(error);
      });
    }

    return `<iframe src="${frameURL.toString()}" title="${title}" height="${height}" width="${width}" style="border:none;"></iframe>`;
  }
}

registerBlock(new UiPathAppRenderer());
