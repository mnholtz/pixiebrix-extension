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

import React from "react";
import { IExtension } from "@/core";
import { FormState } from "@/devTools/editor/editorSlice";
import { useRemove, useReset } from "@/devTools/editor/hooks/editorHooks";
import { useFormikContext } from "formik";
import { Button, ButtonGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHistory, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";

const ActionToolbar: React.FunctionComponent<{
  installed: IExtension[];
  element: FormState;
  disabled: boolean;
}> = ({ installed, element, disabled }) => {
  const remove = useRemove(element);
  const reset = useReset(installed, element);
  const { values } = useFormikContext<FormState>();

  return (
    <ButtonGroup className="ml-2">
      <Button disabled={disabled} type="submit" size="sm" variant="primary">
        <FontAwesomeIcon icon={faSave} /> Save
      </Button>
      {values.installed && (
        <Button disabled={disabled} size="sm" variant="warning" onClick={reset}>
          <FontAwesomeIcon icon={faHistory} /> Reset
        </Button>
      )}
      {/* Remove is always available */}
      <Button variant="danger" size="sm" onClick={remove}>
        <FontAwesomeIcon icon={faTrash} /> Remove
      </Button>
    </ButtonGroup>
  );
};

export default ActionToolbar;
