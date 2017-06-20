// @flow
import _ from 'lodash';

import {Stage} from './Stage';

const STATE_PROPERTIES_KEY = '__JSGIVEN_STATE_PROPERTIES';

export function State(target: any, key: string, descriptor: any): any {
    State.__addProperty(target, key);
    return {...descriptor, writable: true};
}
State.addProperty = (stageClass: Class<Stage>, property: string): void => {
    State.__addProperty(stageClass.prototype, property);
};
State.__addProperty = (prototype: any, property: string): void => {
    if (!prototype[STATE_PROPERTIES_KEY]) {
        prototype[STATE_PROPERTIES_KEY] = [];
    }
    prototype[STATE_PROPERTIES_KEY].push(property);
};

export function copyStateProperties(source: any, target: any) {
    if (
        source &&
        target &&
        source[STATE_PROPERTIES_KEY] &&
        target[STATE_PROPERTIES_KEY]
    ) {
        const propertyNames = _.intersection(
            source[STATE_PROPERTIES_KEY],
            target[STATE_PROPERTIES_KEY]
        );
        propertyNames.forEach(propertyName => {
            // Need to convert to any to avoid typechecking
            const sourceAny: any = source;
            const targetAny: any = target;
            targetAny[propertyName] = sourceAny[propertyName];
        });
    }
}
