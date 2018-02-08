// @flow
import _ from 'lodash';
import isPromise from 'is-promise';

import { Stage } from './Stage';
import {
  getStageMetadataStoreProvider,
  type StageMetadataStoreProvider,
} from './stage-metadata-store';
import { copyStateToOtherStages } from './State';

const beforeProvider: StageMetadataStoreProvider<
  string
> = getStageMetadataStoreProvider('@Before');

export function Before(target: any, key: string, descriptor: any): any {
  beforeProvider.getStoreFromTarget(target).addProperty(key);
  return { ...descriptor, writable: true };
}
Before.addProperty = (stageClass: Class<Stage>, property: string): void => {
  beforeProvider.getStoreFromStageClass(stageClass).addProperty(property);
};

const afterProvider: StageMetadataStoreProvider<
  string
> = getStageMetadataStoreProvider('@After');

export function After(target: any, key: string, descriptor: any): any {
  afterProvider.getStoreFromTarget(target).addProperty(key);
  return { ...descriptor, writable: true };
}
After.addProperty = (stageClass: Class<Stage>, property: string): void => {
  afterProvider.getStoreFromStageClass(stageClass).addProperty(property);
};

const aroundProvider: StageMetadataStoreProvider<
  string
> = getStageMetadataStoreProvider('@Around');

export function Around(target: any, key: string, descriptor: any): any {
  aroundProvider.getStoreFromTarget(target).addProperty(key);
  return { ...descriptor, writable: true };
}
Around.addProperty = (stageClass: Class<Stage>, property: string): void => {
  aroundProvider.getStoreFromStageClass(stageClass).addProperty(property);
};

export function isLifecycleMethod(stage: Stage, methodName: string): boolean {
  return (
    beforeProvider
      .getStoreFromTarget(stage)
      .getProperties()
      .includes(methodName) ||
    afterProvider
      .getStoreFromTarget(stage)
      .getProperties()
      .includes(methodName) ||
    aroundProvider
      .getStoreFromTarget(stage)
      .getProperties()
      .includes(methodName)
  );
}

export async function initStages(...stages: Stage[]): Promise<void> {
  for (const stage of stages) {
    const aroundProperties = aroundProvider
      .getStoreFromTarget(stage)
      .getProperties();
    installAroundWrappers(stage, aroundProperties);
    for (const property of aroundProperties) {
      await (stage: any)[aroundWrapperPropertyName(property)].before();
    }

    const beforeProperties = beforeProvider
      .getStoreFromTarget(stage)
      .getProperties();
    await invokeBeforeAfterMethods(stage, beforeProperties);

    copyStateToOtherStages(stage, stages);
  }
}

export async function cleanupStages(...stages: Stage[]): Promise<void> {
  for (const stage of stages) {
    const afterProperties = afterProvider
      .getStoreFromTarget(stage)
      .getProperties();
    await invokeBeforeAfterMethods(stage, afterProperties);

    const aroundProperties = aroundProvider
      .getStoreFromTarget(stage)
      .getProperties();
    for (const property of aroundProperties) {
      await (stage: any)[aroundWrapperPropertyName(property)].after();
    }
  }
}

async function invokeBeforeAfterMethods(
  stage: Stage,
  methodNames: string[]
): Promise<void> {
  for (const methodName of methodNames) {
    const stageAny: any = stage;
    const func = stageAny[methodName];
    if (_.isFunction(func)) {
      const lifecycleResult = func.apply(stage, []);
      // only await on promises, sadly methods that return this (a stage)
      // also have a then() method and are awaited :(
      if (isPromise(lifecycleResult) && stage !== lifecycleResult) {
        await lifecycleResult;
      }
    }
  }
}

function installAroundWrappers(stage: Stage, aroundProperties: string[]) {
  aroundProperties.forEach(property => {
    Object.defineProperty(stage, aroundWrapperPropertyName(property), {
      value: aroundToBeforeAfter(test => (stage: any)[property](test)),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  });
}
function aroundWrapperPropertyName(property: string): string {
  return `__JSGIVEN__INTERNAL__AROUND_PROPERTY__${property}__KEY__`;
}

// @VisibleForTesting
export type AroundMethod = (() => Promise<void>) => Promise<void>;

// @VisibleForTesting
export type BeforeAfterMethods = {
  before: () => Promise<void>,
  after: () => Promise<void>,
};

// @VisibleForTesting
export function aroundToBeforeAfter(
  aroundMethod: AroundMethod
): BeforeAfterMethods {
  let currentlyExecuting: 'NONE' | 'BEFORE' | 'TEST' | 'AFTER' = 'NONE';
  let promiseOfAroundMethod;
  let resolveBefore;
  let rejectBefore;
  let resolveTest;

  return {
    before(): Promise<void> {
      if (currentlyExecuting !== 'NONE') {
        return Promise.reject(new Error('before() must be invoked only once'));
      } else {
        currentlyExecuting = 'BEFORE';
      }

      const beforePromise = new Promise((resolve, reject) => {
        resolveBefore = resolve;
        rejectBefore = reject;
      });
      promiseOfAroundMethod = aroundMethod(() => {
        currentlyExecuting = 'TEST';
        resolveBefore();
        return new Promise((resolve, reject) => {
          resolveTest = resolve;
        });
      }).catch(beforeError => {
        if (currentlyExecuting === 'BEFORE') {
          // Catch the error, and reject it in the before() promise !
          rejectBefore(beforeError);
        } else {
          // Re-throw error it will get caught in the after() promise
          throw beforeError;
        }
      });
      return beforePromise;
    },

    after(): Promise<void> {
      if (currentlyExecuting !== 'TEST') {
        return Promise.reject(
          new Error(
            'before() must be invoked and awaited first, after() must be invoked only once'
          )
        );
      } else {
        currentlyExecuting = 'AFTER';
        // Resume around method execution
        resolveTest();
        return promiseOfAroundMethod;
      }
    },
  };
}
