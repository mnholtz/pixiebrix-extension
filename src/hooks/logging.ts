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

import { useCallback, useState } from "react";
import useAsyncEffect from "use-async-effect";
import {
  getLoggingConfig,
  LoggingConfig,
  setLoggingConfig,
} from "@/background/logging";

export function useLoggingConfig(): [
  LoggingConfig,
  (config: LoggingConfig) => Promise<void>
] {
  const [config, setConfig] = useState<LoggingConfig>();

  useAsyncEffect(
    async (isMounted) => {
      const config = await getLoggingConfig();
      if (!isMounted()) {
        return;
      }
      setConfig(config);
    },
    [setConfig]
  );

  const update = useCallback(
    async (newConfig: LoggingConfig) => {
      await setLoggingConfig(newConfig);
      setConfig(newConfig);
    },
    [setConfig]
  );

  return [config, update];
}
