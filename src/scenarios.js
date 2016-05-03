// @flow
import _ from 'lodash';
import humanize from 'string-humanize';

type DescribeFunc = {
    (suiteName: string, suiteFunc: TestFunc): void;
}

type TestFunc = {
    (): void;
}

type ItFunc = {
    (testName: string, testFunc: TestFunc): void;
}

type ScenariosParam<G, W, T> = {
    given: () => G;
    when: () => W;
    then: () => T;
}

type ScenariosFunc<G, W, T> = {
    (scenariosParam: ScenariosParam<G, W, T>): {[key:string]: ScenarioFunc};
}

type ScenarioFunc = {
    (): void;
}

export class ScenarioRunner {
    describe: DescribeFunc;
    it: ItFunc;

    setupForRspec(describe: any, it: any): void {
        this.describe = describe;
        this.it = it;
    }

    scenarios<G, W, T>(groupName: string, givenClass: Class<G>, whenClass: Class<W>, thenClass: Class<T>, scenariosFunc: ScenariosFunc<G, W, T>) {
        let currentGiven: ?G;
        let currentWhen: ?W;
        let currentThen: ?T;

        function getOrBuildGiven(): G {
            if (!currentGiven) {
                currentGiven = buildObject(givenClass);
            }
            return currentGiven;
        }

        function getOrBuildWhen(): W {
            if (!currentWhen) {
                currentWhen = buildObject(whenClass);
                copyStateProperties(currentGiven, currentWhen);
            }
            return currentWhen;
        }

        function getOrBuildThen(): T {
            if (!currentThen) {
                currentThen = buildObject(thenClass);
                copyStateProperties(currentGiven, currentThen);
                copyStateProperties(currentWhen, currentThen);
            }
            return currentThen;
        }

        const givenParam: ScenariosParam<G, W, T> = {
            given: getOrBuildGiven,
            when: getOrBuildWhen,
            then: getOrBuildThen
        };

        this.describe(humanize(groupName), () => {
            const scenarios = scenariosFunc(givenParam);

            _.functions(scenarios).forEach(scenarioName => {
                const scenarioNameForHumans = humanize(scenarioName);
                this.it(scenarioNameForHumans, () => {
                    // Reset stages
                    currentGiven = currentWhen = currentThen = undefined;
                    // Execute scenario
                    scenarios[scenarioName]();
                })
            });
        })
    }
}

function buildObject<T>(tClass: Class<T>): T {
    // Flowtype really can't type this constructor invocation from Class<T>
    // Therefore we have to cast it as any :(
    const tClassConstructor:any = tClass;
    return new tClassConstructor();
}

const INSTANCE = new ScenarioRunner();

export function setupForRspec(describe: mixed, it: mixed):void {
    return INSTANCE.setupForRspec(describe, it);
}
export function scenarios<G, W, T>(groupName: string, givenClass: Class<G>, whenClass: Class<W>, thenClass: Class<T>, scenarioFunc: ScenariosFunc<G, W, T>): void {
    return INSTANCE.scenarios(groupName, givenClass, whenClass, thenClass, scenarioFunc);
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
