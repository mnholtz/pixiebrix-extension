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
import { registerBlock } from "@/blocks/registry";
import { BlockArg, BlockOptions, Schema, SchemaProperties } from "@/core";
import UiPathRobot from "@/contrib/uipath/UiPathRobot";
import { JobResult, RobotProcess } from "@uipath/robot/dist/models";

UiPathRobot.settings.disableTelemetry = true;

export const UIPATH_ID = "@pixiebrix/uipath/local-process";

export const UIPATH_PROPERTIES: SchemaProperties = {
  releaseKey: {
    type: "string",
    description: "The local UiPath process id",
  },
  inputArguments: {
    type: "object",
    additionalProperties: true,
  },
};

export class RunLocalProcess extends Transformer {
  constructor() {
    super(
      UIPATH_ID,
      "Run local UiPath process",
      "Run a UiPath process using your local UiPath assistant"
    );
  }

  inputSchema: Schema = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    type: "object",
    required: ["releaseKey"],
    properties: UIPATH_PROPERTIES,
  };

  async transform(
    { releaseKey, inputArguments = {} }: BlockArg,
    { logger }: BlockOptions
  ): Promise<JobResult> {
    return new Promise((resolve, reject) => {
      UiPathRobot.on("missing-components", () => {
        reject(new Error("UiPath Assistant not found. Is it installed?"));
      });

      const robot = UiPathRobot.init();

      robot.getProcesses().then((processes: RobotProcess[]) => {
        const process = processes.find(
          (x: RobotProcess) => x.id === releaseKey
        );
        if (!process) {
          logger.error(`Cannot find UiPath release: ${releaseKey}`);
          throw new Error(`Cannot find UiPath release`);
        }
        console.debug("Running local UiPath process", { releaseKey });
        process.start(inputArguments).then(
          (result) => {
            console.debug("Forwarding result from local UiPath process", {
              result,
              releaseKey,
            });
            resolve(result);
          },
          (reason) => reject(reason)
        );
      });
    });
  }
}

registerBlock(new RunLocalProcess());
