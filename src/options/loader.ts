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

import { readStorage, setStorage } from "@/chrome";
import { Metadata, ServiceDependency } from "@/core";
import { Permissions } from "webextension-polyfill-ts";
import { Primitive } from "type-fest";

const storageKey = "persist:extensionOptions";

export interface ExtensionOptions {
  id: string;
  _recipeId?: string;
  _recipe: Metadata | null;
  _deployment?: {
    id: string;
    timestamp: string;
  };
  extensionPointId: string;
  active: boolean;
  label: string;
  permissions?: Permissions.Permissions;
  services: ServiceDependency[];
  optionsArgs?: Record<string, Primitive>;
  config: { [prop: string]: unknown };
}

type ExtensionOptionState = {
  extensions: Record<string, Record<string, ExtensionOptions>>;
};

/**
 * Read extension options from local storage
 */
export async function loadOptions(): Promise<ExtensionOptionState> {
  const rawOptions = await readStorage(storageKey);

  // Not really sure why the next level down is also escaped JSON?
  const base = JSON.parse(rawOptions as string);

  return { extensions: JSON.parse(base.extensions) };
}

/**
 * Save extension options to local storage
 */
export async function saveOptions(state: ExtensionOptionState): Promise<void> {
  const rawOptions = await readStorage(storageKey);
  const base = JSON.parse(rawOptions as string);
  const { extensions } = state;
  await setStorage(
    storageKey,
    JSON.stringify({ ...base, extensions: JSON.stringify(extensions) })
  );
}
