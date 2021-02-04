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

import { useSelector } from "react-redux";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import React, { useCallback } from "react";
import { RawServiceConfiguration, IService, ServiceConfig } from "@/core";
import { RootState } from "../../store";
import ServiceSelector from "@/components/ServiceSelector";
import { v4 as uuidv4 } from "uuid";
import { ServiceDefinition } from "@/types/definitions";

interface OwnProps {
  services: IService[];
  navigate: (x: string) => void;
  onCreate: (x: RawServiceConfiguration) => void;
}

const PrivateServicesCard: React.FunctionComponent<OwnProps> = ({
  services,
  navigate,
  onCreate,
}) => {
  const configuredServices = useSelector<RootState, RawServiceConfiguration[]>(
    ({ services }) => Object.values(services.configured)
  );

  const onSelect = useCallback(
    (x: ServiceDefinition) => {
      onCreate({
        id: uuidv4(),
        label: undefined,
        serviceId: x.metadata.id,
        config: {} as ServiceConfig,
      } as RawServiceConfiguration);
    },
    [onCreate]
  );

  return (
    <>
      <Card.Body className="pb-2">
        <p>
          Private services you configure are not shared with your teams or
          transferred to the PixieBrix servers.
        </p>
      </Card.Body>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Id</th>
            <th>Label</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3}>
              Zapier <i>&ndash; use to connect to PixieBrix from Zapier</i>
            </td>
            <td>
              <Button
                style={{ width: 100 }}
                variant="info"
                size="sm"
                onClick={() => navigate(`/services/zapier/`)}
              >
                View Key
              </Button>
            </td>
          </tr>

          {configuredServices.map((configuredService) => {
            const service = services.find(
              (x) => x.id === configuredService.serviceId
            );
            if (!service) {
              throw new Error(`Unknown service ${configuredService.serviceId}`);
            }
            return (
              <tr
                key={`${configuredService.serviceId}-${configuredService.id}`}
              >
                <td>{service.name}</td>
                <td>
                  <code>{service.id}</code>
                </td>
                <td>{configuredService.label}</td>
                <td>
                  <Button
                    style={{ width: 100 }}
                    variant="info"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/services/${encodeURIComponent(configuredService.id)}`
                      )
                    }
                  >
                    Configure
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Card.Footer>
        <div style={{ width: 300 }}>
          <ServiceSelector onSelect={onSelect} />
        </div>
      </Card.Footer>
    </>
  );
};

export default PrivateServicesCard;
