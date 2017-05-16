// @flow
import tmp from 'tmp';
import {expect} from 'chai';
import sinon from 'sinon';

import {ScenarioRunner} from '../src/scenarios';
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

export class ScenarioWhenStage extends Stage {
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

    the_describe_method_has_been_called(): this {
        expect(this.describe).to.have.been.calledWith('Group name');
        return this;
    }

    the_it_method_has_been_called(): this {
        expect(this.it).to.have.been.calledWith('My scenario name');
        return this;
    }
}
