// @flow
import _ from 'lodash';

import { Stage } from './Stage';
import {
    getStageMetadataStoreProvider,
    type StageMetadataStoreProvider,
} from './stage-metadata-store';

const stateProvider: StageMetadataStoreProvider<
    string
> = getStageMetadataStoreProvider('@State');

export function State(target: any, key: string, descriptor: any): any {
    stateProvider.getStoreFromTarget(target).addProperty(key);
    return { ...descriptor, writable: true };
}
State.addProperty = (stageClass: Class<Stage>, property: string): void => {
    stateProvider.getStoreFromStageClass(stageClass).addProperty(property);
};

export function copyStateProperties(source: any, target: any) {
    if (source && target) {
        const propertyNames = _.intersection(
            stateProvider.getStoreFromTarget(source).getProperties(),
            stateProvider.getStoreFromTarget(target).getProperties()
        );
        propertyNames.forEach(propertyName => {
            // Need to convert to any to avoid typechecking
            const sourceAny: any = source;
            const targetAny: any = target;
            targetAny[propertyName] = sourceAny[propertyName];
        });
    }
}
