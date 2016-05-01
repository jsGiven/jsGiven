import _ from 'lodash';

export class ScenarioRunner {
    setupForRspec(describe, it) {
        this.describe = describe;
        this.it = it;
    }

    scenarios(groupName, scenariosFunc) {
        this.describe(groupName, () => {
            const scenarios = scenariosFunc();
            _.functions(scenarios).forEach(scenarioName =>
                this.it(scenarioName, scenarios[scenarioName]));
        })
    }
}
