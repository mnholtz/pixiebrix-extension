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

import { Reader } from "@/types";
import { IReader, ReaderOutput, Schema } from "@/core";
import mapValues from "lodash/mapValues";
import identity from "lodash/identity";
import fromPairs from "lodash/fromPairs";

class CompositeReader extends Reader {
  public readonly outputSchema: Schema;
  private readonly _readers: { [key: string]: IReader };

  constructor(readers: { [key: string]: IReader }) {
    super(undefined, "Composite Reader", "Combination of multiple readers");
    this._readers = readers;
    this.outputSchema = {
      $schema: "https://json-schema.org/draft/2019-09/schema#",
      type: "object",
      properties: mapValues(this._readers, (x) => x.outputSchema),
      required: Object.keys(this._readers),
    };
  }

  async isAvailable(): Promise<boolean> {
    const readerArray = Object.values(this._readers);
    // PERFORMANCE: could return quicker if any came back false using Promise.any
    const availability = await Promise.all(
      readerArray.map((x) => x.isAvailable())
    );
    return availability.every(identity);
  }

  async read(root: HTMLElement | Document): Promise<ReaderOutput> {
    const readOne = async (key: string, reader: IReader) => [
      key,
      await reader.read(root),
    ];
    const resultPairs = await Promise.all(
      Object.entries(this._readers).map(([key, reader]) => readOne(key, reader))
    );
    return fromPairs(resultPairs);
  }
}

export default CompositeReader;
