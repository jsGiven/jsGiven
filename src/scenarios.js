// @flow
import {Stage} from './Stage';
import type {GroupFunc, TestFunc} from './test-runners';

import _ from 'lodash';
import humanize from 'string-humanize';

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

export type ScenarioPartKind = 'GIVEN' | 'WHEN' | 'THEN';

export type ScenarioPart = {
    kind: ScenarioPartKind;
    steps: Step[];
}

type Step = {
    name: string;
}

type ScenarioReport = {
    name: string;
    parts: ScenarioPart[];
}

type GroupReport = {
    name: string;
    scenarios: ScenarioReport[];
}

type StagesParam<G, W, T> = [Class<G>, Class<W>, Class<T>] | Class<G>;

export class ScenarioRunner {
    groupFunc: GroupFunc;
    testFunc: TestFunc;
    report: GroupReport;
    currentScenario: ScenarioReport;
    currentPart: ScenarioPart;

    setup(groupFunc: GroupFunc, testFunc: TestFunc): void {
        this.groupFunc = groupFunc;
        this.testFunc = testFunc;
    }

    scenarios<G: Stage, W: Stage, T: Stage>(
            groupName: string,
            stagesParams: StagesParam<G, W, T>,
            scenariosFunc: ScenariosFunc<G, W, T>) {

        const humanizedGroupName = humanize(groupName);
        this.report = {
            name: humanizedGroupName,
            scenarios: []
        }

        let currentGiven: ?G;
        let currentWhen: ?W;
        let currentThen: ?T;

        let scenariosParam: ScenariosParam<G, W, T>;
        if (Array.isArray(stagesParams)) {
            const self = this;

            const [givenClass, whenClass, thenClass] = stagesParams;
            function getOrBuildGiven(): G {
                if (!currentGiven) {
                    currentGiven = self.buildObject(givenClass);
                }
                return currentGiven.given();
            }

            function getOrBuildWhen(): W {
                if (!currentWhen) {
                    currentWhen = self.buildObject(whenClass);
                    copyStateProperties(currentGiven, currentWhen);
                }
                return currentWhen.when();
            }

            function getOrBuildThen(): T {
                if (!currentThen) {
                    currentThen = self.buildObject(thenClass);
                    copyStateProperties(currentGiven, currentThen);
                    copyStateProperties(currentWhen, currentThen);
                }
                return currentThen.then();
            }

            scenariosParam = this.addGivenWhenThenParts({
                given: getOrBuildGiven,
                when: getOrBuildWhen,
                then: getOrBuildThen
            });
        } else {
            const self = this;
            const givenClass = (stagesParams: any);

            function getOrBuildGWT(): G & W & T {
                if (!currentGiven) {
                    currentGiven = self.buildObject(givenClass);
                    currentWhen = currentGiven;
                    currentThen = currentThen;
                }
                return (currentGiven: any);
            }

            scenariosParam = this.addGivenWhenThenParts({
                given: () => getOrBuildGWT().given(),
                when: () => getOrBuildGWT().when(),
                then: () => getOrBuildGWT().then()
            });
        }

        this.groupFunc(humanizedGroupName, () => {
            const scenarios = scenariosFunc(scenariosParam);

            _.functions(scenarios).forEach(scenarioName => {
                const scenarioNameForHumans = humanize(scenarioName);
                this.testFunc(scenarioNameForHumans, () => {
                    this.addScenario(scenarioNameForHumans);

                    // Reset stages
                    currentGiven = currentWhen = currentThen = undefined;

                    // Execute scenario
                    scenarios[scenarioName]();
                })
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

    addScenario(scenarioNameForHumans: string) {
        this.currentScenario = {
            name: scenarioNameForHumans,
            parts: [],
        };
        this.report.scenarios.push(this.currentScenario);
    }

    addGivenPart() {
        this.currentPart = {kind: 'GIVEN', steps: []};
        this.currentScenario.parts.push(this.currentPart);
    }

    addWhenPart() {
        this.currentPart = {kind: 'WHEN', steps: []};
        this.currentScenario.parts.push(this.currentPart);
    }

    addThenPart() {
        this.currentPart = {kind: 'THEN', steps: []};
        this.currentScenario.parts.push(this.currentPart);
    }

    buildObject<T>(tClass: Class<T>): T {
        class extendedClass extends tClass {};

        // Flowtype really can't type this constructor invocation
        // Therefore we have to cast it as any :(
        const instance = new (extendedClass: any)();

        const extendedPrototype = Object.getPrototypeOf(instance);
        const classPrototype = Object.getPrototypeOf(extendedPrototype);

        getAllMethods(classPrototype).forEach((methodName) => {
            const self = this;

            extendedPrototype[methodName] = function(...args) {
                const steps = self.currentPart.steps;
                const name = steps.length > 0 ?
                    _.lowerCase(humanize(methodName)) :
                    humanize(methodName);
                self.currentPart.steps.push({name});

                return classPrototype[methodName].apply(this, args);
            }
        });

        return instance;

        function getAllMethods(obj: any): string[] {
            let allMethods: string[] = [];
            let current = obj;
            do {
                let props = Object.getOwnPropertyNames(current)
                props.forEach(function(prop) {
                    if (allMethods.indexOf(prop) === -1) {
                        if(_.isFunction(current[prop])) {
                            allMethods.push(prop);
                        }
                    }
                });
            } while(current = Object.getPrototypeOf(current));

            return allMethods;
        }
    }
}

export const INSTANCE = new ScenarioRunner();

export function scenarios<G: Stage, W: Stage, T: Stage>(groupName: string, givenClass: Class<G>, whenClass: Class<W>, thenClass: Class<T>, scenarioFunc: ScenariosFunc<G, W, T>): void {
    return INSTANCE.scenarios(groupName, [givenClass, whenClass, thenClass], scenarioFunc);
}

function copyStateProperties<S, T>(source: ?S, target: ?T): void {
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

export function State(target: any, key: string, descriptor: any) {
    if (! target.stateProperties) {
        target.stateProperties = [];
    }
    target.stateProperties.push(key);
    return {...descriptor, writable: true};
}
