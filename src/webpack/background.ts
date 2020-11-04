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

// Adapted from: https://github.com/crimx/webpack-target-webextension/blob/master/lib/background.js
import { WEBPACK_INJECT_FILE } from "./protocol";
import { browser, Runtime } from "webextension-polyfill-ts";
import { isBackgroundPage } from "webext-detect-page";

interface InjectRequest {
  type: typeof WEBPACK_INJECT_FILE;
  payload: {
    file: string;
  };
}

function injectListener(
  { type, payload }: InjectRequest,
  sender: Runtime.MessageSender
): undefined | Promise<{ file: string }> {
  if (type === WEBPACK_INJECT_FILE) {
    const { file } = payload;
    const details = {
      // Should this be sender.tab.frameId?: https://github.com/crimx/webpack-target-webextension/blob/master/lib/background.js#L9
      frameId: sender.frameId,
      file,
    };

    return new Promise((resolve) => {
      chrome.tabs.executeScript(sender.tab.id, details, () => {
        if (chrome.runtime.lastError) {
          console.error(
            `Error loading ${file} chunk with executeScript`,
            chrome.runtime.lastError
          );
          throw chrome.runtime.lastError;
        }
        console.debug(`Loaded chunk ${file} with executeScript`);
        resolve({ file });
      });
    });
  }
}

if (isBackgroundPage()) {
  browser.runtime.onMessage.addListener(injectListener);
}
