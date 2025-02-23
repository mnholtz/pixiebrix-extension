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
import startCase from "lodash/startCase";
import { withReadWindow } from "@/common";
import mapValues from "lodash/mapValues";
import { registerBlock } from "@/blocks/registry";
import fromPairs from "lodash/fromPairs";
import { PathSpec } from "@/blocks/readers/window";
import { Schema } from "@/core";

export async function checkRoute(expectedRoute: string): Promise<boolean> {
  const { route } = await withReadWindow({
    pathSpec: { route: "app.router?.lastRoute" },
  });
  return route === expectedRoute;
}

class PipedriveReader extends Reader {
  private readonly ROOT_PATH = "app.router.currentView.model.attributes";
  public readonly outputSchema: Schema;

  resourceType: string;
  pathSpec: PathSpec;

  constructor(resourceType: string, pathSpec: PathSpec) {
    super(
      `pipedrive/${resourceType}`,
      `Pipedrive ${startCase(resourceType)} Reader`,
      `Read information from the Pipedrive ${resourceType} page`
    );
    this.resourceType = resourceType;
    this.pathSpec = pathSpec;
    this.outputSchema = {
      type: "object",
      properties: fromPairs(Object.keys(this.pathSpec).map((x) => [x, {}])),
    };
  }

  async isAvailable() {
    return checkRoute(this.resourceType);
  }

  async read() {
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31265
    return withReadWindow({
      pathSpec: mapValues(
        this.pathSpec,
        (x: string) => `${this.ROOT_PATH}.${x}`
      ) as any,
    });
  }
}

export const ORGANIZATION_READER = new PipedriveReader("organization", {
  organizationId: "id",
  organizationName: "name",
});

export const PERSON_READER = new PipedriveReader("person", {
  personId: "id",
  personName: "name",
});

export const DEAL_READER = new PipedriveReader("deal", {
  dealId: "id",
  title: "title",
  active: "active",
  personId: "person_id",
  personName: "person_name",
  organizationId: "org_id",
  organizationName: "org_name",
});

registerBlock(ORGANIZATION_READER);
registerBlock(PERSON_READER);
registerBlock(DEAL_READER);
