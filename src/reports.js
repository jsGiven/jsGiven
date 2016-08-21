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

class Step {
    name: string;

    constructor(methodName: string, parameters: mixed[], isFirstStep: boolean) {
        const strings = methodName.split('$').map((word, index) =>
            isFirstStep && index === 0 ? humanize(word) : _.lowerCase(humanize(word))
        );

        this.name = strings.reduce((previous, newString, index) => {
            const build = previous + `${parameters[index - 1]} ` + newString;
            return build;
        });
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
