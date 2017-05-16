// @flow
import _ from 'lodash';
import humanize from 'string-humanize';
import retrieveArguments from 'retrieve-arguments';

import {Stage} from './Stage';
import type {GroupFunc, TestFunc} from './test-runners';
import {formatParameter, GroupReport, ScenarioCase, ScenarioReport, ScenarioPart} from './reports';

export const REPORTS_DESTINATION = '.jsGiven-reports';

type ScenariosParam<G, W, T> = {
    given: () => G;
    when: () => W;
    then: () => T;
}

type ScenariosFunc<G, W, T> = {
    (scenariosParam: ScenariosParam<G, W, T>): {[key:string]: ScenarioFunc};
}

export type ScenarioFunc = SimpleScenarioFunc | ParametrizedScenarioFuncWithParameters<*>;

export type SimpleScenarioFunc = {
    (): void;
}

export type ParametrizedScenarioFuncWithParameters<T> = {
    func: ParametrizedScenarioFunc<T>;
    parameters: T[];
}

export type ParametrizedScenarioFunc<T> = {
    (param: T): void;
}

type StagesParam<G, W, T> = [Class<G>, Class<W>, Class<T>] | Class<G & W & T>;

export class ScenarioRunner {
    groupFunc: GroupFunc;
    testFunc: TestFunc;
    currentCase: ScenarioCase;
    currentPart: ScenarioPart;
    reportsDestination: string;

    constructor(reportsDestination: string = REPORTS_DESTINATION) {
        this.reportsDestination = reportsDestination;
    }

    setup(groupFunc: GroupFunc, testFunc: TestFunc) {
        this.groupFunc = groupFunc;
        this.testFunc = testFunc;
    }

    scenarios<G: Stage, W: Stage, T: Stage>(
            groupName: string,
            stagesParams: StagesParam<G, W, T>,
            scenariosFunc: ScenariosFunc<G, W, T>) {

        const humanizedGroupName = humanize(groupName);
        const report = new GroupReport(humanizedGroupName);

        let currentGiven: ?G;
        let currentWhen: ?W;
        let currentThen: ?T;

        let scenariosParam: ScenariosParam<G, W, T>;
        if (Array.isArray(stagesParams)) {
            const self = this;

            const [givenClass, whenClass, thenClass] = stagesParams;
            const getOrBuildGiven: () => G = () => {
                if (!currentGiven) {
                    currentGiven = self.buildObject(givenClass);
                }
                return currentGiven.given();
            };

            const getOrBuildWhen: () => W = () => {
                if (!currentWhen) {
                    currentWhen = self.buildObject(whenClass);
                    copyStateProperties(currentGiven, currentWhen);
                }
                return currentWhen.when();
            };

            const getOrBuildThen: () => T = () => {
                if (!currentThen) {
                    currentThen = self.buildObject(thenClass);
                    copyStateProperties(currentGiven, currentThen);
                    copyStateProperties(currentWhen, currentThen);
                }
                return currentThen.then();
            };

            scenariosParam = this.addGivenWhenThenParts({
                given: getOrBuildGiven,
                when: getOrBuildWhen,
                then: getOrBuildThen,
            });
        } else {
            const self = this;
            const givenClass = (stagesParams: any);

            const getOrBuildGWT: () => G & W & T = () => {
                if (!currentGiven) {
                    currentGiven = self.buildObject(givenClass);
                    currentWhen = currentGiven;
                    currentThen = currentWhen;
                }
                return (currentGiven: any);
            };

            scenariosParam = this.addGivenWhenThenParts({
                given: () => getOrBuildGWT().given(),
                when: () => getOrBuildGWT().when(),
                then: () => getOrBuildGWT().then(),
            });
        }

        this.groupFunc(humanizedGroupName, () => {
            const scenarios = scenariosFunc(scenariosParam);

            getScenarios(scenarios).forEach(({scenarioPropertyName, cases, argumentNames}) => {
                const scenarioNameForHumans = humanize(scenarioPropertyName);
                const scenario = this.addScenario(report, scenarioNameForHumans, argumentNames);

                let casesCount = 0;
                cases.forEach(({caseFunction, args}, index) => {
                    const caseDescription = cases.length === 1 ? scenarioNameForHumans : `${scenarioNameForHumans} #${index+1}`;
                    this.testFunc(caseDescription, () => {
                        this.addCase(scenario, args);

                        // Reset stages
                        currentGiven = currentWhen = currentThen = undefined;

                        // Execute scenario
                        try {
                            caseFunction();
                        } finally {
                            casesCount++;
                            if (casesCount === cases.length) {
                                scenario.dumpToFile(this.reportsDestination);
                            }
                        }
                    });
                });
            });

            type ScenarioDescription = {
                scenarioPropertyName: string;
                cases: CaseDescription[];
                argumentNames: string[];
            };
            type CaseDescription = {
                caseFunction: () => void;
                args: string[];
            };
            function getScenarios(scenarios: {[key:string]: ScenarioFunc}): ScenarioDescription[] {
                const scenarioDescriptions: ScenarioDescription[] = Object.keys(scenarios).map(scenarioPropertyName => {
                    if (scenarios[scenarioPropertyName] instanceof Function) {
                        return {
                            scenarioPropertyName,
                            cases: [{
                                caseFunction: scenarios[scenarioPropertyName],
                                args: [],
                            }],
                            argumentNames: [],
                        };
                    } else {
                        const {parameters, func}: ParametrizedScenarioFuncWithParameters<*> = (scenarios[scenarioPropertyName]: any);
                        const argumentNames = retrieveArguments(func);
                        const [parameterName] = argumentNames;

                        return {
                            scenarioPropertyName,
                            cases: parameters.map(p => ({
                                caseFunction: () => func(wrapParameter(p, parameterName)),
                                args: [formatParameter(p)],
                            })),
                            argumentNames,
                        };
                    }
                });
                return scenarioDescriptions;
            }
        });
    }

