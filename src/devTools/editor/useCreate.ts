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

import { ButtonState } from "@/devTools/editor/editorSlice";
import { identity, pickBy } from "lodash";
import { useDispatch } from "react-redux";
import { useCallback } from "react";
import axios, { AxiosError } from "axios";
import { makeURL } from "@/hooks/fetch";
import { safeDump } from "js-yaml";
import { getExtensionToken } from "@/auth/token";
import { optionsSlice } from "@/options/slices";
import { FormikHelpers } from "formik";
import { useToasts } from "react-toast-notifications";
import { reportError } from "@/telemetry/logging";
import { defaultConfig, readerOptions } from "@/devTools/editor/ReaderTab";

const { saveExtension } = optionsSlice.actions;

function makeMenuReader(button: ButtonState) {
  const readerOption = readerOptions.find(
    (x) => x.value === button.reader.type
  );
  return {
    apiVersion: "v1",
    kind: "reader",
    metadata: {
      id: button.reader.id,
      version: "1.0.0",
      name: `Reader for ${button.extensionPoint.name}`,
      description: "Reader created with the devtools",
    },
    definition: {
      reader: (readerOption?.makeConfig ?? defaultConfig)(
        button.reader.type,
        button.reader.selector
      ),
    },
    outputSchema: button.reader.outputSchema ?? {},
  };
}

function makeMenuExtensionPoint(button: ButtonState) {
  return {
    apiVersion: "v1",
    kind: "extensionPoint",
    metadata: {
      id: button.extensionPoint.id,
      version: "1.0.0",
      name: button.extensionPoint.name,
      description: "Action created with the devtools",
    },
    definition: {
      type: "menuItem",
      isAvailable: pickBy(button.isAvailable, identity),
      reader: button.reader.id,
      containerSelector: [button.containerSelector],
      position: button.position,
      template: button.template,
    },
  };
}

function makeExtensionDefinition(button: ButtonState) {
  return {
    extensionPointId: button.extensionPoint.id,
    extensionId: button.uuid,
    label: "Custom Action",
    // services here refers to the service auth
    services: [] as unknown[],
    config: {
      caption: button.caption,
      action: [
        {
          id: "@pixiebrix/browser/log",
          config: {
            message: "Custom action",
          },
        },
      ],
    },
  };
}

export function useCreate(): (
  button: ButtonState,
  helpers: FormikHelpers<ButtonState>
) => Promise<void> {
  const dispatch = useDispatch();
  const { addToast } = useToasts();

  return useCallback(
    async (
      button: ButtonState,
      { setSubmitting, setStatus }: FormikHelpers<ButtonState>
    ) => {
      try {
        await axios({
          url: await makeURL("api/bricks/"),
          method: "post",
          data: { config: safeDump(makeMenuReader(button)), kind: "reader" },
          headers: { Authorization: `Token ${await getExtensionToken()}` },
        });
      } catch (ex) {
        const err = ex as AxiosError;
        const msg =
          err.response.data["config"]?.toString() ?? err.response.statusText;
        setStatus(msg);
        addToast(`Error saving reader definition: ${msg}`, {
          appearance: "error",
          autoDismiss: true,
        });
        setSubmitting(false);
        return;
      }

      try {
        await axios({
          url: await makeURL("api/bricks/"),
          method: "post",
          data: {
            config: safeDump(makeMenuExtensionPoint(button)),
            kind: "extensionPoint",
          },
          headers: { Authorization: `Token ${await getExtensionToken()}` },
        });
      } catch (ex) {
        const err = ex as AxiosError;
        const msg =
          err.response.data["config"]?.toString() ?? err.response.statusText;
        setStatus(msg);
        addToast(`Error saving foundation definition: ${msg}`, {
          appearance: "error",
          autoDismiss: true,
        });
        setSubmitting(false);
        return;
      }

      try {
        dispatch(saveExtension(makeExtensionDefinition(button)));
        addToast("Saved button definition", {
          appearance: "success",
          autoDismiss: true,
        });
      } catch (exc) {
        reportError(exc);
        addToast(`Error saving button definition: ${exc.toString()}`, {
          appearance: "success",
          autoDismiss: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, addToast]
  );
}