// @flow
import fs from 'fs';
import crypto from 'crypto';

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
    groupReport: GroupReport;
    name: string;
    parts: ScenarioPart[];

    constructor(groupReport: GroupReport, name: string) {
        this.groupReport = groupReport;
        this.name = name;
        this.parts = [];
    }

    dumpToFile() {
        createDirOrDoNothingIfExists('jsGiven-reports');
        const fileName = computeScenarioFileName(this.groupReport.name, this.name);
        const duplicate: ScenarioReport = _.cloneDeep(this);
        duplicate.groupReport.scenarios = [];
        fs.writeFileSync(`jsGiven-reports/${fileName}`, JSON.stringify(duplicate), 'utf-8');
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

function createDirOrDoNothingIfExists(path: string) {
    try {
        fs.mkdirSync('jsGiven-reports');
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        } else {
            // do nothing
        }
    }
}

export function computeScenarioFileName(groupName: string, scenarioName: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(groupName + '\n' +scenarioName);
    return hash.digest('hex');
}
