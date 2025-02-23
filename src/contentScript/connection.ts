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

import { NotificationCallbacks } from "@/contentScript/notify";

let _hooks: NotificationCallbacks = null;

export function showConnectionLost(): void {
  if (_hooks) {
    return null;
  }
  const element = $.notify(
    "Connection to PixieBrix lost. Please reload the page",
    {
      autoHide: false,
      clickToHide: false,
      className: "error",
    }
  );

  const $element = $(element);

  _hooks = {
    hide: () => {
      $element.trigger("notify-hide");
    },
  };
}

export function hideConnectionLost(): void {
  if (_hooks) {
    _hooks.hide();
    _hooks = null;
  }
}
