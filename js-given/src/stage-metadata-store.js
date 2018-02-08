// @flow
import { Stage } from './Stage';

interface StageMetadataStore<T> {
  addProperty(property: T): void;
  getProperties(): T[];
}

export type StageMetadataStoreProvider<T> = {
  +getStoreFromTarget: (target: Stage) => StageMetadataStore<T>,
  +getStoreFromStageClass: (stageClass: Class<Stage>) => StageMetadataStore<T>,
};

export function getStageMetadataStoreProvider<T>(
  key: string
): StageMetadataStoreProvider<T> {
  const KEY = `__JSGIVEN__INTERNAL__STAGE_METADATA_STORE__${key}__KEY__`;

  function getOrBuildStore<T>(target: any): StageMetadataStore<T> {
    if (!target[KEY]) {
      Object.defineProperty(target, KEY, {
        value: new StageMetadataStoreImpl(),
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }

    return target[KEY];
  }

  return {
    getStoreFromTarget(target: Stage): StageMetadataStore<T> {
      return getOrBuildStore(target);
    },
    getStoreFromStageClass(stageClass: Class<Stage>): StageMetadataStore<T> {
      return getOrBuildStore(stageClass.prototype);
    },
  };
}

class StageMetadataStoreImpl<T> {
  properties: T[] = [];
  addProperty(property: T) {
    this.properties.push(property);
  }
  getProperties(): T[] {
    return this.properties;
  }
}
