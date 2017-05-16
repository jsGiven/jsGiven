// @flow
import fs from 'fs';

import tmp from 'tmp';
import {expect} from 'chai';
import sinon from 'sinon';

import {ScenarioRunner} from '../src/scenarios';
import type {ScenarioCase, ScenarioPart, ScenarioPartKind, ScenarioReport} from '../src/reports';
import {computeScenarioFileName} from '../src/reports';
import type {GroupFunc, TestFunc} from '../src/test-runners';
import {Stage, State} from '../src';

type SinonStub = {
    callArg: (arg: number) => void;
}

export class BasicScenarioGivenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe: GroupFunc;
    @State it: TestFunc;
    @State jsGivenReportsDir: string;

    a_scenario_runner(): this {
        const tmpDir = tmp.dirSync({unsafeCleanup: true});
        this.jsGivenReportsDir = tmpDir.name;
        this.scenarioRunner = new ScenarioRunner(tmpDir.name);
        this.describe = sinon.stub();
        this.it = sinon.stub();
        this.scenarioRunner.setup(this.describe, this.it);
        return this;
    }
}

export class BasicScenarioWhenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe: GroupFunc & SinonStub;
    @State it: TestFunc & SinonStub;

    the_scenario_is_executed(): this {
        this.describe.callArg(1); // Emulate rspec describe()
        this.it.callArg(1); // Emulate rspec it()
        return this;
    }
}

export class BasicScenarioThenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe: GroupFunc;
    @State it: GroupFunc;
    @State jsGivenReportsDir: string;

    the_describe_method_has_been_called(): this {
        expect(this.describe).to.have.been.calledWith('Group name');
        return this;
    }

    the_it_method_has_been_called(): this {
        expect(this.it).to.have.been.calledWith('Scenario name');
        return this;
    }

    the_it_method_has_been_called_$_times_with_parameters_$(callCount: number, parameters: string[]): this {
        expect(this.it).to.have.callCount(callCount);
        parameters.forEach((parameter, index) => {
            const spy: any = this.it;
            expect(spy.getCall(index)).to.have.been.calledWith(parameter);
        });
        return this;
    }

    the_report_for_this_scenerio_has_been_generated(): this {
        const stats = fs.statSync(this.getFileName());
        expect(stats.isFile());
        return this;
    }

    findPartByKind(scenarioKind: ScenarioPartKind): ScenarioPart {
        const scenario = this.getScenario();
        const [scenarioCase] = scenario.cases;
        const part = scenarioCase.parts.find(({kind}) => kind === scenarioKind);
        if (!part) {
            throw new Error(`No such part ${scenarioKind}`);
        }
        return part;
    }

    findPartByKindInCase(scenarioCase: ScenarioCase, scenarioKind: ScenarioPartKind): ScenarioPart {
        const part = scenarioCase.parts.find(({kind}) => kind === scenarioKind);
        if (!part) {
            throw new Error(`No such part ${scenarioKind}`);
        }
        return part;
    }

    getFileName(): string {
        return `${this.jsGivenReportsDir}/${computeScenarioFileName('Group name', 'Scenario name')}`;
    }

    getScenario(): ScenarioReport {
        return JSON.parse(fs.readFileSync(this.getFileName(), 'utf-8'));
    }
}
