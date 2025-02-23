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
import Centered from "@/devTools/editor/components/Centered";
import { openTab } from "@/background/executor";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentAlt, faPhone } from "@fortawesome/free-solid-svg-icons";

const NoExtensionsPane: React.FunctionComponent<{
  unavailableCount: number;
  showSupport: () => void;
}> = ({ unavailableCount, showSupport }) => {
  return (
    <Centered>
      <div className="PaneTitle">No custom extensions on the page</div>

      <div className="text-left">
        <p>
          Click <span className="text-info">Add</span> in the sidebar to add an
          element to the page.
        </p>

        <p>
          Check the &ldquo;Show {unavailableCount ?? 1} unavailable&rdquo; box
          to list extensions that are installed but aren&apos;t available for
          this page.
        </p>

        <p>
          Learn how to use the Page Editor in our{" "}
          <a
            href="#"
            onClick={async () =>
              openTab({
                url: "https://docs.pixiebrix.com/quick-start-guide",
                active: true,
              })
            }
          >
            Quick Start Guide
          </a>
        </p>

        <div className="text-center">
          <Button variant="info" onClick={showSupport}>
            <FontAwesomeIcon icon={faCommentAlt} /> Live Chat Support
          </Button>

          <Button
            className="ml-2"
            variant="info"
            onClick={async () =>
              openTab({
                url: "https://calendly.com/pixiebrix-todd/live-support-session",
                active: true,
              })
            }
          >
            <FontAwesomeIcon icon={faPhone} /> Schedule FREE Zoom Session
          </Button>
        </div>
      </div>
    </Centered>
  );
};

export default NoExtensionsPane;
