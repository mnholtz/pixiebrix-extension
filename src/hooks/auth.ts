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

import { fetch } from "@/hooks/fetch";
import { AuthState } from "@/core";
import { updateAuth as updateRollbarAuth } from "@/telemetry/rollbar";

interface OrganizationResponse {
  readonly id: string;
  readonly name: string;
  readonly scope: string;
}

interface ProfileResponse {
  readonly id: string;
  readonly email: string;
  readonly scope: string | null;
  readonly isOnboarded: boolean;
  readonly organization: OrganizationResponse | null;
  readonly flags: string[];
}

export const anonAuth: AuthState = {
  userId: undefined,
  email: undefined,
  isLoggedIn: false,
  isOnboarded: false,
  extension: true,
  scope: null,
  flags: [],
};

export async function getAuth(): Promise<AuthState> {
  const {
    id,
    email,
    scope,
    organization,
    isOnboarded,
    flags = [],
  } = await fetch<ProfileResponse>("/api/me/");
  if (id) {
    await updateRollbarAuth({
      userId: id,
      email,
      organizationId: organization?.id,
    });
    return {
      userId: id,
      email,
      scope,
      organization,
      isOnboarded,
      isLoggedIn: true,
      extension: true,
      flags,
    };
  } else {
    return anonAuth;
  }
}
