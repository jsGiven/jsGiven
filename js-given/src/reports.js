// @flow
import fs from 'fs';
import crypto from 'crypto';

import _ from 'lodash';
import humanize from 'string-humanize';

export const REPORTS_DESTINATION = '.jsGiven-reports';

export type ScenarioPartKind = 'GIVEN' | 'WHEN' | 'THEN';

const INTRO_WORD_METHODS = ['given', 'when', 'then', 'and', 'but', 'with'];

export class ScenarioPart {
    kind: ScenarioPartKind;
    steps: Step[];
    introWord: string | null;

    constructor(kind: ScenarioPartKind, steps?: Step[] = []) {
        this.kind = kind;
        this.steps = steps;
        this.introWord = null;
    }

    stageMethodCalled(methodName: string, parameters: mixed[]) {
        if (INTRO_WORD_METHODS.find(introWord => introWord === methodName)) {
            this.introWord = methodName;
        } else {
            const isFirstStep = this.steps.length === 0;
            this.steps.push(new Step(methodName, parameters, isFirstStep, this.introWord));
            this.introWord = null;
        }
    }
}

export class Step {
    name: string;
    methodName: string;
    words: Word[];

    constructor(methodName: string, parameters: mixed[], isFirstStep: boolean, introWord: string | null) {
        const TWO_DOLLAR_PLACEHOLDER = 'zzblablaescapedollarsignplaceholdertpolm';

        const parametersCopy = [...parameters];
        let words: Word[] = [
            ...methodName // 'a_bill_of_$_$$'
                .replace('$$', TWO_DOLLAR_PLACEHOLDER) // 'a_bill_of_$_TWO_DOLLAR_PLACEHOLDER'
                .split('$') // ['a_bill_of', 'TWO_DOLLAR_PLACEHOLDER']
                .map(word => _.lowerCase(humanize(word))) //  ['a bill of', 'TWO_DOLLAR_PLACEHOLDER']
                .reduce((previous, newString, index) => {
                    if (index === 0) {
                        return [newString];
                    }

                    let formattedParameters;
                    if (parametersCopy.length > 0) {
                        const [parameter] = parametersCopy.splice(0, 1);
                        formattedParameters = [formatParameter(parameter)];
                    } else {
                        formattedParameters = [];
                    }

                    return [...previous, ...formattedParameters, newString];
                }, []) //  ['a bill of', '500', 'TWO_DOLLAR_PLACEHOLDER']
                .filter(word => word !== '') // If one puts a $ at the end of the method, this adds a useless '' at the end
                .map(word => word.replace(TWO_DOLLAR_PLACEHOLDER, '$')) //  ['a bill of', '500', '$']
                .map(toWord), // [Word, Word, Word]
            ...parametersCopy.map(formatParameter).map(toWord),
        ];

        if (introWord) {
            words = [toIntroWord(introWord), ...words];
        }

        if (isFirstStep) {
            const [{value, isIntroWord}, ...rest] = words;
            words = [new Word(_.upperFirst(value), isIntroWord), ...rest];
        }
        this.words = words;
        this.name = words.map(({value}) => value).join(' ');

        function formatParameter(parameter: any): string {
            if (_.isObject(parameter) || Array.isArray(parameter)) {
                if (parameter.toString &&
                    parameter.toString !== Object.prototype.toString &&
                    parameter.toString !== Array.prototype.toString) {
                    return parameter.toString();
                }
                return JSON.stringify(parameter);
            } else {
                return parameter && parameter.toString ? parameter.toString() : JSON.stringify(parameter);
            }
        }

        function toWord(value: string): Word {
            return new Word(value, false);
        }

        function toIntroWord(value: string): Word {
            return new Word(value, true);
        }
    }
}

export class Word {
    value: string;
    isIntroWord: boolean;

    constructor(value: string, isIntroWord: boolean) {
        this.value = value;
        this.isIntroWord = isIntroWord;
    }
}

export class ScenarioReport {
    groupReport: GroupReport;
    name: string;
    parts: ScenarioPart[];

    constructor(groupReport: GroupReport, name: string, parts?: ScenarioPart[] = []) {
        this.groupReport = groupReport;
        this.name = name;
        this.parts = parts;
    }

    dumpToFile() {
        createDirOrDoNothingIfExists(REPORTS_DESTINATION);
        const fileName = computeScenarioFileName(this.groupReport.name, this.name);
        fs.writeFileSync(`${REPORTS_DESTINATION}/${fileName}`, JSON.stringify(this), 'utf-8');
    }
}

export class GroupReport {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

function createDirOrDoNothingIfExists(path: string) {
    try {
        fs.mkdirSync(REPORTS_DESTINATION);
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
