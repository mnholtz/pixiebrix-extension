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

import jQuery from "jquery";

export function requireSingleElement(selector: string): HTMLElement {
  const $elt = jQuery(document).find(selector);
  if (!$elt.length) {
    throw new Error(`No elements found for selector: '${selector}'`);
  } else if ($elt.length > 1) {
    throw new Error(`Multiple elements found for selector: '${selector}'`);
  }
  return $elt.get(0);
}
