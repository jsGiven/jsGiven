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

    addStep(methodName: string) {
        const name = this.steps.length > 0 ?
            _.lowerCase(humanize(methodName)) :
            humanize(methodName);
        this.steps.push({name});
    }
}

type Step = {
    name: string;
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
