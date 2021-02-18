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

import {
  ExtensionPointDefinition,
  RecipeDefinition,
} from "@/types/definitions";
import React, { useCallback, useState } from "react";
import { useFormikContext } from "formik";
import { Button, Card, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useSelectedExtensions } from "@/options/pages/marketplace/ConfigureBody";
import { useToasts } from "react-toast-notifications";
import useAsyncEffect from "use-async-effect";
import {
  checkPermissions,
  collectPermissions,
  ensureAllPermissions,
  originPermissions,
} from "@/permissions";
import { GridLoader } from "react-spinners";
import { useAsyncState } from "@/hooks/common";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { reportEvent } from "@/telemetry/events";

interface ActivateProps {
  blueprint: RecipeDefinition;
}

export function useEnsurePermissions(
  blueprint: RecipeDefinition,
  extensions: ExtensionPointDefinition[]
) {
  const { addToast } = useToasts();
  const { submitForm } = useFormikContext();
  const [enabled, setEnabled] = useState<boolean>(undefined);

  useAsyncEffect(
    async (isMounted) => {
      const enabled = await checkPermissions(
        await collectPermissions(extensions)
      );
      if (!isMounted()) return;
      setEnabled(enabled);
    },
    [extensions]
  );

  const request = useCallback(async () => {
    let accepted = false;

    try {
      accepted = await ensureAllPermissions(
        await collectPermissions(extensions)
      );
    } catch (err) {
      console.error(err);
      addToast(`Error granting permissions: ${err}`, {
        appearance: "error",
        autoDismiss: true,
      });
      return false;
    }

    if (!accepted) {
      addToast(`You declined the permissions`, {
        appearance: "error",
        autoDismiss: true,
      });
      return false;
    } else {
      return true;
    }
  }, [extensions, setEnabled]);

  const [permissions, isPending] = useAsyncState(
    async () => originPermissions(await collectPermissions(extensions)),
    [extensions]
  );

  const activate = useCallback(() => {
    // can't use async here because Firefox loses track of trusted UX event
    request().then((accepted: boolean) => {
      if (accepted) {
        reportEvent("MarketplaceActivate", {
          blueprintId: blueprint.metadata.id,
          extensions: extensions.map((x) => x.label),
        });
        return submitForm();
      } else {
        reportEvent("MarketplaceRejectPermissions", {
          blueprintId: blueprint.metadata.id,
          extensions: extensions.map((x) => x.label),
        });
      }
    });
  }, [request, permissions, submitForm, blueprint.metadata]);

  return { enabled, request, permissions, activate, isPending, extensions };
}

const ActivateBody: React.FunctionComponent<ActivateProps> = ({
  blueprint,
}) => {
  const selected = useSelectedExtensions(blueprint.extensionPoints);
  const { enabled, activate, isPending, permissions } = useEnsurePermissions(
    blueprint,
    selected
  );

  return (
    <>
      <Card.Body className="mb-0 p-3">
        <Card.Title>Review Permissions & Activate</Card.Title>

        <p className="text-info">
          <FontAwesomeIcon icon={faInfoCircle} /> You can de-activate bricks at
          any time on the <Link to="/installed">Active Bricks page</Link>.
        </p>

        <Button onClick={activate}>Activate</Button>
      </Card.Body>

      <Card.Body className="p-3">
        <Card.Subtitle>Permissions</Card.Subtitle>

        {enabled == null || !enabled ? (
          <Card.Text>
            Your browser will prompt to you approve any permissions you
            haven&apos;t granted yet.
          </Card.Text>
        ) : (
          <Card.Text>
            PixieBrix already has the permissions required for these bricks.
          </Card.Text>
        )}
      </Card.Body>
      <Table>
        <thead>
          <tr>
            <th>URL</th>
            <th className="w-100">Permissions</th>
          </tr>
        </thead>
        <tbody>
          {isPending && (
            <tr>
              <td colSpan={2}>
                <GridLoader />
              </td>
            </tr>
          )}
          {permissions?.length > 0 &&
            permissions.map((x, i) => {
              const additional = x.permissions.filter(
                (x) => !["tabs", "webNavigation"].includes(x)
              );
              return (
                <tr key={i}>
                  <td>{x.origins.length ? x.origins.join(", ") : "Any URL"}</td>
                  <td>
                    <ul className="mb-0">
                      <li>Read/write information and detect page navigation</li>
                      {additional.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
            })}
          {permissions?.length === 0 && (
            <tr>
              <td colSpan={2}>No special permissions required</td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
};

export default ActivateBody;
