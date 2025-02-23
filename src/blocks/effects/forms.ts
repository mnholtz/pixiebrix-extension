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

import { Effect } from "@/types";
import { registerBlock } from "@/blocks/registry";
import { BlockArg, BlockOptions, Schema } from "@/core";
import { boolean } from "@/utils";
import { BusinessError } from "@/errors";

/**
 * Set the value of an input, doing the right thing for check boxes, etc.
 */
function setValue(
  $input: JQuery<HTMLElement>,
  value: unknown,
  { dispatchEvent = true }: { dispatchEvent?: boolean } = {}
) {
  if ($input.is(":radio") || $input.is(":checkbox")) {
    $input.prop("checked", boolean(value));
  } else {
    $input.val(String(value));
  }

  if (dispatchEvent) {
    $input.each(function () {
      const event = new Event("change", { bubbles: true });
      this.dispatchEvent(event);
    });
  }
}

export class SetInputValue extends Effect {
  constructor() {
    super(
      "@pixiebrix/forms/set",
      "Set Input Value",
      "Set the value of an input field"
    );
  }

  inputSchema: Schema = {
    type: "object",
    properties: {
      inputs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              format: "selector",
            },
            value: {
              oneOf: [
                { type: "string" },
                { type: "boolean" },
                { type: "number" },
              ],
            },
          },
        },
        minItems: 1,
      },
    },
    required: ["inputs"],
  };

  async effect({ inputs }: BlockArg, { logger }: BlockOptions): Promise<void> {
    for (const { selector, value } of inputs) {
      const $input = $(document).find(selector);
      if ($input.length === 0) {
        logger.warn(`Could not find input for selector: ${selector}`);
      } else {
        setValue($input, value, { dispatchEvent: true });
      }
    }
  }
}

export class FormFill extends Effect {
  constructor() {
    super("@pixiebrix/form-fill", "Form Fill", "Fill out fields in a form");
  }

  inputSchema: Schema = {
    type: "object",
    properties: {
      formSelector: {
        type: "string",
        format: "selector",
      },
      fieldNames: {
        type: "object",
        additionalProperties: {
          oneOf: [{ type: "string" }, { type: "boolean" }, { type: "number" }],
        },
      },
      fieldSelectors: {
        type: "object",
        additionalProperties: {
          oneOf: [{ type: "string" }, { type: "boolean" }, { type: "number" }],
        },
      },
      submit: {
        description: "true to submit the form, or a JQuery selector to click",
        default: false,
        oneOf: [{ type: "string" }, { type: "boolean" }],
      },
    },
    required: ["formSelector"],
  };

  async effect(
    {
      formSelector,
      fieldNames = {},
      fieldSelectors = {},
      submit = false,
    }: BlockArg,
    { logger }: BlockOptions
  ): Promise<void> {
    const $form = $(document).find(formSelector);

    if ($form.length === 0) {
      throw new BusinessError(`Form not found for selector: ${formSelector}`);
    } else if ($form.length > 1) {
      throw new BusinessError(
        `Selector found ${$form.length} forms: ${formSelector}`
      );
    }

    for (const [name, value] of Object.entries(fieldNames)) {
      const $input = $form.find(`[name="${name}"]`);
      if ($input.length === 0) {
        logger.warn(`Could not find input ${name} on the form`);
      }
      setValue($input, value, { dispatchEvent: true });
    }

    for (const [selector, value] of Object.entries(fieldSelectors)) {
      const $input = $form.find(selector);
      if ($input.length === 0) {
        logger.warn(
          `Could not find input with selector ${selector} on the form`
        );
      }
      setValue($input, value, { dispatchEvent: true });
    }

    if (typeof submit === "boolean") {
      if (submit) {
        if (!$form.is("form")) {
          throw new BusinessError(
            `Can only submit a form element, got tag ${$form.get(0).tagName}`
          );
        }
        $form.trigger("submit");
      }
    } else if (typeof submit === "string") {
      const $submit = $form.find(submit);
      if ($submit.length === 0) {
        throw new BusinessError(`Did not find selector ${submit} in the form`);
      } else if ($submit.length > 1) {
        throw new BusinessError(
          `Found multiple elements for the submit selector ${submit} in the form`
        );
      }
      $submit.trigger("click");
    } else {
      throw new BusinessError("Unexpected argument for property submit");
    }
  }
}

registerBlock(new FormFill());
registerBlock(new SetInputValue());
