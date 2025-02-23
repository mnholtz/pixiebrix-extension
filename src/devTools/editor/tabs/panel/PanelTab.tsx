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
import { Field, FieldInputProps } from "formik";
import { Col, Form, Row, Tab } from "react-bootstrap";
import ToggleField from "@/devTools/editor/components/ToggleField";

const PanelTeb: React.FunctionComponent<{
  eventKey?: string;
}> = ({ eventKey = "panelBody" }) => {
  return (
    <Tab.Pane eventKey={eventKey} className="h-100">
      <Form.Group as={Row} controlId="formCaption">
        <Form.Label column sm={2}>
          Heading
        </Form.Label>
        <Col sm={10}>
          <Field name="extension.heading">
            {({ field }: { field: FieldInputProps<string> }) => (
              <Form.Control type="text" {...field} />
            )}
          </Field>
        </Col>
      </Form.Group>

      <Form.Group as={Row} controlId="formCaption">
        <Form.Label column sm={2}>
          Collapsible
        </Form.Label>
        <Col sm={10}>
          <ToggleField name="extension.collapsible" />
        </Col>
      </Form.Group>

      <Form.Group as={Row} controlId="formCaption">
        <Form.Label column sm={2}>
          Shadow DOM
        </Form.Label>
        <Col sm={10}>
          <ToggleField name="extension.shadowDOM" />
        </Col>
      </Form.Group>
    </Tab.Pane>
  );
};

export default PanelTeb;
