// @flow
import _ from 'lodash';
import isPromise from 'is-promise';

import { Stage } from './Stage';
import {
  getStageMetadataStoreProvider,
  type StageMetadataStoreProvider,
} from './stage-metadata-store';

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

const ruleProvider: StageMetadataStoreProvider<
  string
> = getStageMetadataStoreProvider('@Rule');

export function Rule(target: any, key: string, descriptor: any): any {
  ruleProvider.getStoreFromTarget(target).addProperty(key);
  return { ...descriptor, writable: true };
}
Rule.addProperty = (stageClass: Class<Stage>, property: string): void => {
  ruleProvider.getStoreFromStageClass(stageClass).addProperty(property);
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
      .includes(methodName)
  );
}

export async function initStages(...stages: Stage[]): Promise<void> {
  for (const stage of stages) {
    const beforeProperties = beforeProvider
      .getStoreFromTarget(stage)
      .getProperties();
    for (const beforeProperty of beforeProperties) {
      const stageAny: any = stage;
      const beforeFunction = stageAny[beforeProperty];
      if (_.isFunction(beforeFunction)) {
        const lifecycleResult = beforeFunction.apply(stage, []);
        // only await on promises, sadly methods that return this (a stage)
        // also have a then() method then and are awaited :(
        if (isPromise(lifecycleResult) && stage !== lifecycleResult) {
          await lifecycleResult;
        }
      }
    }
  }
}
