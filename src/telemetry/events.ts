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

import { recordEvent, initUID } from "@/background/telemetry";
import { JsonObject } from "type-fest";

export function reportEvent(event: string, data: JsonObject = {}): void {
  recordEvent({ event, data }).catch((error) => {
    console.warn("Error reporting event", { error });
  });
}

export function initTelemetry(): void {
  initUID().catch((error) => {
    console.warn("Error initializing uid", { error });
  });
}
