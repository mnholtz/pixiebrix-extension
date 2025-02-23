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

import React, { useMemo } from "react";
import { useField, useFormikContext } from "formik";
import BootstrapSwitchButton from "bootstrap-switch-button-react";
import { Card, Table } from "react-bootstrap";
import {
  ExtensionPointDefinition,
  RecipeDefinition,
} from "@/types/definitions";
import pickBy from "lodash/pickBy";
import identity from "lodash/identity";
import { WizardValues } from "@/options/pages/marketplace/wizard";
import { ServiceAuthPair } from "@/permissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export function selectedAuths(values: WizardValues): ServiceAuthPair[] {
  return Object.entries(values.services)
    .filter(([, config]) => config)
    .map(([id, config]) => ({ id, config }));
}

export function selectedExtensions(
  values: WizardValues,
  extensions: ExtensionPointDefinition[]
): ExtensionPointDefinition[] {
  const indexes = Object.keys(pickBy(values.extensions, identity)).map((x) =>
    Number.parseInt(x, 10)
  );
  console.debug("selected extensions", {
    extensions: values.extensions,
    indexes,
  });
  return extensions.filter((x, i) => indexes.includes(i));
}

export function useSelectedAuths(): ServiceAuthPair[] {
  const { values } = useFormikContext<WizardValues>();
  return useMemo(() => selectedAuths(values), [values]);
}

export function useSelectedExtensions(
  extensions: ExtensionPointDefinition[]
): ExtensionPointDefinition[] {
  const { values } = useFormikContext<WizardValues>();
  return useMemo(() => selectedExtensions(values, extensions), [
    extensions,
    values,
  ]);
}

const ConfigureRow: React.FunctionComponent<{
  definition: ExtensionPointDefinition;
  name: string;
}> = ({ definition, name }) => {
  const [field, , helpers] = useField(name);
  return (
    <tr>
      <td>
        <BootstrapSwitchButton
          onlabel=" "
          offlabel=" "
          onstyle="info"
          checked={field.value}
          onChange={(checked) => helpers.setValue(checked)}
        />
      </td>
      <td>
        {field.value ? (
          <span className="text-info">Selected</span>
        ) : (
          <span className="text-muted">Ignore</span>
        )}
      </td>
      {/*<td>*/}
      {/*  <code className="pl-0">{definition.id}</code>*/}
      {/*</td>*/}
      <td>{definition.label ?? "No label provided"}</td>
    </tr>
  );
};

interface OwnProps {
  blueprint: RecipeDefinition;
}

const ConfigureBody: React.FunctionComponent<OwnProps> = ({ blueprint }) => {
  return (
    <>
      <Card.Body className="p-3">
        <h3 className="pb-1 mb-0">{blueprint.metadata.name}</h3>
        <code className="p-0 small">{blueprint.metadata.id}</code>
        <div className="pt-3">
          <p>
            {blueprint.metadata.description ?? (
              <span>
                <i>No description provided</i>
              </span>
            )}
          </p>
        </div>
      </Card.Body>

      <Card.Body className="px-3 py-0">
        <p className="text-info">
          <FontAwesomeIcon icon={faInfoCircle} /> Don&apos;t know which bricks
          to select? Don&apos;t worry! &mdash; you can de-activate bricks at any
          time on the{" "}
          <Link to="/installed">
            <u>
              <FontAwesomeIcon icon={faCubes} />
              {"  "}Active Bricks page
            </u>
          </Link>
        </p>
      </Card.Body>

      <Table>
        <thead>
          <tr>
            <th colSpan={2}>Selected?</th>
            {/*<th>Foundation</th>*/}
            <th className="w-100">Name/Description</th>
          </tr>
        </thead>
        <tbody>
          {blueprint.extensionPoints.map((x, i) => (
            <ConfigureRow key={i} definition={x} name={`extensions.${i}`} />
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default ConfigureBody;
