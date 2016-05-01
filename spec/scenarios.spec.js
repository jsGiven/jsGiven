// @flow
import {scenarios, setupForRspec} from '../index';
import {ScenarioRunner} from '../src/scenarios';

import {expect} from 'chai';
import sinon from 'sinon';

setupForRspec(describe, it);

scenarios('scenario_runner', () => {
    return {
        scenarios_can_be_run_over_an_rspec_runner() {
            // given
            const scenarioRunner = new ScenarioRunner();
            const describe = sinon.stub();
            const it = sinon.stub();
            scenarioRunner.setupForRspec(describe, it);
            const scenarioFunc = sinon.spy();

            // when
            scenarioRunner.scenarios('group_name', () => {
                return {
                    my_scenario_name: scenarioFunc
                };
            });
            describe.callArg(1); // Emulate rspec describe()
            it.callArg(1); // Emulate rspec it()

            // then
            expect(describe).to.have.been.calledWith('Group name');
            expect(it).to.have.been.calledWith('My scenario name');
            expect(scenarioFunc).to.have.been.called;
        }
    };
});
