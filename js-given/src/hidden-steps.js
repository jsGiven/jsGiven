// @flow
import {Stage} from './Stage';
import {
    getStageMetadataStoreProvider,
    type StageMetadataStoreProvider,
} from './stage-metadata-store';

const storeProvider: StageMetadataStoreProvider<
    string
> = getStageMetadataStoreProvider('@Hidden');

export function Hidden(target: any, key: string, descriptor: any): any {
    storeProvider.getStoreFromTarget(target).addProperty(key);
    return {...descriptor, writable: true};
}
Hidden.addHiddenStep = (stageClass: Class<Stage>, property: string): void => {
    storeProvider.getStoreFromStageClass(stageClass).addProperty(property);
};

export function isHiddenStep(stage: Stage, stepName: string): boolean {
    const steps = storeProvider.getStoreFromTarget(stage).getProperties();
    return steps.includes(stepName);
}
