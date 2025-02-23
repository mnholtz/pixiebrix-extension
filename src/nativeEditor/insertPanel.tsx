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

// https://github.com/facebook/react/blob/7559722a865e89992f75ff38c1015a865660c3cd/packages/react-devtools-shared/src/backend/views/Highlighter/index.js

import { v4 as uuidv4 } from "uuid";
import { liftContentScript } from "@/contentScript/backgroundProtocol";
import { ElementInfo } from "./frameworks";
import { userSelectElement } from "./selector";
import * as pageScript from "@/pageScript/protocol";
import { findContainer, inferPanelHTML } from "./infer";
import { html as beautifyHTML } from "js-beautify";
import { PanelConfig, PanelDefinition } from "@/extensionPoints/panelExtension";

const DEFAULT_PANEL_HEADING = "PixieBrix Panel";

export interface PanelSelectionResult {
  uuid: string;
  foundation: Omit<
    PanelDefinition,
    "defaultOptions" | "isAvailable" | "reader"
  >;
  panel: Omit<PanelConfig, "body">;
  containerInfo: ElementInfo;
}

export const insertPanel = liftContentScript("INSERT_PANEL", async () => {
  const selected = await userSelectElement();

  const { container, selectors } = findContainer(selected);

  const element: PanelSelectionResult = {
    uuid: uuidv4(),
    panel: {
      heading: DEFAULT_PANEL_HEADING,
      shadowDOM: true,
    },
    foundation: {
      type: "panel",
      containerSelector: selectors[0],
      template: beautifyHTML(inferPanelHTML(container, selected), {
        indent_handlebars: true,
        wrap_line_length: 80,
        wrap_attributes: "force",
      }),
      position: "prepend",
    },
    containerInfo: await pageScript.getElementInfo({ selector: selectors[0] }),
  };

  return element;
});
