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

import { registerFactory } from "@/blocks/readers/factory";
import { Framework } from "@/messaging/constants";
import { ReaderOutput } from "@/core";
import { castArray, fromPairs } from "lodash";
import { getComponentData, ReadPayload } from "@/pageScript/protocol";

type FrameworkConfig = ReadPayload & {
  // Legacy emberjs reader config; now handled via pathSpec
  attrs: string | string[];
};

function makeRead(framework: Framework) {
  async function read(reader: FrameworkConfig): Promise<ReaderOutput> {
    const {
      selector,
      rootProp,
      waitMillis,
      traverseUp,
      attrs,
      pathSpec,
    } = reader;

    return await getComponentData({
      framework,
      selector,
      rootProp,
      waitMillis,
      traverseUp,
      pathSpec: attrs
        ? fromPairs(castArray(attrs).map((attr) => [attr, `attrs.${attr}`]))
        : pathSpec,
    });
  }
  return read;
}

registerFactory("angularjs", makeRead("angularjs"));
registerFactory("emberjs", makeRead("emberjs"));
registerFactory("react", makeRead("react"));
registerFactory("vue", makeRead("vue"));
registerFactory("vuejs", makeRead("vue"));
