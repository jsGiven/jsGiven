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

type GivenParam<G> = {
    given: () => G;
}

type ScenariosFunc<G> = {
    (givenParam: GivenParam<G>): {[key:string]: ScenarioFunc};
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

    scenarios<G>(groupName: string, givenMixin: G, scenariosFunc: ScenariosFunc<G>) {
        this.describe(humanize(groupName), () => {
            const givenFunc = () => givenMixin;
            const scenarios = scenariosFunc({given: givenFunc});
            _.functions(scenarios).forEach(scenarioName => {
                const scenarioNameForHumans = humanize(scenarioName);
                this.it(scenarioNameForHumans, scenarios[scenarioName])
            });
        })
    }
}

const INSTANCE = new ScenarioRunner();

export const setupForRspec: (describe: mixed, it: mixed) => void
    = INSTANCE.setupForRspec.bind(INSTANCE);
export const scenarios: (groupName: string, givenMixin: mixed, scenarioFunc: ScenariosFunc) => void
    = INSTANCE.scenarios.bind(INSTANCE);

export function stages<A, B, C, D>(a: A, b: B, c?: C,d?: D): A & B & C & D {
    return {...a, ...b, ...c, ...d};
}
