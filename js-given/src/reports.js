// @flow
import fs from 'fs';
import crypto from 'crypto';

import _ from 'lodash';
import humanize from 'string-humanize';

import { type DecodedParameter } from './parametrized-scenarios';
import { type Formatter } from './parameter-formatting';

export type ScenarioPartKind = 'GIVEN' | 'WHEN' | 'THEN';

export const REPORTS_DESTINATION = '.jsGiven-reports';

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

    stageMethodCalled(
        methodName: string,
        parameters: DecodedParameter[],
        stepStatus: StepStatus,
        executionTimeInNanos: number
    ) {
        if (INTRO_WORD_METHODS.find(introWord => introWord === methodName)) {
            this.introWord = methodName;
        } else {
            const isFirstStep = this.steps.length === 0;
            this.steps.push(
                new Step(
                    methodName,
                    parameters,
                    isFirstStep,
                    this.introWord,
                    stepStatus,
                    executionTimeInNanos
                )
            );
            this.introWord = null;
        }
    }
}

type StepStatus = 'PASSED' | 'FAILED' | 'SKIPPED';

export class Step {
    name: string;
    methodName: string;
    words: Word[];
    status: StepStatus;
    durationInNanos: number;

    constructor(
        methodName: string,
        parameters: DecodedParameter[],
        isFirstStep: boolean,
        introWord: string | null,
        stepStatus: StepStatus,
        durationInNanos: number
    ) {
        const TWO_DOLLAR_PLACEHOLDER =
            'zzblablaescapedollarsignplaceholdertpolm';

        const parametersCopy = [...parameters];

        let words: Word[] = [
            ...methodName // 'a_bill_of_$_$$'
                .replace('$$', TWO_DOLLAR_PLACEHOLDER) // 'a_bill_of_$_TWO_DOLLAR_PLACEHOLDER'
                .split('$') // ['a_bill_of', 'TWO_DOLLAR_PLACEHOLDER']
                .map(word => _.lowerCase(humanize(word))) //  ['a bill of', 'TWO_DOLLAR_PLACEHOLDER']
                .reduce((previous, newString, index) => {
                    if (index === 0) {
                        return [
                            { word: newString, scenarioParameterName: null },
                        ];
                    }

                    let formattedParameters: WordDescription[];
                    if (parametersCopy.length > 0) {
                        const [parameter] = parametersCopy.splice(0, 1);
                        const word = formatParameter(
                            parameter.value,
                            parameter.formatters
                        );
                        formattedParameters = [
                            {
                                word,
                                scenarioParameterName:
                                    parameter.scenarioParameterName,
                            },
                        ];
                    } else {
                        formattedParameters = [];
                    }

                    return [
                        ...previous,
                        ...formattedParameters,
                        { word: newString, scenarioParameterName: null },
                    ];
                }, []) //  ['a bill of', '500', 'TWO_DOLLAR_PLACEHOLDER']
                .filter(({ word }) => word !== '') // If one puts a $ at the end of the method, this adds a useless '' at the end
                .map(({ word, scenarioParameterName }) => ({
                    word: word.replace(TWO_DOLLAR_PLACEHOLDER, '$'),
                    scenarioParameterName,
                })) //  ['a bill of', '500', '$']
                .map(toWord), // [Word, Word, Word]
            ...parametersCopy
                .map(parameter => ({
                    word: formatParameter(
                        parameter.value,
                        parameter.formatters
                    ),
                    scenarioParameterName: parameter.scenarioParameterName,
                }))
                .map(toWord),
        ];

        if (introWord !== null) {
            words = [toIntroWord(introWord), ...words];
        }

        if (isFirstStep) {
            const [{ value, isIntroWord }, ...rest] = words;
            words = [new Word(_.upperFirst(value), isIntroWord), ...rest];
        }
        this.words = words;
        this.name = words.map(({ value }) => value).join(' ');
        this.status = stepStatus;
        this.durationInNanos = durationInNanos;

        function toWord({
            word,
            scenarioParameterName,
        }: WordDescription): Word {
            return new Word(word, false, scenarioParameterName);
        }

        function toIntroWord(value: string): Word {
            return new Word(value, true, null);
        }

        type WordDescription = {
            word: string,
            scenarioParameterName: string | null,
        };
    }
}

export class Word {
    value: string;
    isIntroWord: boolean;
    scenarioParameterName: string | null;

    constructor(
        value: string,
        isIntroWord: boolean,
        scenarioParameterName: string | null = null
    ) {
        this.value = value;
        this.isIntroWord = isIntroWord;
        this.scenarioParameterName = scenarioParameterName;
    }
}

export class ScenarioCase {
    args: string[];
    parts: ScenarioPart[];
    successful: boolean;
    durationInNanos: number;
    errorMessage: string | null;
    stackTrace: string[] | null;

    constructor(args: string[] = [], parts: ScenarioPart[] = []) {
        this.args = args;
        this.parts = parts;
    }
}

export type ScenarioExecutionStatus = 'SUCCESS' | 'FAILED';

export class ScenarioReport {
    groupReport: GroupReport;
    name: string;
    cases: ScenarioCase[];
    argumentNames: string[];
    executionStatus: ScenarioExecutionStatus;

    constructor(
        groupReport: GroupReport,
        name: string,
        cases: ScenarioCase[],
        argumentNames: string[]
    ) {
        this.groupReport = groupReport;
        this.name = name;
        this.cases = cases;
        this.argumentNames = argumentNames;
    }

    dumpToFile(reportsDestination: string) {
        createDirOrDoNothingIfExists(reportsDestination);
        const fileName = computeScenarioFileName(
            this.groupReport.name,
            this.name
        );
        fs.writeFileSync(
            `${reportsDestination}/${fileName}`,
            JSON.stringify(this),
            'utf-8'
        );
    }
}

export function formatParameter(
    parameter: any,
    formatters: Formatter[]
): string {
    if (formatters.length > 0) {
        return applyFormatters(parameter, formatters);
    } else {
        return applyDefaultFormatter(parameter);
    }
}

function applyFormatters(parameter: any, formatters: Formatter[]): string {
    let value = parameter;
    for (const formatter of formatters) {
        value = formatter(value);
    }
    return formatParameter(value, []);
}

function applyDefaultFormatter(parameter: any): string {
    let result;
    if (_.isString(parameter)) {
        result = parameter;
    } else if (isObjectOrArray(parameter)) {
        if (hasOverridenTostring(parameter)) {
            result = parameter.toString();
        } else {
            result = JSON.stringify(parameter);
        }
    } else {
        if (hasToString(parameter)) {
            result = parameter.toString();
        } else {
            result = JSON.stringify(parameter);
        }
    }
    return result;
}

function isObjectOrArray(parameter: any): boolean {
    return _.isObject(parameter) || Array.isArray(parameter);
}

function hasOverridenTostring(parameter: any): boolean {
    return (
        parameter.toString &&
        parameter.toString !== Object.prototype.toString &&
        parameter.toString !== Array.prototype.toString
    );
}

function hasToString(parameter: any): boolean {
    return parameter && parameter.toString;
}

export class GroupReport {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

function createDirOrDoNothingIfExists(path: string) {
    try {
        fs.mkdirSync(path);
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        } else {
            // do nothing
        }
    }
}

export function computeScenarioFileName(
    groupName: string,
    scenarioName: string
): string {
    const hash = crypto.createHash('sha256');
    hash.update(groupName + '\n' + scenarioName);
    return hash.digest('hex');
}
