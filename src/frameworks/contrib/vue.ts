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

// Adapted from the vue-devtools
// https://github.com/vuejs/vue-devtools/blob/6d8fee4d058716fe72825c9ae22cf831ef8f5172/packages/app-backend/src/index.js#L185
// https://github.com/vuejs/vue-devtools/blob/dev/packages/app-backend/src/utils.js

import { pickBy } from "lodash";
import { RootInstanceVisitor } from "@/frameworks/scanner";
import { traverse, WriteableComponentAdapter } from "@/frameworks/component";

declare global {
  interface Window {
    Vue?: {
      version: string;
    };
  }
}

interface BaseVue {
  super?: BaseVue;
  config: unknown;
}

interface Instance {
  $root?: Instance;
  _isFragment: boolean;
  constructor: BaseVue;
  _fragmentEnd?: unknown;
}

interface VueHTMLElement {
  __vue__: Instance;
}

// interface VNode {
//   _isVue: boolean;
//   $el: HTMLElement;
// }

export class VueRootVisitor implements RootInstanceVisitor<Instance> {
  public rootInstances: Instance[] = [];
  private inFragment = false;
  private currentFragment: Instance = null;

  private processInstance(instance: Instance): boolean {
    if (instance) {
      if (this.rootInstances.indexOf(instance.$root) === -1) {
        instance = instance.$root;
      }
      if (instance._isFragment) {
        this.inFragment = true;
        this.currentFragment = instance;
      }
      let baseVue = instance.constructor;
      while (baseVue.super) {
        baseVue = baseVue.super;
      }
      if (baseVue.config) {
        this.rootInstances.push(instance);
      }
      return true;
    }
    return false;
  }

  visit(node: Node | Element): boolean {
    if (this.inFragment) {
      if (node === this.currentFragment._fragmentEnd) {
        this.inFragment = false;
        this.currentFragment = null;
      }
      return true;
    }
    const instance = (node as any).__vue__;
    return this.processInstance(instance);
  }
}

export function getVersion(): string | null {
  return window.Vue?.version;
}

export function isComponent(
  element: HTMLElement
): element is HTMLElement & VueHTMLElement {
  return "__vue__" in element;
}

const adapter: WriteableComponentAdapter<Instance> = {
  isComponent,
  elementComponent: (element: HTMLElement) =>
    isComponent(element) ? element.__vue__ : undefined,
  getOwner: (element: HTMLElement, options) =>
    traverse(
      element,
      isComponent,
      (x) => x.parentElement,
      options?.maxTraverseUp
    ),
  getData: (instance: Instance) => {
    // TODO: might want to read from $data here also
    return pickBy(
      instance,
      (value, key) =>
        typeof value !== "function" &&
        !key.startsWith("$") &&
        !key.startsWith("_")
    );
  },
  setData: (instance: Instance, data) => {
    for (const [key, value] of Object.entries(data)) {
      (instance as any)[key] = value;
    }
  },
};

export default adapter;
