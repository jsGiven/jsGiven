// @flow
import _ from 'lodash';
import humanize from 'string-humanize';

import {Stage} from './Stage';
import type {GroupFunc, TestFunc} from './test-runners';
import {GroupReport, ScenarioReport, ScenarioPart} from './reports';

type ScenariosParam<G, W, T> = {
    given: () => G;
    when: () => W;
    then: () => T;
}

type ScenariosFunc<G, W, T> = {
    (scenariosParam: ScenariosParam<G, W, T>): {[key:string]: ScenarioFunc};
}

export type ScenarioFunc = {
    (): void;
}

type StagesParam<G, W, T> = [Class<G>, Class<W>, Class<T>] | Class<G & W & T>;

export class ScenarioRunner {
    groupFunc: GroupFunc;
    testFunc: TestFunc;
    currentScenario: ScenarioReport;
    currentPart: ScenarioPart;

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

            _.functions(scenarios).forEach(scenarioName => {
                const scenarioNameForHumans = humanize(scenarioName);
                this.testFunc(scenarioNameForHumans, () => {
                    const scenario = this.addScenario(report, scenarioNameForHumans);

                    // Reset stages
                    currentGiven = currentWhen = currentThen = undefined;

                    // Execute scenario
                    try {
                        scenarios[scenarioName]();
                    } finally {
                        scenario.dumpToFile();
                    }
                });
            });
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

    addScenario(report: GroupReport, scenarioNameForHumans: string): ScenarioReport {
        this.currentScenario = new ScenarioReport(report, scenarioNameForHumans);
        return this.currentScenario;
    }

    addGivenPart() {
        this.currentPart = new ScenarioPart('GIVEN');
        this.currentScenario.parts.push(this.currentPart);
    }

    addWhenPart() {
        this.currentPart = new ScenarioPart('WHEN');
        this.currentScenario.parts.push(this.currentPart);
    }

    addThenPart() {
        this.currentPart = new ScenarioPart('THEN');
        this.currentScenario.parts.push(this.currentPart);
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
                const result = classPrototype[methodName].apply(this, args);
                if (result === this) { // only records methods that return this
                    self.currentPart.stageMethodCalled(methodName, args);
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
