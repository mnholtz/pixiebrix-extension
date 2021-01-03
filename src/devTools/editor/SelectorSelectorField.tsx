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

import React, {
  ComponentType,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useField } from "formik";
import { OptionsType, components } from "react-select";
import { uniqBy, compact, sortBy } from "lodash";
import Creatable from "react-select/creatable";

import { Badge, Button } from "react-bootstrap";
import { faMousePointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { selectElement } from "@/background/devtools";
import { DevToolsContext } from "@/devTools/context";
import { SelectMode } from "@/nativeEditor/selector";
import { ElementInfo } from "@/nativeEditor/frameworks";
import * as nativeOperations from "@/background/devtools";
import { Framework } from "@/messaging/constants";
import { reportError } from "@/telemetry/logging";

// eslint is complaining that it can't parse the Option file
// eslint-disable-next-line import/namespace
import { OptionProps } from "react-select/src/components/Option";

type OptionValue = { value: string; elementInfo?: ElementInfo };
type SelectorOptions = OptionsType<OptionValue>;

const CustomOption: ComponentType<OptionProps<OptionValue>> = ({
  children,
  ...props
}) => {
  const { port } = useContext(DevToolsContext);

  const toggle = useCallback(
    async (on: boolean) => {
      await nativeOperations.toggleSelector(port, {
        selector: props.data.value,
        on,
      });
    },
    [port, props.data.value]
  );

  return (
    <components.Option {...props}>
      <div onMouseEnter={() => toggle(true)} onMouseLeave={() => toggle(false)}>
        {props.data.elementInfo?.tagName && (
          <Badge variant="dark" className="mr-1 pb-1">
            {props.data.elementInfo.tagName}
          </Badge>
        )}
        {props.data.elementInfo?.hasData && (
          <Badge variant="info" className="mx-1 pb-1">
            Data
          </Badge>
        )}
        {/*{props.data.elementInfo?.framework && (*/}
        {/*  <Badge variant="dark">{props.data.elementInfo.framework}</Badge>*/}
        {/*)}*/}
        {children}
      </div>
    </components.Option>
  );
};

function unrollValues(elementInfo: ElementInfo): OptionValue[] {
  if (!elementInfo) {
    return [];
  }
  return [
    ...(elementInfo.selectors ?? []).map((value) => ({ value, elementInfo })),
    ...compact([elementInfo.parent]).flatMap(unrollValues),
  ].filter((x) => x.value && x.value.trim() !== "");
}

function makeOptions(
  elementInfo: ElementInfo | null,
  extra: string[] = []
): SelectorOptions {
  return uniqBy(
    [...unrollValues(elementInfo), ...extra.map((value) => ({ value }))],
    (x) => x.value
  ).map((option) => ({
    ...option,
    label: option.value,
  }));
}

const SelectorSelectorField: React.FunctionComponent<{
  name: string;
  framework?: Framework;
  initialElement?: ElementInfo;
  selectMode?: SelectMode;
  traverseUp?: number;
  isClearable?: boolean;
  sort?: boolean;
  root?: string;
}> = ({
  name,
  initialElement,
  framework,
  selectMode = "element",
  traverseUp = 0,
  isClearable = false,
  sort = false,
  root = undefined,
}) => {
  const { port } = useContext(DevToolsContext);

  const [field, , helpers] = useField(name);
  const [element, setElement] = useState<ElementInfo>(initialElement);
  const [created, setCreated] = useState([]);
  const [isSelecting, setSelecting] = useState(false);

  const options: SelectorOptions = useMemo(() => {
    const raw = makeOptions(element, compact([...created, field.value]));
    return sort ? sortBy(raw, (x) => x.value.length) : raw;
  }, [created, element, field.value, sort]);

  const select = useCallback(async () => {
    setSelecting(true);
    try {
      const selected = await selectElement(port, {
        framework,
        mode: selectMode,
        traverseUp,
        root,
      });
      setElement(selected);
      const selectors = selected.selectors ?? [];
      helpers.setValue(
        (sort ? sortBy(selectors, (x) => x.length) : selectors)[0]
      );
    } finally {
      setSelecting(false);
    }
  }, [framework, setSelecting, traverseUp, selectMode, helpers, root]);

  return (
    <div className="d-flex">
      <div>
        <Button
          onClick={select}
          disabled={isSelecting}
          variant="info"
          aria-label="Select element"
        >
          <FontAwesomeIcon icon={faMousePointer} />
        </Button>
      </div>
      <div className="flex-grow-1">
        <Creatable
          isClearable={isClearable}
          createOptionPosition="first"
          isDisabled={isSelecting}
          options={options}
          components={{ Option: CustomOption }}
          onCreateOption={(inputValue) => {
            setCreated([...created, inputValue]);
            helpers.setValue(inputValue);
          }}
          value={options.find((x) => x.value === field.value)}
          onMenuClose={() => {
            nativeOperations
              .toggleSelector(port, {
                selector: null,
                on: false,
              })
              .catch((reason) => reportError(reason));
          }}
          onChange={async (option) => {
            helpers.setValue(option ? (option as OptionValue).value : null);
            nativeOperations
              .toggleSelector(port, {
                selector: null,
                on: false,
              })
              .catch((reason) => reportError(reason));
          }}
        />
      </div>
    </div>
  );
};

export default SelectorSelectorField;
