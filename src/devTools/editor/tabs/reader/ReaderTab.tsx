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

import React, { useContext, useState } from "react";
import { Button, ListGroup, Tab } from "react-bootstrap";
import { FieldArray, useField, useFormikContext } from "formik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  FormState,
  isCustomReader,
  ReaderFormState,
  ReaderReferenceFormState,
} from "@/devTools/editor/editorSlice";
import ReaderConfig from "@/devTools/editor/tabs/reader/ReaderConfig";
import { makeDefaultReader } from "@/devTools/editor/extensionPoints/base";
import { DevToolsContext } from "@/devTools/context";
import {
  faBars,
  faBookReader,
  faPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import ReaderBlockConfig, {
  ReaderBlockForm,
} from "@/devTools/editor/tabs/reader/ReaderBlockConfig";
import BlockModal from "@/components/fields/BlockModal";
import { IBlock, IReader, selectMetadata } from "@/core";
import { useAsyncState } from "@/hooks/common";
import blockRegistry from "@/blocks/registry";
import { getType } from "@/blocks/util";
import { ContextMenuReader } from "@/extensionPoints/contextMenu";

const ReaderEntry: React.FunctionComponent<{
  reader: ReaderFormState | ReaderReferenceFormState | IReader;
  index: number;
  onSelect: () => void;
  onRemove?: () => void;
  isDragDisabled: boolean;
  isActive: boolean;
}> = ({ reader, index, isDragDisabled, isActive, onSelect, onRemove }) => {
  const meta = "metadata" in reader ? reader.metadata : reader;

  return (
    <Draggable
      index={index}
      isDragDisabled={isDragDisabled}
      draggableId={meta.id}
    >
      {(provided) => (
        <ListGroup.Item
          key={`${index}-${meta.id}`}
          onClick={onSelect}
          active={isActive}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="d-flex">
            <div {...provided.dragHandleProps}>
              <FontAwesomeIcon icon={faBars} />
            </div>
            <div className="ReaderList__label">
              <div>{meta.name}</div>
            </div>
            {onRemove && (
              <div className="ReaderList__actions">
                <span role="button" onClick={onRemove} className="text-danger">
                  <FontAwesomeIcon icon={faTimes} />
                </span>
              </div>
            )}
          </div>
        </ListGroup.Item>
      )}
    </Draggable>
  );
};

const CONTEXT_MENU_READER = new ContextMenuReader();

const ReaderTab: React.FunctionComponent<{
  eventKey?: string;
  editable: Set<string>;
  available: boolean;
}> = ({ eventKey = "reader", editable, available }) => {
  const { tabState } = useContext(DevToolsContext);

  const { values: formValues } = useFormikContext<FormState>();
  const [{ value: readers }] = useField<
    (ReaderReferenceFormState | ReaderFormState)[]
  >("readers");

  const [active, setActive] = useState(0);

  const [blocks] = useAsyncState(async () => {
    const all = await blockRegistry.all();
    const annotated = await Promise.all(
      all.map(async (block: IBlock) => {
        return {
          type: await getType(block),
          block,
        };
      })
    );
    return annotated.filter((x) => x.type === "reader").map((x) => x.block);
  }, []);

  return (
    <Tab.Pane eventKey={eventKey} className="h-100">
      <div className="d-flex">
        <FieldArray
          name="readers"
          render={({ push, move, remove }) => (
            <div className="h-100 ReaderSidebar flex-grow-0">
              <div className="d-flex">
                <BlockModal
                  onSelect={(x) => {
                    const count = readers.length;
                    push({ metadata: selectMetadata(x) });
                    setActive(count);
                  }}
                  blocks={blocks ?? []}
                  renderButton={({ show }) => (
                    <Button onClick={show} variant="info" size="sm">
                      <FontAwesomeIcon icon={faBookReader} /> Add Existing
                    </Button>
                  )}
                />
                <div>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => {
                      const count = readers.length;
                      push(
                        makeDefaultReader(
                          formValues.extensionPoint.metadata,
                          tabState.meta.frameworks ?? []
                        )
                      );
                      setActive(count);
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Create New
                  </Button>
                </div>
              </div>
              <DragDropContext
                onDragEnd={(x) => {
                  move(x.source.index, x.destination.index);
                  setActive(x.destination.index);
                }}
              >
                <Droppable droppableId="reader-list">
                  {(provided) => (
                    <ListGroup
                      className="ReaderList"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {readers.map((reader, index) => (
                        <ReaderEntry
                          key={`${index}-${reader.metadata.id}`}
                          index={index}
                          reader={reader}
                          onSelect={() => setActive(index)}
                          onRemove={() => {
                            setActive(Math.max(0, index - 1));
                            remove(index);
                          }}
                          isDragDisabled={readers.length === 1}
                          isActive={active === index}
                        />
                      ))}

                      {formValues.type === "contextMenu" && (
                        <ReaderEntry
                          isDragDisabled
                          index={readers.length}
                          reader={CONTEXT_MENU_READER}
                          onSelect={() => setActive(readers.length)}
                          isActive={active === readers.length}
                        />
                      )}
                    </ListGroup>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        />
        <div className="ReaderContent h-100">
          {
            // safe because active is a number
            // eslint-disable-next-line security/detect-object-injection
            readers.length > 0 && readers[active] != null && (
              <>
                {
                  // safe because active is a number
                  // eslint-disable-next-line security/detect-object-injection
                  isCustomReader(readers[active]) ? (
                    <ReaderConfig
                      editable={editable}
                      available={available}
                      readerIndex={active}
                    />
                  ) : (
                    <ReaderBlockConfig
                      readerIndex={active}
                      available={available}
                    />
                  )
                }
              </>
            )
          }
          {active === readers.length && formValues.type === "contextMenu" && (
            <ReaderBlockForm
              reader={CONTEXT_MENU_READER}
              available={available}
              testElement
            />
          )}
        </div>
      </div>
    </Tab.Pane>
  );
};

export default ReaderTab;
