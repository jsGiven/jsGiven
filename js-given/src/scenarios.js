// @flow
import _ from 'lodash';
import humanize from 'string-humanize';
import retrieveArguments from 'retrieve-arguments';

import { Stage } from './Stage';
import type { GroupFunc, TestFunc } from './test-runners';
import {
    formatParameter,
    GroupReport,
    ScenarioCase,
    ScenarioReport,
    ScenarioPart,
    type ScenarioExecutionStatus,
} from './reports';
import type { TagDescription } from './tags';
import { copyStateProperties } from './State';
import { isHiddenStep } from './hidden-steps';
import {
    getFormatters,
    restParameterName,
    type Formatter,
} from './parameter-formatting';

export const REPORTS_DESTINATION = '.jsGiven-reports';

type ScenariosParam<G, W, T> = {
    given: () => G,
    when: () => W,
    then: () => T,
};

type ScenariosDescriptions<G, W, T> = {
    (
        scenariosParam: ScenariosParam<G, W, T>
    ): { [key: string]: ScenarioDescription },
};

type ScenarioDescription = {
    scenarioFunction: ScenarioFunc,
    tags: TagDescription[],
};

type ScenarioOptions = {
    tags: TagDescription[],
};
export function scenario(
    options: $Shape<ScenarioOptions>,
    scenarioFunction: ScenarioFunc
): ScenarioDescription {
    const scenarioOptions: ScenarioOptions = {
        tags: [],
        ...options,
    };
    return {
        scenarioFunction,
        tags: scenarioOptions.tags,
    };
}

export type ScenarioFunc =
    | SimpleScenarioFunc
    | ParametrizedScenarioFuncWithParameters;

export type SimpleScenarioFunc = {
    (): void,
};

export type ParametrizedScenarioFuncWithParameters = {
    func: (...args: any[]) => void,
    parameters: Array<Array<any>>,
};

type StagesParam<G, W, T> = [Class<G>, Class<W>, Class<T>] | Class<G & W & T>;

type StepActions = {
    executeStep: () => void,
    markStepAsFailed: () => void,
    markStepAsSkipped: () => void,
    markStepAsPassed: () => void,
};

type Step = {
    stepActions: StepActions,
    stage: Stage,
};

