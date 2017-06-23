// @flow
import {Stage} from './Stage';
import {
    getStageMetadataStoreProvider,
    type StageMetadataStoreProvider,
} from './stage-metadata-store';
import {checkIsFunction} from './checks';

const storeProvider: StageMetadataStoreProvider<
    string
> = getStageMetadataStoreProvider('@Hidden');

export function Hidden(target: any, key: string, descriptor: any): any {
    checkIsFunction(
        target[key],
        `@Hidden decorator can only be applied to methods: '${key}' is not a method.`
    );
    storeProvider.getStoreFromTarget(target).addProperty(key);
    return {...descriptor, writable: true};
}
Hidden.addHiddenStep = (stageClass: Class<Stage>, property: string): void => {
    checkIsFunction(
        // $FlowIgnore
        stageClass.prototype[property],
        `Hidden.addHiddenStep() can only be applied to methods: '${property}' is not a method.`
    );
    storeProvider.getStoreFromStageClass(stageClass).addProperty(property);
};

export function isHiddenStep(stage: Stage, stepName: string): boolean {
    const steps = storeProvider.getStoreFromTarget(stage).getProperties();
    return steps.includes(stepName);
}
