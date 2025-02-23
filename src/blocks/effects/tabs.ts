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

import { Effect } from "@/types";
import { registerBlock } from "@/blocks/registry";
import { Schema } from "@/core";
import { propertiesToSchema } from "@/validators/generic";
import { activateTab, closeTab } from "@/background/executor";

export class ActivateTabEffect extends Effect {
  constructor() {
    super(
      "@pixiebrix/browser/activate-tab",
      "Activate browser tab/window",
      "Activate the tab/window"
    );
  }

  inputSchema: Schema = propertiesToSchema({});

  async effect(): Promise<void> {
    await activateTab();
  }
}

export class CloseTabEffect extends Effect {
  constructor() {
    super("@pixiebrix/browser/close-tab", "Close browser tab", "Close the tab");
  }

  inputSchema: Schema = propertiesToSchema({});

  async effect(): Promise<void> {
    await closeTab();
  }
}

registerBlock(new ActivateTabEffect());
registerBlock(new CloseTabEffect());
