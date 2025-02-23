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

import React, { useCallback, useMemo, useState } from "react";
import {
  BlockOptionProps,
  FieldRenderer,
} from "@/components/fields/blockOptions";
import { identity } from "lodash";
import { Schema } from "@/core";
import { useField } from "formik";
import { useAsyncState } from "@/hooks/common";
import { proxyService } from "@/background/requests";
import { Button, Form } from "react-bootstrap";
import { fieldLabel } from "@/components/fields/fieldUtils";
import Select from "react-select";
import { FieldProps } from "@/components/fields/propTypes";
import { Webhook } from "@/contrib/zapier/contract";
import { pixieServiceFactory } from "@/services/locator";
import { getBaseURL } from "@/services/baseService";
import { ZAPIER_PERMISSIONS, ZAPIER_PROPERTIES } from "@/contrib/zapier/push";
import { ObjectField } from "@/components/fields/FieldTable";
import { checkPermissions } from "@/permissions";
import { browser } from "webextension-polyfill-ts";

function useHooks(): {
  hooks: Webhook[];
  isPending: boolean;
  error: unknown;
} {
  const [hooks, isPending, error] = useAsyncState(async () => {
    const { data } = await proxyService<{ new_push_fields: Webhook[] }>(
      await pixieServiceFactory(),
      {
        baseURL: await getBaseURL(),
        url: "/api/webhooks/hooks/",
        method: "get",
      }
    );

    return data.new_push_fields;
  }, []);

  return { hooks, isPending, error };
}

export const ZapField: React.FunctionComponent<
  FieldProps<string> & { hooks: Webhook[]; error: unknown }
> = ({ label, schema, hooks, error, ...props }) => {
  const [{ value, ...field }, meta, helpers] = useField(props);

  const options = useMemo(() => {
    return (hooks ?? []).map((x) => ({
      value: x.display_name,
      label: x.display_name,
      hook: x,
    }));
  }, [hooks]);

  return (
    <Form.Group>
      <Form.Label>{label ?? fieldLabel(field.name)}</Form.Label>
      <Select
        options={options}
        value={options.find((x) => x.value === value)}
        onChange={(option) => helpers.setValue((option as any)?.value)}
      />
      {schema.description && (
        <Form.Text className="text-muted">The Zap to run</Form.Text>
      )}
      {error && (
        <span className="text-danger small">
          Error fetching Zaps: {error.toString()}
        </span>
      )}
      {meta.touched && meta.error && (
        <span className="text-danger small">{meta.error}</span>
      )}
    </Form.Group>
  );
};

const PushOptions: React.FunctionComponent<BlockOptionProps> = ({
  name,
  configKey,
  showOutputKey,
}) => {
  const basePath = [name, configKey].filter(identity).join(".");

  const [grantedPermissions, setGrantedPermissions] = useState<boolean>(false);
  const [hasPermissions] = useAsyncState(
    () => checkPermissions([ZAPIER_PERMISSIONS]),
    []
  );

  const [{ value: pushKey }] = useField<string>(`${basePath}.pushKey`);

  const { hooks, error } = useHooks();

  const requestPermissions = useCallback(() => {
    browser.permissions.request(ZAPIER_PERMISSIONS).then(() => {
      setGrantedPermissions(true);
    });
  }, [setGrantedPermissions]);

  const hook = useMemo(() => {
    return hooks?.find((x) => x.display_name === pushKey);
  }, [hooks, pushKey]);

  if (!(grantedPermissions || hasPermissions)) {
    return (
      <div className="my-2">
        <p>
          You must grant permissions for you browser to send information to
          Zapier.
        </p>
        <Button onClick={requestPermissions}>Grant Permissions</Button>
      </div>
    );
  }

  return (
    <div>
      <ZapField
        label="Zap"
        name={`${basePath}.pushKey`}
        schema={ZAPIER_PROPERTIES["pushKey"] as Schema}
        hooks={hooks}
        error={error}
      />

      {pushKey && hook && (
        <ObjectField name={`${basePath}.data`} schema={hook.input_schema} />
      )}

      {showOutputKey && (
        <FieldRenderer
          name={`${name}.outputKey`}
          label="Output Variable"
          schema={{
            type: "string",
            description: "A name to refer to this brick in subsequent bricks",
          }}
        />
      )}
    </div>
  );
};

export default PushOptions;