    addGivenWhenThenParts<G, W, T>(scenariosParam: ScenariosParam<G, W, T>): ScenariosParam<G, W, T> {
        return {
            given: () => {
                this.addGivenPart();
                return scenariosParam.given();
            },
            when: () => {
                this.addWhenPart();
                return scenariosParam.when();
            },
            then: () => {
                this.addThenPart();
                return scenariosParam.then();
            },
        };
    }

    addScenario(report: GroupReport, scenarioNameForHumans: string, argumentNames: string[]): ScenarioReport {
        return new ScenarioReport(report, scenarioNameForHumans, [], argumentNames);
    }

    addCase(scenario: ScenarioReport, args: string[]) {
        this.currentCase = new ScenarioCase(args);
        scenario.cases.push(this.currentCase);
    }

    addGivenPart() {
        this.currentPart = new ScenarioPart('GIVEN');
        this.currentCase.parts.push(this.currentPart);
    }

    addWhenPart() {
        this.currentPart = new ScenarioPart('WHEN');
        this.currentCase.parts.push(this.currentPart);
    }

    addThenPart() {
        this.currentPart = new ScenarioPart('THEN');
        this.currentCase.parts.push(this.currentPart);
    }

    buildObject<T>(tClass: Class<T>): T {
        // $FlowIgnore
        class extendedClass extends tClass {}

        // Flowtype really can't type this constructor invocation
        // Therefore we have to cast it as any :(
        const instance = new (extendedClass: any)();

        const extendedPrototype = Object.getPrototypeOf(instance);
        const classPrototype = Object.getPrototypeOf(extendedPrototype);

        getAllMethods(classPrototype).forEach((methodName) => {
            const self = this;

            extendedPrototype[methodName] = function (...args: any[]): any {
                const decodedParameters: DecodedParameter[] = args.map(decodeParameter);

                // Pass the real arguments instead of the wrapped values
                const values: any[] = decodedParameters.map(decodedParameter => decodedParameter.value);
                const result = classPrototype[methodName].apply(this, values);

                if (result === this) { // only records methods that return this
                    self.currentPart.stageMethodCalled(methodName, decodedParameters);
                }
                return result;
            };
        });

        return instance;

        function getAllMethods(obj: any): string[] {
            let allMethods: string[] = [];
            let current = obj;
            do {
                let props = Object.getOwnPropertyNames(current);
                props.forEach(prop => {
                    if (allMethods.indexOf(prop) === -1) {
                        if(_.isFunction(current[prop])) {
                            allMethods.push(prop);
                        }
                    }
                });
            } while((current = Object.getPrototypeOf(current)));

            return allMethods;
        }
    }
}

export const INSTANCE = new ScenarioRunner();

export function scenarios<G: Stage, W: Stage, T: Stage>(groupName: string, stagesParam: StagesParam<G, W, T>, scenarioFunc: ScenariosFunc<G, W, T>): void {
    return INSTANCE.scenarios(groupName, stagesParam, scenarioFunc);
}

function copyStateProperties<S, T>(source: ?S, target: ?T) {
    if (source && target && source.stateProperties && target.stateProperties) {
        const propertyNames = _.intersection(source.stateProperties, target.stateProperties);
        propertyNames.forEach(propertyName => {
            // Need to convert to any to avoid typechecking
            const sourceAny: any = source;
            const targetAny: any = target;
            targetAny[propertyName] = sourceAny[propertyName];
        });
    }
}

export function State(target: any, key: string, descriptor: any): any {
    if (! target.stateProperties) {
        target.stateProperties = [];
    }
    target.stateProperties.push(key);
    return {...descriptor, writable: true};
}

export function parametrized<T>(parameters: T[], func: ParametrizedScenarioFunc<T>): ParametrizedScenarioFuncWithParameters<T> {
    return {
        parameters,
        func,
    };
}

type WrappedParameter = {
    parameterName: string;
    value: any;
    IS_JSGIVEN_WRAPPER_PARAMETER: true;
}
export function wrapParameter(value: any, parameterName: string): WrappedParameter {
    return {
        parameterName,
        value,
        IS_JSGIVEN_WRAPPER_PARAMETER: true,
    };
}

export type DecodedParameter = {
    value: any;
    parameterName: string | null;
}
export function decodeParameter(parameter: any): DecodedParameter {
    if (parameter instanceof Object && parameter.IS_JSGIVEN_WRAPPER_PARAMETER) {
        const wrapped: WrappedParameter = (parameter: any);
        return {...wrapped};
    } else {
        return {
            value: parameter,
            parameterName: null,
        };
    }
}
