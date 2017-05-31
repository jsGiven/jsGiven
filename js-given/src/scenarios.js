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

export type ScenarioFunc = SimpleScenarioFunc | ParametrizedScenarioFuncWithParameters;

export type SimpleScenarioFunc = {
    (): void;
}

export type ParametrizedScenarioFuncWithParameters = {
    func: (...args: any[]) => void;
    parameters: Array<Array<any>>;
}

type StagesParam<G, W, T> = [Class<G>, Class<W>, Class<T>] | Class<G & W & T>;

type StepAction = () => void;

type RunningScenario = {
    state: 'COLLECTING_STEPS' | 'RUNNING';
    stages: Stage[];
    stepActions: Array<StepAction>;
};

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

        const report = new GroupReport(groupName);

        let currentStages: ?{givenStage: G, whenStage: W, thenStage: T} = undefined;

        let stageBuilder: (runningScenario: RunningScenario) => {
            givenStage: G;
            whenStage: W;
            thenStage: T;
        };

        if (Array.isArray(stagesParams)) {
            const self = this;

            const [givenClass, whenClass, thenClass] = stagesParams;

            stageBuilder = (runningScenario) => {
                const givenStage = self.buildObject(givenClass, runningScenario);
                const whenStage = self.buildObject(whenClass, runningScenario);
                const thenStage = self.buildObject(thenClass, runningScenario);
                return {givenStage,whenStage,thenStage};
            };
        } else {
            const self = this;
            const givenClass = (stagesParams: any);

            stageBuilder = (runningScenario) => {
                const givenStage = self.buildObject(givenClass, runningScenario);
                const whenStage = givenStage;
                const thenStage = givenStage;
                return {givenStage,whenStage,thenStage};
            };
        }

        const scenariosParam: ScenariosParam<G, W, T> = {
            given: () => {
                if (currentStages) {
                    return currentStages.givenStage.given();
                } else {
                    throw new Error('given() may only be called in scenario');
                }
            },
            when: () => {
                if (currentStages) {
                    return currentStages.whenStage.when();
                } else {
                    throw new Error('when() may only be called in scenario');
                }
            },
            then: () => {
                if (currentStages) {
                    return currentStages.thenStage.then();
                } else {
                    throw new Error('then() may only be called in scenario');
                }
            },
        };

        this.groupFunc(groupName, () => {
            const scenarios = scenariosFunc(scenariosParam);

            getScenarios(scenarios).forEach(({scenarioPropertyName, cases, argumentNames}) => {
                const scenarioNameForHumans = humanize(scenarioPropertyName);
                const scenario = this.addScenario(report, scenarioNameForHumans, argumentNames);

                let casesCount = 0;
                cases.forEach(({caseFunction, args}, index) => {
                    const caseDescription = cases.length === 1 ? scenarioNameForHumans : `${scenarioNameForHumans} #${index+1}`;
                    this.testFunc(caseDescription, async () => {
                        const runningScenario: RunningScenario = {
                            state: 'COLLECTING_STEPS',
                            stages: [],
                            stepActions: [],
                        };

                        this.addCase(scenario, args);

                        // Build stages
                        currentStages = stageBuilder(runningScenario);

                        // Collecting steps
                        caseFunction();

                        runningScenario.state = 'RUNNING';

                        // Execute scenario
                        try {
                            for (const stepAction of runningScenario.stepActions) {
                                const asyncActions = collectAsyncActions(stepAction);
                                for (const asyncAction of asyncActions) {
                                    await asyncAction();
                                }
                            }
                        } finally {
                            casesCount++;
                            if (casesCount === cases.length) {
                                scenario.dumpToFile(this.reportsDestination);
                            }
                            currentStages = undefined;
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
                        const {parameters, func}: ParametrizedScenarioFuncWithParameters = (scenarios[scenarioPropertyName]: any);
                        const argumentNames = retrieveArguments(func);

                        return {
                            scenarioPropertyName,
                            cases: parameters.map((parametersForCase: Array<*>) => {
                                const parametersForTestFunction = parametersForCase.map((parameter, index) => wrapParameter(parameter, argumentNames[index]));
                                const args: string[] = parametersForCase.map(formatParameter);
                                return {
                                    caseFunction: () => func(...parametersForTestFunction),
                                    args,
                                };
                            }),
                            argumentNames,
                        };
                    }
                });
                return scenarioDescriptions;
            }
        });
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

    buildObject<T>(tClass: Class<T>, runningScenario: RunningScenario): T {
        // $FlowIgnore
        class extendedClass extends tClass {}

        // Flowtype really can't type this constructor invocation
        // Therefore we have to cast it as any :(
        const instance = new (extendedClass: any)();

        const extendedPrototype = Object.getPrototypeOf(instance);
        const classPrototype = Object.getPrototypeOf(extendedPrototype);

        const {stages} = runningScenario;

        getAllMethods(classPrototype).forEach((methodName) => {
            const self = this;

            extendedPrototype[methodName] = function (...args: any[]): any {
                const {state, stepActions} = runningScenario;
                switch(state) {
                    case 'COLLECTING_STEPS': {
                        stepActions.push(() => {
                            return extendedPrototype[methodName].apply(this, args);
                        });
                        return this;
                    }
                    default: {
                        // eslint-disable-next-line no-unused-vars
                        const typeCheck: 'RUNNING' = state;

                        if (methodName === 'given') {
                            self.addGivenPart();
                        }
                        if (methodName === 'when') {
                            self.addWhenPart();
                        }
                        if (methodName === 'then') {
                            self.addThenPart();
                        }

                        const decodedParameters: DecodedParameter[] = args.map(decodeParameter);

                        // Pass the real arguments instead of the wrapped values
                        const values: any[] = decodedParameters.map(decodedParameter => decodedParameter.value);
                        const result = classPrototype[methodName].apply(this, values);

                        if (result === this) { // only records methods that return this
                            self.currentPart.stageMethodCalled(methodName, decodedParameters);
                            copyStateToOtherStages(instance, stages);
                        }
                        return result;
                    }
                }
            };
        });

        stages.push(instance);

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

function copyStateToOtherStages(originalStage: Stage, allStages: Stage[]) {
    allStages.forEach(targetStage => {
        if (originalStage !== targetStage) {
            copyStateProperties(originalStage, targetStage);
        }
    });
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

export function parametrized(parameters: Array<Array<any>>, func: () => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}

export function parametrized1<T>(parameters: T[], func: (a: T) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: parameters.map(param => [param]),
        func,
    };
}
export function parametrized2<A, B>(parameters: Array<[A, B]>, func: (a: A, b: B) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized3<A, B, C>(parameters: Array<[A, B, C]>, func: (a: A, b: B, c: C) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized4<A, B, C, D>(parameters: Array<[A, B, C, D]>, func: (a: A, b: B, c: C, d: D) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized5<A, B, C, D, E>(parameters: Array<[A, B, C, D, E]>, func: (a: A, b: B, c: C, d: D, e: E) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized6<A, B, C, D, E, F>(parameters: Array<[A, B, C, D, E, F]>, func: (a: A, b: B, c: C, d: D, e: E, f: F) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized7<A, B, C, D, E, F, G>(parameters: Array<[A, B, C, D, E, F, G]>, func: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => void): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
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

let asyncActionsSingleton: Array<() => Promise<*>> = [];
function collectAsyncActions(syncActionThatMayCallDoAsync: () => any): Array<() => Promise<*>> {
    asyncActionsSingleton = [];
    const collectedAsyncActions = [];

    try {
        syncActionThatMayCallDoAsync();
    } finally {
        collectedAsyncActions.push(...asyncActionsSingleton);
        asyncActionsSingleton = [];
    }

    return collectedAsyncActions;
}

export function doAsync(action: () => Promise<*>) {
    asyncActionsSingleton.push(action);
}
