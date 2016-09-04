// @flow
import _ from 'lodash';
import humanize from 'string-humanize';

export type ScenarioPartKind = 'GIVEN' | 'WHEN' | 'THEN';

export class ScenarioPart {
    kind: ScenarioPartKind;
    steps: Step[];

    constructor(kind: ScenarioPartKind) {
        this.kind = kind;
        this.steps = [];
    }

    addStep(methodName: string, parameters: mixed[]) {
        const isFirstStep = this.steps.length === 0;
        this.steps.push(new Step(methodName, parameters, isFirstStep));
    }
}

export class Step {
    name: string;
    methodName: string;

    constructor(methodName: string, parameters: mixed[], isFirstStep: boolean) {
        const TWO_DOLLAR_PLACEHOLDER = 'zzblablaescapedollarsignplaceholdertpolm';

        this.name = methodName
            .replace('$$', TWO_DOLLAR_PLACEHOLDER)
            .split('$')
            .map((word, index) =>
                isFirstStep && index === 0 ? humanize(word) : _.lowerCase(humanize(word))
            )
            .reduce((previous, newString, index) =>
                `${previous} ${formatParameter(parameters[index - 1])} ${newString}`
            )
            .trim()
            .replace(TWO_DOLLAR_PLACEHOLDER, '$');

        function formatParameter(parameter: any): string {
            if (_.isObject(parameter) || Array.isArray(parameter)) {
                if (parameter.toString &&
                    parameter.toString !== Object.prototype.toString &&
                    parameter.toString !== Array.prototype.toString) {
                    return parameter.toString();
                }
                return JSON.stringify(parameter);
            } else {
                return parameter.toString ? parameter.toString() : JSON.stringify(parameter);
            }
        }
    }
}

export class ScenarioReport {
    name: string;
    parts: ScenarioPart[];

    constructor(name: string) {
        this.name = name;
        this.parts = [];
    }
}

export class GroupReport {
    name: string;
    scenarios: ScenarioReport[];

    constructor(name: string) {
        this.name = name;
        this.scenarios = [];
    }
}
