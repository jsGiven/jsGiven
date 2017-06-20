// @flow
import {Stage} from './Stage';

const HIDDEN_STEPS_KEY = '__JSGIVEN_HIDDEN_STEPS';

export function Hidden(target: any, key: string, descriptor: any): any {
    Hidden.__addHiddenStep(target, key);
    return {...descriptor, writable: true};
}
Hidden.addHiddenStep = (stageClass: Class<Stage>, property: string): void => {
    Hidden.__addHiddenStep(stageClass.prototype, property);
};
Hidden.__addHiddenStep = (prototype: any, property: string): void => {
    if (!prototype[HIDDEN_STEPS_KEY]) {
        prototype[HIDDEN_STEPS_KEY] = [];
    }
    prototype[HIDDEN_STEPS_KEY].push(property);
};

export function isHiddenStep(stage: Stage, stepName: string): boolean {
    const {[HIDDEN_STEPS_KEY]: steps = []} = (stage: any);
    return steps.includes(stepName);
}
