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

type ScenariosFunc = {
    (): {[key:string]: ScenarioFunc};
}

type ScenarioFunc = {
    (): void;
}

export class ScenarioRunner {
    describe: DescribeFunc;
    it: ItFunc;

    setupForRspec(describe: any, it: any) {
        this.describe = describe;
        this.it = it;
    }

    scenarios(groupName: string, scenariosFunc: ScenariosFunc) {
        this.describe(humanize(groupName), () => {
            const scenarios = scenariosFunc();
            _.functions(scenarios).forEach(scenarioName => {
                const scenarioNameForHumans = humanize(scenarioName);
                this.it(scenarioNameForHumans, scenarios[scenarioName])
            });
        })
    }
}

const INSTANCE = new ScenarioRunner();

export const setupForRspec = INSTANCE.setupForRspec.bind(INSTANCE);
export const scenarios = INSTANCE.scenarios.bind(INSTANCE);
