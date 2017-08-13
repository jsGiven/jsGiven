// @flow
import _ from 'lodash';
import retrieveArguments from 'retrieve-arguments';
import humanize from 'string-humanize';
import stripAnsi from 'strip-ansi';

import { executeStepAndCollectAsyncActions } from './async-actions';
import { isHiddenStep } from './hidden-steps';
import { getFormatters, restParameterName } from './parameter-formatting';
import {
    decodeParameter,
    wrapParameter,
    type DecodedParameter,
    type ParametrizedScenarioFuncWithParameters,
} from './parametrized-scenarios';
import {
    formatParameter,
    GroupReport,
    ScenarioCase,
    ScenarioReport,
    ScenarioPart,
    type ScenarioExecutionStatus,
    REPORTS_DESTINATION,
} from './reports';
import { Stage } from './Stage';
import { copyStateToOtherStages } from './State';
import type { TagDescription } from './tags';
import type { GroupFunc, TestFunc } from './test-runners';
import { Timer } from './timer';

type ScenariosParam<G, W, T> = {
    +given: () => G,
    +when: () => W,
    +then: () => T,
};

type ScenariosDescriptions<G, W, T> = {
    (
        scenariosParam: ScenariosParam<G, W, T>
    ): { [key: string]: ScenarioDescription },
};

type ScenarioDescription = {
    +scenarioFunction: ScenarioFunc,
    +tags: TagDescription[],
};

type ScenarioOptions = {
    +tags: TagDescription[],
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

type StagesParam<G, W, T> = [Class<G>, Class<W>, Class<T>] | Class<G & W & T>;

type StepActions = {
    +executeStep: () => void,
    +markStepAsFailed: (timer: Timer) => void,
    +markStepAsSkipped: (timer: Timer) => void,
    +markStepAsPassed: (timer: Timer) => void,
};

type Step = {
    +stepActions: StepActions,
    +stage: Stage,
};

type RunningScenario = {
    state: 'COLLECTING_STEPS' | 'RUNNING',
    +stages: Stage[],
    +steps: Step[],
};

export class ScenarioRunner {
    groupFunc: GroupFunc;
    testFunc: TestFunc;
    currentCase: ScenarioCase;
    currentCaseTimer: Timer;
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
        if (!this.groupFunc || !this.testFunc) {
            throw new Error(
                'JsGiven is not initialized, please call setupForRspec() or setupForAva() in your test code'
            );
        }

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
                        let caughtError: Error | null = null;
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
                                const stepTimer = new Timer();
                                let asyncActions = [];

                                if (!caughtError) {
                                    try {
                                        asyncActions = executeStepAndCollectAsyncActions(
                                            stepActions.executeStep
                                        );
                                    } catch (error) {
                                        caughtError = error;
                                        stepActions.markStepAsFailed(stepTimer);
                                    }
                                } else {
                                    stepActions.markStepAsSkipped(stepTimer);
                                }

                                if (!caughtError) {
                                    if (asyncActions.length === 0) {
                                        stepActions.markStepAsPassed(stepTimer);
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
                                            i,
                                            stepTimer
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
                            i: number,
                            initialStepTimer: Timer
                        ): Promise<*> {
                            try {
                                // Execute async actions for current step
                                try {
                                    await executeAsyncActions(asyncActions);
                                } catch (error) {
                                    caughtError = error;
                                    const { stepActions } = steps[i];
                                    stepActions.markStepAsFailed(
                                        initialStepTimer
                                    );
                                }
                                if (!caughtError) {
                                    const { stepActions } = steps[i];
                                    stepActions.markStepAsPassed(
                                        initialStepTimer
                                    );
                                    copyStateToOtherStages(
                                        stage,
                                        runningScenario.stages
                                    );
                                }

                                // Execute further steps and their async actions
                                for (let j = i + 1; j < steps.length; j++) {
                                    const { stepActions, stage } = steps[j];
                                    const stepTimer = new Timer();
                                    if (!caughtError) {
                                        try {
                                            const actions = executeStepAndCollectAsyncActions(
                                                stepActions.executeStep
                                            );
                                            await executeAsyncActions(actions);
                                        } catch (error) {
                                            caughtError = error;
                                            stepActions.markStepAsFailed(
                                                stepTimer
                                            );
                                        }

                                        if (!caughtError) {
                                            stepActions.markStepAsPassed(
                                                stepTimer
                                            );
                                            copyStateToOtherStages(
                                                stage,
                                                runningScenario.stages
                                            );
                                        }
                                    } else {
                                        stepActions.markStepAsSkipped(
                                            stepTimer
                                        );
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
                                self.caseFailed(caughtError);
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
                +scenarioPropertyName: string,
                +cases: CaseDescription[],
                +argumentNames: string[],
            };
            type CaseDescription = {
                +caseFunction: () => void,
                +args: string[],
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
        this.currentCaseTimer = new Timer();
    }

    caseFailed(error: Error) {
        const durationInNanos = this.currentCaseTimer.elapsedTimeInNanoseconds();
        this.currentCase.successful = false;
        this.currentCase.durationInNanos = durationInNanos;
        this.currentCase.errorMessage = stripAnsi(error.message);
        this.currentCase.stackTrace = stripAnsi(error.stack).split('\n');
    }

    caseSucceeded() {
        const durationInNanos = this.currentCaseTimer.elapsedTimeInNanoseconds();
        this.currentCase.successful = true;
        this.currentCase.durationInNanos = durationInNanos;
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

    stepPassed(
        methodName: string,
        decodedParameters: DecodedParameter[],
        stepTimer: Timer
    ) {
        this.currentPart.stageMethodCalled(
            methodName,
            decodedParameters,
            'PASSED',
            stepTimer.elapsedTimeInNanoseconds()
        );
    }

    stepFailed(
        methodName: string,
        decodedParameters: DecodedParameter[],
        stepTimer: Timer
    ) {
        this.currentPart.stageMethodCalled(
            methodName,
            decodedParameters,
            'FAILED',
            stepTimer.elapsedTimeInNanoseconds()
        );
    }

    stepSkipped(
        methodName: string,
        decodedParameters: DecodedParameter[],
        stepTimer: Timer
    ) {
        this.currentPart.stageMethodCalled(
            methodName,
            decodedParameters,
            'SKIPPED',
            stepTimer.elapsedTimeInNanoseconds()
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
                                markStepAsPassed: (stepTimer: Timer) => {
                                    if (!isHiddenStep(this, methodName)) {
                                        self.stepPassed(
                                            methodName,
                                            decodedParameters,
                                            stepTimer
                                        );
                                    }
                                },
                                markStepAsFailed: (stepTimer: Timer) => {
                                    if (!isHiddenStep(this, methodName)) {
                                        self.stepFailed(
                                            methodName,
                                            decodedParameters,
                                            stepTimer
                                        );
                                    }
                                },
                                markStepAsSkipped: (stepTimer: Timer) => {
                                    if (!isHiddenStep(this, methodName)) {
                                        insertNewPartIfRequired();
                                        self.stepSkipped(
                                            methodName,
                                            decodedParameters,
                                            stepTimer
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
