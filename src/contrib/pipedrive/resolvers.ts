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

import { Transformer } from "@/types";
import { registerBlock } from "@/blocks/registry";
import { proxyService } from "@/background/requests";
import { BlockArg, Schema } from "@/core";
import { BusinessError } from "@/errors";

const PIPEDRIVE_SERVICE_ID = "pipedrive/api";

interface SearchResultItem {
  result_score: number;
  item: {
    id: number;
  };
}

interface SearchResult {
  success: boolean;
  data: { items: SearchResultItem[] };
}

export class ResolvePerson extends Transformer {
  constructor() {
    super("pipedrive/persons-search", "Search for a person in Pipedrive");
  }

  inputSchema: Schema = {
    type: "object",
    properties: {
      pipedriveService: {
        $ref: `https://app.pixiebrix.com/schemas/services/${PIPEDRIVE_SERVICE_ID}`,
      },
      name: {
        type: "string",
        description: "Person name",
      },
      organization: {
        type: "integer",
        description: "The organization, used to disambiguate the person",
      },
    },
  };

  async transform({
    pipedriveService,
    name,
    organization,
  }: BlockArg): Promise<unknown> {
    let organization_id = undefined;

    if (organization) {
      const {
        data: { data },
      } = await proxyService<SearchResult>(pipedriveService, {
        url: "https://api.pipedrive.com/v1/organizations/search",
        method: "get",
        params: {
          exact_match: true,
          term: name,
        },
      });
      organization_id = data.items.length ? data.items[0].item.id : undefined;
    }

    const {
      data: { data },
    } = await proxyService<SearchResult>(pipedriveService, {
      url: "https://api.pipedrive.com/v1/persons/search",
      method: "get",
      params: {
        exact_match: true,
        term: name,
        organization_id,
      },
    });

    if (!data.items.length) {
      throw new BusinessError(`Could not find person matching ${name}`);
    }

    return data.items[0].item;
  }
}

registerBlock(new ResolvePerson());
