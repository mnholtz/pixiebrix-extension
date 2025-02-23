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

import { Card, Nav, Tab } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faEyeSlash,
  faGlobe,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFormikContext } from "formik";
import CodeEditor from "./CodeEditor";
import SharingTable from "./Sharing";
import { sortBy } from "lodash";
import BrickLogs from "@/options/pages/brickEditor/BrickLogs";
import { MessageContext } from "@/core";
import BrickReference, {
  ReferenceEntry,
} from "@/options/pages/brickEditor/BrickReference";
import { useAsyncState } from "@/hooks/common";
import serviceRegistry from "@/services/registry";
import blockRegistry from "@/blocks/registry";
import extensionPointRegistry from "@/extensionPoints/registry";
import { useToasts } from "react-toast-notifications";
import { fetch } from "@/hooks/fetch";
import { Brick } from "@/types/contract";
import { browser } from "webextension-polyfill-ts";

const SharingIcon: React.FunctionComponent<{
  isPublic: boolean;
  organizations: boolean;
}> = ({ isPublic, organizations }) => {
  if (isPublic) {
    return <FontAwesomeIcon icon={faGlobe} />;
  } else if (organizations) {
    return <FontAwesomeIcon icon={faBuilding} />;
  } else {
    return <FontAwesomeIcon icon={faEyeSlash} />;
  }
};

export interface EditorValues {
  reactivate?: boolean;
  public: boolean;
  config: string;
  organizations: string[];
}

interface OwnProps {
  showTemplates?: boolean;
  showLogs?: boolean;
  logContext: MessageContext | null;
}

function isMac(): boolean {
  // https://stackoverflow.com/a/27862868/402560
  return navigator.platform.indexOf("Mac") > -1;
}

const Editor: React.FunctionComponent<OwnProps> = ({
  showTemplates,
  showLogs = true,
  logContext,
}) => {
  const { addToast } = useToasts();
  const [activeTab, setTab] = useState("edit");
  const [editorWidth, setEditorWidth] = useState();
  const [selectedReference, setSelectedReference] = useState<ReferenceEntry>();
  const { errors, values } = useFormikContext<EditorValues>();

  const [blocks] = useAsyncState(async () => {
    const [extensionPoints, blocks, services] = await Promise.all([
      extensionPointRegistry.all(),
      blockRegistry.all(),
      serviceRegistry.all(),
    ]);
    return [...extensionPoints, ...blocks, ...services];
  }, []);

  const openReference = useCallback(
    (id: string) => {
      const block = blocks?.find((x) => x.id === id);
      if (!block) {
        console.debug("Known bricks", {
          blocks: sortBy(blocks.map((x) => x.id)),
        });
        addToast(`Cannot find block: ${id}`, {
          appearance: "warning",
          autoDismiss: true,
        });
      } else {
        console.debug("Open reference for block: %s", block.id, { block });
        setSelectedReference(block);
        setTab("reference");
      }
    },
    [setTab, blocks, setSelectedReference, addToast]
  );

  const openEditor = useCallback(
    async (id: string) => {
      const available = await fetch<Brick[]>("/api/bricks/");
      const brick = available.find((x) => x.name === id);
      if (!brick) {
        addToast(`You cannot edit brick: ${id}`, {
          appearance: "warning",
          autoDismiss: true,
        });
      } else {
        console.debug("Open editor for brick: %s", id, { brick });
        const url = browser.runtime.getURL("options.html");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- we're constructing via server response
        window.open(`${url}#/workshop/bricks/${brick.id}`);
      }
    },
    [addToast]
  );

  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      setEditorWidth(editorRef.current.offsetWidth);
    }
  }, [editorRef]);

  return (
    <div>
      <div className="mb-3">
        <ul className="list-unstyled list-inline">
          <li className="list-inline-item">
            <kbd>{isMac() ? "Cmd" : "Ctrl"}</kbd> + <kbd>S</kbd>: Save
          </li>
          <li className="list-inline-item mx-3">
            <kbd>{isMac() ? "Cmd" : "Ctrl"}</kbd> + <kbd>B</kbd>: View Reference
          </li>
          <li className="list-inline-item mx-3">
            <kbd>{isMac() ? "Cmd" : "Ctrl"}</kbd> + <kbd>O</kbd>: Open Brick
          </li>
        </ul>
      </div>

      <Card ref={editorRef}>
        <Tab.Container
          id="editor-container"
          defaultActiveKey={activeTab}
          activeKey={activeTab}
        >
          <Card.Header>
            <Nav variant="tabs" onSelect={setTab}>
              <Nav.Link eventKey="edit">
                {errors.config ? (
                  <span className="text-danger">
                    Editor <FontAwesomeIcon icon={faTimesCircle} />
                  </span>
                ) : (
                  "Editor"
                )}
              </Nav.Link>
              <Nav.Link eventKey="share">
                Sharing{" "}
                <SharingIcon
                  isPublic={values.public}
                  organizations={!!values.organizations.length}
                />
              </Nav.Link>
              {showLogs && <Nav.Link eventKey="logs">Logs</Nav.Link>}
              <Nav.Link eventKey="reference">Reference</Nav.Link>
            </Nav>
          </Card.Header>

          <Tab.Content className="p-0">
            <Tab.Pane eventKey="edit" className="p-0">
              <CodeEditor
                name="config"
                width={editorWidth}
                showTemplates={showTemplates}
                openDefinition={openReference}
                openEditor={openEditor}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="share" className="p-0">
              <SharingTable />
            </Tab.Pane>

            {showLogs && (
              <Tab.Pane eventKey="logs" className="p-0">
                {logContext ? (
                  <BrickLogs context={logContext} />
                ) : (
                  <div className="p-4">
                    Cannot determine log context for brick
                  </div>
                )}
              </Tab.Pane>
            )}

            <Tab.Pane eventKey="reference" className="p-0">
              <BrickReference
                key={selectedReference?.id}
                blocks={blocks}
                initialSelected={selectedReference}
              />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Card>
    </div>
  );
};

export default Editor;
