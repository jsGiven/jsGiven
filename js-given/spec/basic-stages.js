// @flow
import fs from 'fs';

import _ from 'lodash';
import tmp from 'tmp';
import { expect } from 'chai';
import sinon from 'sinon';
import isPromise from 'is-promise';

import { ScenarioRunner, doAsync } from '../src/scenarios';
import type {
    ScenarioCase,
    ScenarioPart,
    ScenarioPartKind,
    ScenarioReport,
    Step,
} from '../src/reports';
import { computeScenarioFileName } from '../src/reports';
import type { GroupFunc, TestFunc } from '../src/test-runners';
import { Stage, State } from '../src';

type SinonStub = {
    callArg: (arg: number) => any,
    getCall: (callCount: number) => Call,
    callCount: number,
};

type Call = {
    args: Array<any>,
};

export class BasicScenarioGivenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe: GroupFunc;
    @State it: TestFunc;
    @State jsGivenReportsDir: string;

    a_scenario_runner(): this {
        const tmpDir = tmp.dirSync({ unsafeCleanup: true });
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
    @State errors: Error[] = [];

    the_scenario_is_executed(): this {
        expect(this.describe).calledOnce;
        this.describe.callArg(1); // Emulate rspec describe()

        expect(this.it).called;

        const callCount = this.it.callCount;
        for (let i = 0; i < callCount; i++) {
            const testFunction = this.it.getCall(0).args[1];
            const promiseOrNull = testFunction(); // Emulate rspec it()

            if (isPromise(promiseOrNull)) {
                doAsync(async () => {
                    await promiseOrNull;
                });
            }
        }

        return this;
    }

    the_runner_tries_to_execute_the_scenario(): this {
        expect(this.describe).calledOnce;
        this.describe.callArg(1); // Emulate rspec describe()

        expect(this.it).called;

        const callCount = this.it.callCount;
        for (let i = 0; i < callCount; i++) {
            const testFunction = this.it.getCall(0).args[1];

            try {
                const promiseOrNull = testFunction(); // Emulate rspec it()

                if (isPromise(promiseOrNull)) {
                    doAsync(async () => {
                        try {
                            await promiseOrNull;
                        } catch (error) {
                            this.errors.push(error);
                        }
                    });
                }
            } catch (error) {
                this.errors.push(error);
            }
        }

        return this;
    }
}

export class BasicScenarioThenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe: GroupFunc;
    @State it: GroupFunc;
    @State jsGivenReportsDir: string;

    the_describe_method_has_been_called(): this {
        expect(this.describe).to.have.been.calledWith('group_name');
        return this;
    }

    the_it_method_has_been_called(): this {
        expect(this.it).to.have.been.calledWith('Scenario name');
        return this;
    }

    the_it_method_has_been_called_$_times_with_parameters_$(
        callCount: number,
        parameters: string[]
    ): this {
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

    getAllSteps(): Step[] {
        const scenario = this.getScenario();
        const [scenarioCase] = scenario.cases;
        return _.flatMap(scenarioCase.parts, part => {
            return part.steps;
        });
    }

    findPartByKind(scenarioKind: ScenarioPartKind): ScenarioPart {
        const scenario = this.getScenario();
        const [scenarioCase] = scenario.cases;
        const part = scenarioCase.parts.find(
            ({ kind }) => kind === scenarioKind
        );
        if (!part) {
            throw new Error(`No such part ${scenarioKind}`);
        }
        return part;
    }

    findPartByKindInCase(
        scenarioCase: ScenarioCase,
        scenarioKind: ScenarioPartKind
    ): ScenarioPart {
        const part = scenarioCase.parts.find(
            ({ kind }) => kind === scenarioKind
        );
        if (!part) {
            throw new Error(`No such part ${scenarioKind}`);
        }
        return part;
    }

    getFileName(): string {
        return `${this.jsGivenReportsDir}/${computeScenarioFileName(
            'group_name',
            'Scenario name'
        )}`;
    }

    getScenario(): ScenarioReport {
        return JSON.parse(fs.readFileSync(this.getFileName(), 'utf-8'));
    }
}