type RunningScenario = {
    state: 'COLLECTING_STEPS' | 'RUNNING',
    stages: Stage[],
    steps: Step[],
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
        scenariosDescriptions: ScenariosDescriptions<G, W, T>
    ) {
        const report = new GroupReport(groupName);

        let currentStages: ?{
            givenStage: G,
            whenStage: W,
            thenStage: T,
        } = undefined;

        let stageBuilder: (
            runningScenario: RunningScenario
        ) => {
            givenStage: G,
            whenStage: W,
            thenStage: T,
        };

        if (Array.isArray(stagesParams)) {
            const self = this;

            const [givenClass, whenClass, thenClass] = stagesParams;

            stageBuilder = runningScenario => {
                const givenStage = self.buildStage(givenClass, runningScenario);
                const whenStage = self.buildStage(whenClass, runningScenario);
                const thenStage = self.buildStage(thenClass, runningScenario);
                return { givenStage, whenStage, thenStage };
            };
        } else {
            const self = this;
            const givenClass = (stagesParams: any);

            stageBuilder = runningScenario => {
                const givenStage = self.buildStage(givenClass, runningScenario);
                const whenStage = givenStage;
                const thenStage = givenStage;
                return { givenStage, whenStage, thenStage };
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
            const scenarios = scenariosDescriptions(scenariosParam);

            getScenarios(
                scenarios
            ).forEach(({ scenarioPropertyName, cases, argumentNames }) => {
                const scenarioNameForHumans = humanize(scenarioPropertyName);
                const scenario = this.addScenario(
                    report,
                    scenarioNameForHumans,
                    argumentNames
                );

                let casesCount = 0;
                cases.forEach(({ caseFunction, args }, index) => {
                    const caseDescription =
                        cases.length === 1
                            ? scenarioNameForHumans
                            : `${scenarioNameForHumans} #${index + 1}`;
                    this.testFunc(caseDescription, () => {
                        let caughtError = null;
                        const runningScenario: RunningScenario = {
                            state: 'COLLECTING_STEPS',
                            stages: [],
                            steps: [],
                        };

                        this.beginCase(scenario, args);

                        // Build stages
                        currentStages = stageBuilder(runningScenario);

                        // Collecting steps
                        caseFunction();

                        // Execute scenario
                        runningScenario.state = 'RUNNING';
                        let runningSynchronously = true;
                        try {
                            const { steps } = runningScenario;
                            for (let i = 0; i < steps.length; i++) {
                                const { stepActions, stage } = steps[i];
                                let asyncActions = [];

                                if (!caughtError) {
                                    try {
                                        asyncActions = executeStepAndCollectAsyncActions(
                                            stepActions.executeStep
                                        );
                                    } catch (error) {
                                        caughtError = error;
                                        stepActions.markStepAsFailed();
                                    }
                                } else {
                                    stepActions.markStepAsSkipped();
                                }

                                if (!caughtError) {
                                    if (asyncActions.length === 0) {
                                        stepActions.markStepAsPassed();
                                        copyStateToOtherStages(
                                            stage,
                                            runningScenario.stages
                                        );
                                    } else {
                                        // If we have asynchronous actions, we
                                        // switch to asynchronous mode
                                        // We return immediately a promise and
                                        // the execution is now asynchronous
                                        // This ensures that scenarios that do
                                        // not require asynchronous processing
                                        // are still executed synchronously
                                        runningSynchronously = false;
                                        return continueAsyncWork(
                                            this,
                                            asyncActions,
                                            stage,
                                            steps,
                                            i
                                        );
                                    }
                                }
                            }
                        } finally {
                            if (runningSynchronously) {
                                caseCompleted(this);
                            }
                        }

                        if (caughtError) {
                            throw caughtError;
                        }

                        async function continueAsyncWork(
                            self: ScenarioRunner,
                            asyncActions: Array<() => Promise<*>>,
                            stage: Stage,
                            steps: Step[],
                            i: number
                        ): Promise<*> {
                            try {
                                // Execute async actions for current step
                                try {
                                    await executeAsyncActions(asyncActions);
                                } catch (error) {
                                    caughtError = error;
                                    const { stepActions } = steps[i];
                                    stepActions.markStepAsFailed();
                                }
                                if (!caughtError) {
                                    const { stepActions } = steps[i];
                                    stepActions.markStepAsPassed();
                                    copyStateToOtherStages(
                                        stage,
                                        runningScenario.stages
                                    );
                                }

                                // Execute further steps and their async actions
                                for (let j = i + 1; j < steps.length; j++) {
                                    const { stepActions, stage } = steps[j];
                                    if (!caughtError) {
                                        try {
                                            const actions = executeStepAndCollectAsyncActions(
                                                stepActions.executeStep
                                            );
                                            await executeAsyncActions(actions);
                                        } catch (error) {
                                            caughtError = error;
                                            stepActions.markStepAsFailed();
                                        }

                                        if (!caughtError) {
                                            stepActions.markStepAsPassed();
                                            copyStateToOtherStages(
                                                stage,
                                                runningScenario.stages
                                            );
                                        }
                                    } else {
                                        stepActions.markStepAsSkipped();
                                    }
                                }
                            } finally {
                                caseCompleted(self);
                            }

                            if (caughtError) {
                                throw caughtError;
                            }

                            async function executeAsyncActions(
                                asyncActions: Array<() => Promise<*>>
                            ): Promise<void> {
                                for (const asyncAction of asyncActions) {
                                    await asyncAction();
                                }
                            }
                        }

                        function caseCompleted(self: ScenarioRunner) {
                            if (caughtError) {
                                self.caseFailed();
                            } else {
                                self.caseSucceeded();
                            }
                            casesCount++;
                            if (casesCount === cases.length) {
                                self.scenarioCompleted(scenario);
                            }
                            currentStages = undefined;
                        }
                    });
                });
            });

            type ScenarioDescriptionWithName = {
                scenarioPropertyName: string,
                cases: CaseDescription[],
                argumentNames: string[],
            };
            type CaseDescription = {
                caseFunction: () => void,
                args: string[],
            };
            function getScenarios(scenarios: {
                [key: string]: ScenarioDescription,
            }): ScenarioDescriptionWithName[] {
                const scenarioDescriptions: ScenarioDescriptionWithName[] = Object.keys(
                    scenarios
                ).map(scenarioPropertyName => {
                    const scenarioDescription: ScenarioDescription =
                        scenarios[scenarioPropertyName];
                    const { scenarioFunction } = scenarioDescription;
                    if (scenarioFunction instanceof Function) {
                        return {
                            scenarioPropertyName,
                            cases: [
                                {
                                    caseFunction: scenarioFunction,
                                    args: [],
                                },
                            ],
                            argumentNames: [],
                        };
                    } else {
                        const {
                            parameters,
                            func,
                        }: ParametrizedScenarioFuncWithParameters = (scenarioFunction: any);
                        const argumentNames = retrieveArguments(func);

                        return {
                            scenarioPropertyName,
                            cases: parameters.map(
                                (parametersForCase: Array<*>, z: number) => {
                                    const parametersForTestFunction = parametersForCase.map(
                                        (parameter, index) =>
                                            wrapParameter(
                                                parameter,
                                                argumentNames[index]
                                            )
                                    );
                                    const args: string[] = parametersForCase.map(
                                        p => formatParameter(p, [])
                                    );
                                    return {
                                        caseFunction: () => {
                                            return func(
                                                ...parametersForTestFunction
                                            );
                                        },
                                        args,
                                    };
                                }
                            ),
                            argumentNames,
                        };
                    }
                });
                return scenarioDescriptions;
            }
        });
    }

    addScenario(
        report: GroupReport,
        scenarioNameForHumans: string,
        argumentNames: string[]
    ): ScenarioReport {
        return new ScenarioReport(
            report,
            scenarioNameForHumans,
            [],
            argumentNames
        );
    }

    beginCase(scenario: ScenarioReport, args: string[]) {
        const currentCase = new ScenarioCase(args);
        this.currentCase = currentCase;
        scenario.cases.push(currentCase);
    }

    caseFailed() {
        this.currentCase.successful = false;
    }

    caseSucceeded() {
        this.currentCase.successful = true;
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

    stepPassed(methodName: string, decodedParameters: DecodedParameter[]) {
        this.currentPart.stageMethodCalled(
            methodName,
            decodedParameters,
            'PASSED'
        );
    }

    stepFailed(methodName: string, decodedParameters: DecodedParameter[]) {
        this.currentPart.stageMethodCalled(
            methodName,
            decodedParameters,
            'FAILED'
        );
    }

    stepSkipped(methodName: string, decodedParameters: DecodedParameter[]) {
        this.currentPart.stageMethodCalled(
            methodName,
            decodedParameters,
            'SKIPPED'
        );
    }

    scenarioCompleted(scenario: ScenarioReport) {
        const executionStatus: ScenarioExecutionStatus = scenario.cases.some(
            c => !c.successful
        )
            ? 'FAILED'
            : 'SUCCESS';
        scenario.executionStatus = executionStatus;
        scenario.dumpToFile(this.reportsDestination);
    }

    buildStage<T>(tClass: Class<T>, runningScenario: RunningScenario): T {
        // $FlowIgnore
        class extendedClass extends tClass {}

        // Flowtype really can't type this constructor invocation
        // Therefore we have to cast it as any :(
        const instance = new (extendedClass: any)();

        const extendedPrototype = Object.getPrototypeOf(instance);
        const classPrototype = Object.getPrototypeOf(extendedPrototype);

        const { stages } = runningScenario;

        getAllMethods(classPrototype).forEach(methodName => {
            const self = this;

            extendedPrototype[methodName] = function(...args: any[]): any {
                const { state, steps } = runningScenario;

                const stepParameterNames = retrieveArguments(
                    classPrototype[methodName]
                );
                const decodedParameters: DecodedParameter[] = args.map(
                    (arg, index) => {
                        const parameterName =
                            index < stepParameterNames.length
                                ? stepParameterNames[index]
                                : restParameterName();
                        return decodeParameter(
                            arg,
                            parameterName,
                            getFormatters(instance, methodName, parameterName)
                        );
                    }
                );

                switch (state) {
                    case 'COLLECTING_STEPS': {
                        steps.push({
                            stepActions: {
                                executeStep: () => {
                                    return extendedPrototype[methodName].apply(
                                        this,
                                        args
                                    );
                                },
                                markStepAsPassed: () => {
                                    if (!isHiddenStep(this, methodName)) {
                                        self.stepPassed(
                                            methodName,
                                            decodedParameters
                                        );
                                    }
                                },
                                markStepAsFailed: () => {
                                    if (!isHiddenStep(this, methodName)) {
                                        self.stepFailed(
                                            methodName,
                                            decodedParameters
                                        );
                                    }
                                },
                                markStepAsSkipped: () => {
                                    if (!isHiddenStep(this, methodName)) {
                                        insertNewPartIfRequired();
                                        self.stepSkipped(
                                            methodName,
                                            decodedParameters
                                        );
                                    }
                                },
                            },
                            stage: this,
                        });
                        return this;
                    }
                    default: {
                        // eslint-disable-next-line no-unused-vars
                        const typeCheck: 'RUNNING' = state;
                        insertNewPartIfRequired();

                        // Pass the real arguments instead of the wrapped values
                        const values: any[] = decodedParameters.map(
                            decodedParameter => decodedParameter.value
                        );
                        const result = classPrototype[methodName].apply(
                            this,
                            values
                        );

                        return result;
                    }
                }
            };

            function insertNewPartIfRequired() {
                if (methodName === 'given') {
                    self.addGivenPart();
                }
                if (methodName === 'when') {
                    self.addWhenPart();
                }
                if (methodName === 'then') {
                    self.addThenPart();
                }
            }
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
                        if (_.isFunction(current[prop])) {
                            allMethods.push(prop);
                        }
                    }
                });
            } while ((current = Object.getPrototypeOf(current)));

            return allMethods;
        }
    }
}

