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
import { Effect } from "@/types";
import { registerBlock } from "@/blocks/registry";
import { BlockArg, BlockOptions, Schema, SchemaProperties } from "@/core";
import { pixieServiceFactory } from "@/services/locator";
import { getBaseURL } from "@/services/baseService";
import { validateInput } from "@/validators/generic";
import { Webhook } from "@/contrib/zapier/contract";
import { Permissions } from "webextension-polyfill-ts";
import { v4 as uuidv4 } from "uuid";
import { BusinessError } from "@/errors";

export const ZAPIER_ID = "@pixiebrix/zapier/push-data";

export const ZAPIER_PROPERTIES: SchemaProperties = {
  pushKey: {
    type: "string",
    description: "The identifier for the Zap configured in Zapier",
    default: "my_zap",
  },
  data: {
    type: "object",
    additionalProperties: true,
  },
};

export const ZAPIER_PERMISSIONS: Permissions.Permissions = {
  origins: ["https://hooks.zapier.com/hooks/*"],
};

export class PushZap extends Effect {
  constructor() {
    super(ZAPIER_ID, "Push data to Zapier", "Push data to Zapier");
  }

  inputSchema: Schema = {
    $schema: "https://json-schema.org/draft/2019-09/schema#",
    type: "object",
    required: ["data"],
    properties: ZAPIER_PROPERTIES,
  };

  /**
   * Additional permissions required for CORS
   */
  permissions: Permissions.Permissions = ZAPIER_PERMISSIONS;

  async effect(
    { pushKey, data }: BlockArg,
    options: BlockOptions
  ): Promise<void> {
    const { data: webhooks } = await proxyService<{
      new_push_fields: Webhook[];
    }>(await pixieServiceFactory(), {
      baseURL: await getBaseURL(),
      url: "/api/webhooks/hooks/",
      method: "get",
    });

    const webhook = webhooks.new_push_fields.find(
      (x) => x.display_name === pushKey
    );

    if (!webhook) {
      throw new BusinessError(`No Zapier hook found for name: ${pushKey}`);
    }

    const validation = await validateInput(webhook.input_schema, data);

    if (!validation.valid) {
      options.logger.warn("Invalid data for Zapier effect");
    }

    await proxyService(null, {
      url: webhook.url,
      method: "post",
      data: {
        ...data,
        id: uuidv4(),
      },
    });
  }
}

registerBlock(new PushZap());
