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

import { proxyService } from "@/background/requests";
import { Transformer } from "@/types";
import { mapValues } from "lodash";
import { registerBlock } from "@/blocks/registry";
import { BlockArg, BlockOptions, Schema, SchemaProperties } from "@/core";
import { sleep } from "@/utils";

export const AUTOMATION_ANYWHERE_RUN_BOT_ID =
  "@pixiebrix/automation-anywhere/run-bot";

const MAX_WAIT_MILLIS = 20_000;
const POLL_MILLIS = 1_000;

export const AUTOMATION_ANYWHERE_PROPERTIES: SchemaProperties = {
  service: {
    $ref:
      "https://app.pixiebrix.com/schemas/services/automation-anywhere/control-room",
  },
  fileId: {
    type: "string",
    description: "The file id of the bot",
    format: "\\d+",
  },
  deviceId: {
    type: "string",
    description: "The device to run the bot on",
    format: "\\d+",
  },
  awaitResult: {
    type: "boolean",
    default: false,
    description: "Wait for the process to complete and output the results.",
  },
  data: {
    type: "object",
    additionalProperties: true,
  },
};

interface DeployResponse {
  automationId: string;

  // deploymentId not coming back?
  deploymentId: string;
}

interface ActivityResponse {
  page: {
    offset: number;
    total: number;
    totalFilter: number;
  };
  // https://docs.automationanywhere.com/bundle/enterprise-v2019/page/enterprise-cloud/topics/control-room/control-room-api/cloud-orches-activity-list.html
  list: {
    status: "COMPLETED" | "IN PROGRESS" | "FAILED";
    message: string;
    outputVariables: Record<string, unknown>;
  }[];
}

export class RunBot extends Transformer {
  constructor() {
    super(
      AUTOMATION_ANYWHERE_RUN_BOT_ID,
      "Run Automation Anywhere Bot",
      "Run an Automation Anywhere Bot via the Enterprise Control Room API"
    );
  }

  inputSchema: Schema = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    type: "object",
    required: ["service", "fileId", "deviceId"],
    properties: AUTOMATION_ANYWHERE_PROPERTIES,
  };

  async transform(
    { service, fileId, deviceId, data, awaitResult = false }: BlockArg,
    options: BlockOptions
  ): Promise<unknown> {
    const { data: responseData } = await proxyService<DeployResponse>(service, {
      url: `/v2/automations/deploy`,
      method: "post",
      data: {
        fileId: fileId,
        botInput: mapValues(data, (x) => ({ type: "STRING", string: x })),
        rdpEnabled: false,
        runElevated: false,
        setAsDefaultDevice: false,
        poolIds: [],
        currentUserDeviceId: deviceId,
        runAsUserIds: [],
        scheduleType: "INSTANT",
      },
    });

    options.logger.info(`Automation id ${responseData}`, {
      response: responseData,
    });

    if (awaitResult) {
      const start = new Date().getTime();
      await sleep(POLL_MILLIS);
      do {
        const { data: activityData } = await proxyService<ActivityResponse>(
          service,
          {
            url: `/v2/activity/list`,
            method: "post",
            data: {
              filter: {
                operator: "eq",
                field: "automationId",
                value: responseData.automationId,
              },
            },
          }
        );

        if (activityData.list.length === 0) {
          throw new Error("Cannot find bot activity");
        }

        const activity = activityData.list[0];
        if (activity.status === "COMPLETED") {
          return activity.outputVariables;
        } else if (activity.status === "FAILED") {
          throw new Error(`Automation failed with status: ${activity.message}`);
        }

        await sleep(POLL_MILLIS);
      } while (new Date().getTime() - start < MAX_WAIT_MILLIS);
      throw new Error(
        `Automation Anywhere job did not finish in ${
          MAX_WAIT_MILLIS / 1000
        } seconds`
      );
    }

    return {};
  }
}

registerBlock(new RunBot());
