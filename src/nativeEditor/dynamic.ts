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

import { IExtension, IExtensionPoint } from "@/core";
import { liftContentScript } from "@/contentScript/backgroundProtocol";
import { clearDynamic, runDynamic } from "@/contentScript/lifecycle";
import { fromJS as extensionPointFactory } from "@/extensionPoints/factory";
import {
  ReaderConfig,
  ReaderDefinition,
  readerFactory,
} from "@/blocks/readers/factory";
import {
  ExtensionPointConfig,
  ExtensionPointDefinition,
} from "@/extensionPoints/types";
import Overlay from "@/nativeEditor/Overlay";

export interface DynamicDefinition<
  TExtensionPoint extends ExtensionPointDefinition = ExtensionPointDefinition,
  TExtension = unknown,
  TReader extends ReaderDefinition = ReaderDefinition
> {
  extensionPoint: ExtensionPointConfig<TExtensionPoint>;
  extension: IExtension<TExtension>;
  reader: ReaderConfig<TReader>;
}

let _overlay: Overlay | null = null;
const _temporaryExtensions: Map<string, IExtensionPoint> = new Map();

export const clear = liftContentScript(
  "CLEAR_DYNAMIC",
  async ({ uuid }: { uuid?: string }) => {
    clearDynamic(uuid);
    if (uuid) {
      _temporaryExtensions.delete(uuid);
    } else {
      _temporaryExtensions.clear();
    }
  }
);

export const updateDynamicElement = liftContentScript(
  "UPDATE_DYNAMIC_ELEMENT",
  async ({
    extensionPoint: extensionPointConfig,
    extension: extensionConfig,
    reader: readerConfig,
  }: DynamicDefinition) => {
    const extensionPoint = extensionPointFactory(extensionPointConfig);

    // the reader won't be in the registry, so override the method
    const reader = readerFactory(readerConfig);
    extensionPoint.defaultReader = async () => reader;

    _temporaryExtensions.set(extensionConfig.id, extensionPoint);

    extensionPoint.addExtension(extensionConfig);

    await runDynamic(extensionConfig.id, extensionPoint);
  }
);

export const toggleOverlay = liftContentScript(
  "TOGGLE_OVERLAY",
  async ({ selector, on = true }: { selector: string; on: boolean }) => {
    if (on) {
      if (_overlay == null) {
        _overlay = new Overlay();
      }
      const $elt = $(document).find(selector);
      _overlay.inspect($elt.toArray(), null);
    } else if (_overlay != null) {
      _overlay.remove();
      _overlay = null;
    }
  }
);
