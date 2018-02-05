// @flow
import _ from 'lodash';
import functionArguments from 'function-arguments';
import humanize from 'string-humanize';
import stripAnsi from 'strip-ansi';

import { executeStepAndCollectAsyncActions } from './async-actions';
import { isHiddenStep } from './hidden-steps';
import { initStages, isLifecycleMethod, cleanupStages } from './life-cycle';
import {
  formatParameter,
  getFormatters,
  restParameterName,
} from './parameter-formatting';
import {
  decodeParameter,
  wrapParameter,
  type DecodedParameter,
  type ParametrizedScenarioFuncWithParameters,
  type WrappedParameter,
} from './parametrized-scenarios';
import {
  GroupReport,
  ScenarioCase,
  ScenarioReport,
  ScenarioPart,
  type ScenarioExecutionStatus,
  REPORTS_DESTINATION,
} from './reports';
import { Stage } from './Stage';
import { copyStateToOtherStages } from './State';
import type { Tag } from './tags';
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
  +tags: Tag[],
};

type ScenarioOptions = {
  tags: Tag[],
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
  +caseArguments: WrappedParameter[],
  +formattedCaseArguments: { [key: string]: string },
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

    let buildStages: (
      runningScenario: RunningScenario
    ) => Promise<{
      givenStage: G,
      whenStage: W,
      thenStage: T,
    }>;
    let destroyStages: () => Promise<void> = async () => {};

    if (Array.isArray(stagesParams)) {
      const self = this;

      const [givenClass, whenClass, thenClass] = stagesParams;

      buildStages = async runningScenario => {
        const givenStage = self.buildStage(givenClass, runningScenario);
        const whenStage = self.buildStage(whenClass, runningScenario);
        const thenStage = self.buildStage(thenClass, runningScenario);
        await initStages(givenStage, whenStage, thenStage);
        destroyStages = () => cleanupStages(givenStage, whenStage, thenStage);
        return { givenStage, whenStage, thenStage };
      };
    } else {
      const self = this;
      const givenClass = (stagesParams: any);

      buildStages = async runningScenario => {
        const givenStage = self.buildStage(givenClass, runningScenario);
        await initStages(givenStage);
        destroyStages = () => cleanupStages(givenStage);
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

      getScenarios(scenarios).forEach(
        ({ scenarioPropertyName, cases, argumentNames }) => {
          const scenarioNameForHumans = humanize(scenarioPropertyName);
          const scenario = this.addScenario(
            report,
            scenarioNameForHumans,
            argumentNames
          );

          let casesCount = 0;
          cases.forEach(({ caseFunction, wrappedArgs }, index) => {
            const caseDescription =
              cases.length === 1
                ? scenarioNameForHumans
                : `${scenarioNameForHumans} #${index + 1}`;
            this.testFunc(caseDescription, async () => {
              let caughtError: Error | null = null;
              const runningScenario: RunningScenario = {
                state: 'COLLECTING_STEPS',
                stages: [],
                steps: [],
                caseArguments: wrappedArgs,
                formattedCaseArguments: {},
              };

              this.beginCase(scenario);

              // Build stages
              currentStages = await buildStages(runningScenario);

              // Collecting steps
              caseFunction();

              this.setCaseArguments(
                runningScenario.caseArguments,
                runningScenario.formattedCaseArguments
              );

              // Execute scenario
              runningScenario.state = 'RUNNING';
              try {
                const { steps } = runningScenario;
                for (let i = 0; i < steps.length; i++) {
                  const { stepActions, stage } = steps[i];
                  const stepTimer = new Timer();
                  if (!caughtError) {
                    try {
                      const asyncActions = executeStepAndCollectAsyncActions(
                        stepActions.executeStep
                      );
                      for (const asyncAction of asyncActions) {
                        await asyncAction();
                      }
                    } catch (error) {
                      caughtError = error;
                      stepActions.markStepAsFailed(stepTimer);
                    }

                    if (!caughtError) {
                      stepActions.markStepAsPassed(stepTimer);
                      copyStateToOtherStages(stage, runningScenario.stages);
                    }
                  } else {
                    stepActions.markStepAsSkipped(stepTimer);
                  }
                }
              } finally {
                if (caughtError) {
                  this.caseFailed(caughtError);
                } else {
                  this.caseSucceeded();
                }
                casesCount++;
                if (casesCount === cases.length) {
                  this.scenarioCompleted(scenario);
                }
                currentStages = undefined;
                await destroyStages();
              }

              if (caughtError) {
                throw caughtError;
              }
            });
          });
        }
      );

      type ScenarioDescriptionWithName = {
        +scenarioPropertyName: string,
        +cases: CaseDescription[],
        +argumentNames: string[],
      };
      type CaseDescription = {
        +caseFunction: () => void,
        +wrappedArgs: WrappedParameter[],
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
                  wrappedArgs: [],
                },
              ],
              argumentNames: [],
            };
          } else {
            const {
              parameters,
              func,
            }: ParametrizedScenarioFuncWithParameters = (scenarioFunction: any);
            const argumentNames = functionArguments(func);

            return {
              scenarioPropertyName,
              cases: parameters.map(
                (parametersForCase: Array<*>, z: number) => {
                  const parametersForTestFunction = parametersForCase.map(
                    (parameter, index) =>
                      wrapParameter(parameter, argumentNames[index])
                  );
                  return {
                    caseFunction: () => {
                      return func(...parametersForTestFunction);
                    },
                    wrappedArgs: parametersForTestFunction,
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
    return new ScenarioReport(report, scenarioNameForHumans, [], argumentNames);
  }

  beginCase(scenario: ScenarioReport) {
    const currentCase = new ScenarioCase();
    this.currentCase = currentCase;
    scenario.cases.push(currentCase);
    this.currentCaseTimer = new Timer();
  }

  setCaseArguments(
    caseArguments: WrappedParameter[],
    formattedCaseArguments: { [key: string]: string }
  ) {
    this.currentCase.args = caseArguments.map(wp => {
      return formattedCaseArguments[wp.scenarioParameterName];
    });
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
    const tInstance = new tClass();
    const tPrototype = Object.getPrototypeOf(tInstance);

    class ExtendedClass {}
    const proxyInstance = new ExtendedClass();
    const proxyPrototype = Object.getPrototypeOf(proxyInstance);

    Object.assign(proxyInstance, tInstance);
    Object.setPrototypeOf(proxyPrototype, tPrototype);

    const { stages } = runningScenario;

    getAllMethods(tPrototype).forEach(methodName => {
      const self = this;

      proxyPrototype[methodName] = function(...args: any[]): any {
        const {
          state,
          steps,
          caseArguments,
          formattedCaseArguments,
        } = runningScenario;

        if (isLifecycleMethod(this, methodName)) {
          return tPrototype[methodName].apply(this, args);
        }

        const stepParameterNames = functionArguments(tPrototype[methodName]);
        const decodedParameters: DecodedParameter[] = args.map((arg, index) => {
          const parameterName =
            index < stepParameterNames.length
              ? stepParameterNames[index]
              : restParameterName();
          return decodeParameter(
            arg,
            parameterName,
            getFormatters(tInstance, methodName, parameterName)
          );
        });

        caseArguments.forEach(({ scenarioParameterName, value }) => {
          if (formattedCaseArguments[scenarioParameterName] === undefined) {
            const foundDecodedParameter = decodedParameters.find(
              dp => dp.scenarioParameterName === scenarioParameterName
            );
            if (foundDecodedParameter) {
              // eslint-disable-next-line standard/computed-property-even-spacing
              formattedCaseArguments[scenarioParameterName] = formatParameter(
                value,
                foundDecodedParameter.formatters
              );
            }
          }
        });

        switch (state) {
          case 'COLLECTING_STEPS': {
            steps.push({
              stepActions: {
                executeStep: () => {
                  return proxyPrototype[methodName].apply(this, args);
                },
                markStepAsPassed: (stepTimer: Timer) => {
                  if (!isHiddenStep(this, methodName)) {
                    self.stepPassed(methodName, decodedParameters, stepTimer);
                  }
                },
                markStepAsFailed: (stepTimer: Timer) => {
                  if (!isHiddenStep(this, methodName)) {
                    self.stepFailed(methodName, decodedParameters, stepTimer);
                  }
                },
                markStepAsSkipped: (stepTimer: Timer) => {
                  if (!isHiddenStep(this, methodName)) {
                    insertNewPartIfRequired();
                    self.stepSkipped(methodName, decodedParameters, stepTimer);
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
            const result = tPrototype[methodName].apply(this, values);

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

    stages.push((proxyInstance: any));

    return (proxyInstance: any);

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