export const INSTANCE = new ScenarioRunner();

export function scenarios<G: Stage, W: Stage, T: Stage>(
    groupName: string,
    stagesParam: StagesParam<G, W, T>,
    scenarioFunc: ScenariosDescriptions<G, W, T>
): void {
    return INSTANCE.scenarios(groupName, stagesParam, scenarioFunc);
}

function copyStateToOtherStages(originalStage: Stage, allStages: Stage[]) {
    allStages.forEach(targetStage => {
        if (originalStage !== targetStage) {
            copyStateProperties(originalStage, targetStage);
        }
    });
}

export function parametrized(
    parameters: Array<Array<any>>,
    func: () => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}

export function parametrized1<T>(
    parameters: T[],
    func: (a: T) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: parameters.map(param => [param]),
        func,
    };
}
export function parametrized2<A, B>(
    parameters: Array<[A, B]>,
    func: (a: A, b: B) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized3<A, B, C>(
    parameters: Array<[A, B, C]>,
    func: (a: A, b: B, c: C) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized4<A, B, C, D>(
    parameters: Array<[A, B, C, D]>,
    func: (a: A, b: B, c: C, d: D) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized5<A, B, C, D, E>(
    parameters: Array<[A, B, C, D, E]>,
    func: (a: A, b: B, c: C, d: D, e: E) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized6<A, B, C, D, E, F>(
    parameters: Array<[A, B, C, D, E, F]>,
    func: (a: A, b: B, c: C, d: D, e: E, f: F) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}
export function parametrized7<A, B, C, D, E, F, G>(
    parameters: Array<[A, B, C, D, E, F, G]>,
    func: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => void
): ParametrizedScenarioFuncWithParameters {
    return {
        parameters: (parameters: any),
        func,
    };
}

type WrappedParameter = {
    scenarioParameterName: string,
    value: any,
    IS_JSGIVEN_WRAPPER_PARAMETER: true,
};
export function wrapParameter(
    value: any,
    scenarioParameterName: string
): WrappedParameter {
    return {
        scenarioParameterName,
        value,
        IS_JSGIVEN_WRAPPER_PARAMETER: true,
    };
}

export type DecodedParameter = {
    value: any,
    scenarioParameterName: string | null,
    stepParameterName: string,
    formatters: Formatter[],
};
export function decodeParameter(
    parameter: any,
    stepParameterName: string,
    formatters: Formatter[]
): DecodedParameter {
    if (parameter instanceof Object && parameter.IS_JSGIVEN_WRAPPER_PARAMETER) {
        const wrapped: WrappedParameter = (parameter: any);
        return { ...wrapped, stepParameterName, formatters };
    } else {
        if (stepParameterName === undefined) {
            throw new Error('cant be undefined');
        }
        return {
            value: parameter,
            scenarioParameterName: null,
            stepParameterName,
            formatters,
        };
    }
}

let asyncActionsSingleton: Array<() => Promise<*>> = [];
function executeStepAndCollectAsyncActions(
    stepActionThatMayCallDoAsync: () => any
): Array<() => Promise<*>> {
    asyncActionsSingleton = [];
    const collectedAsyncActions = [];

    try {
        stepActionThatMayCallDoAsync();
    } finally {
        collectedAsyncActions.push(...asyncActionsSingleton);
        asyncActionsSingleton = [];
    }

    return collectedAsyncActions;
}

export function doAsync(action: () => Promise<*>) {
    asyncActionsSingleton.push(action);
}
