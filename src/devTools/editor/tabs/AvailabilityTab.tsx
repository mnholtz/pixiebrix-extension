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

import React from "react";
import { Col, Form, Row, Tab } from "react-bootstrap";
import { Field, FieldInputProps } from "formik";
import SelectorSelectorField from "@/devTools/editor/SelectorSelectorField";

const AvailabilityTab: React.FunctionComponent<{
  eventKey?: string;
}> = ({ eventKey = "availability" }) => {
  return (
    <Tab.Pane eventKey={eventKey} className="h-100">
      <Form.Group as={Row} controlId="formMatchPatterns">
        <Form.Label column sm={2}>
          Match Patterns
        </Form.Label>
        <Col sm={10}>
          <Field name="extensionPoint.definition.isAvailable.matchPatterns">
            {({ field }: { field: FieldInputProps<string> }) => (
              <Form.Control type="text" {...field} />
            )}
          </Field>
        </Col>
      </Form.Group>
      <Form.Group as={Row} controlId="formAvailableSelectors" className="pb-4">
        <Form.Label column sm={2}>
          Selector
        </Form.Label>
        <Col sm={10}>
          <SelectorSelectorField
            name="extensionPoint.definition.isAvailable.selectors"
            isClearable
          />
        </Col>
      </Form.Group>
    </Tab.Pane>
  );
};

export default AvailabilityTab;
