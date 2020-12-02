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

declare global {
  interface Window {
    CONTENT_SCRIPT: boolean;
  }
}

if (window.CONTENT_SCRIPT) {
  throw new Error("Content script already loaded for page");
}

window.CONTENT_SCRIPT = true;

import "@/extensionContext";
import { reportError } from "@/telemetry/logging";

import "@/blocks";
import "@/contrib";
import "@/contentScript/contextMenus";
import "@/contentScript/devTools";

window.addEventListener("error", function (e) {
  // eslint-disable-next-line require-await
  reportError(e);
  return false;
});

window.addEventListener("unhandledrejection", function (e) {
  // eslint-disable-next-line require-await
  reportError(e);
});

// Import for the side effect of registering js defined blocks
import { handleNavigate } from "@/contentScript/lifecycle";
import { refresh as refreshServices } from "@/background/locator";
import "@/contentScript/externalProtocol";
import { notifyReady } from "@/contentScript/executor";
import "@/messaging/external";
import "@/contentScript/script";
import "notifyjs-browser";
import "jquery.initialize";

// Reload services on background page for each new page. This is inefficient right now, but will
// avoid confusion when service configurations are updated remotely
refreshServices().catch((reason) => {
  console.warn("Error refreshing service configurations", reason);
});

handleNavigate().catch((reason) => {
  console.warn("Error initializing content script", reason);
});

notifyReady().catch((reason) => {
  console.warn("Error pinging the background script", reason);
});
