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
import { RootState } from "@/options/store";
import { IService, RawServiceConfiguration } from "@/core";
import { useParams } from "react-router";
import { useMemo } from "react";
import sortBy from "lodash/sortBy";
import registry, { PIXIEBRIX_SERVICE_ID } from "@/services/registry";
import { useAsyncState } from "@/hooks/common";
import { ServicesState } from "@/options/slices";

interface ServiceDefinitions {
  serviceDefinitions: IService[];
  activeConfiguration: RawServiceConfiguration | null;
  activeService: IService | null;
  isPending: boolean;
  showZapier: boolean;
}

const ZAPIER_SLUG = "zapier";

const selectConfiguredServices = ({ services }: { services: ServicesState }) =>
  Object.values(services.configured);

function useServiceDefinitions(): ServiceDefinitions {
  const configuredServices = useSelector<RootState, RawServiceConfiguration[]>(
    selectConfiguredServices
  );
  const { id: configurationId } = useParams<{ id: string }>();

  const showZapier = configurationId === ZAPIER_SLUG;

  const [serviceDefinitions, isPending, error] = useAsyncState(async () => {
    return sortBy(
      (await registry.all()).filter((x) => x.id !== PIXIEBRIX_SERVICE_ID),
      (x) => x.id
    );
  }, []);

  const activeConfiguration = useMemo(() => {
    return configurationId && configurationId !== ZAPIER_SLUG
      ? configuredServices.find((x) => x.id === configurationId)
      : null;
  }, [configuredServices, configurationId]);

  const activeService = useMemo(() => {
    return activeConfiguration
      ? (serviceDefinitions ?? []).find(
          (x) => x.id === activeConfiguration.serviceId
        )
      : null;
  }, [serviceDefinitions, activeConfiguration]);

  if (error) {
    throw error;
  }

  return {
    activeConfiguration,
    serviceDefinitions,
    activeService,
    isPending,
    showZapier,
  };
}

export default useServiceDefinitions;
