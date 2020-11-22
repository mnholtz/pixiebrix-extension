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

import { DBSchema, openDB } from "idb/with-async-ittr";
import { sortBy, groupBy } from "lodash";
import { liftBackground } from "@/background/protocol";

const STORAGE_KEY = "BRICK_REGISTRY";
const BRICK_STORE = "bricks";

export const LOCAL_SCOPE = "@local";

export const PACKAGE_NAME_REGEX = /^((?<scope>@[a-z0-9-~][a-z0-9-._~]*)\/)?((?<collection>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<name>[a-z0-9-~][a-z0-9-._~]*)$/;

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export type Kind =
  | "block"
  | "foundation"
  | "service"
  | "blueprint"
  | "reader"
  | "effect"
  | "component"
  | "extensionPoint";

export interface Package {
  id: string;
  version: Version;
  kind: Kind;
  scope: string;
  config: Record<string, unknown>;
  rawConfig: string | null;
  timestamp: Date;
}

interface LogDB extends DBSchema {
  [BRICK_STORE]: {
    value: Package;
    key: [string, number, number, number];
    indexes: {
      id: string;
      scope: string;
      version: [number, number, number];
      kind: string;
      timestamp: Date;
    };
  };
}

async function getBrickDB() {
  return await openDB<LogDB>(STORAGE_KEY, 1, {
    upgrade(db) {
      // Create a store of objects
      const store = db.createObjectStore(BRICK_STORE, {
        keyPath: ["id", "version.major", "version.minor", "version.patch"],
      });
      store.createIndex("id", "id", {
        unique: false,
      });
      store.createIndex("scope", "scope", { unique: false });
      store.createIndex("timestamp", "timestamp", { unique: false });
      store.createIndex("kind", "kind", { unique: false });
    },
  });
}

function latestVersion(versions: Package[]): Package | null {
  return versions.length > 0
    ? sortBy(
        versions,
        (x) => -x.version.major,
        (x) => -x.version.minor,
        (x) => -x.version.patch
      )[0]
    : null;
}

export const getKind = liftBackground(
  "REGISTRY_GET_KIND",
  async (kind: Kind) => {
    const db = await getBrickDB();
    const bricks = await db.getAllFromIndex(BRICK_STORE, "kind", kind);
    return Object.entries(groupBy(bricks, (x) => x.id)).map(([, versions]) =>
      latestVersion(versions)
    );
  }
);

export const getLocal = liftBackground("REGISTRY_GET_LOCAL", async () => {
  const db = await getBrickDB();
  return await db.getAllFromIndex(BRICK_STORE, "scope", LOCAL_SCOPE);
});

export const add = liftBackground("REGISTRY_PUT", async (obj: Package) => {
  const db = await getBrickDB();
  await db.put(BRICK_STORE, obj);
});

export const find = liftBackground("REGISTRY_FIND", async (id: string) => {
  const db = await getBrickDB();
  const versions = await db.getAllFromIndex(BRICK_STORE, "id", id);
  return latestVersion(versions);
});