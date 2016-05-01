import {scenarios, setupForRspec} from '../index';
import {ScenarioRunner} from '../src/scenarios';

import {expect} from 'chai';
import sinon from 'sinon';

setupForRspec(describe, it);

scenarios('ScenarioRunner', () => {
    return {
        should_be_able_to_run_scenarios_over_an_rspec_runner() {
            // given
            const scenarioRunner = new ScenarioRunner();
            const describe = sinon.stub();
            const it = sinon.stub();
            scenarioRunner.setupForRspec(describe, it);
            const scenarioFunc = sinon.spy();

            // when
            scenarioRunner.scenarios('groupName', () => {
                return {
                    my_scenario_name: scenarioFunc
                };
            });
            describe.callArg(1); // Emulate rspec describe()
            it.callArg(1); // Emulate rspec it()

            // then
            expect(describe).to.have.been.calledWith('groupName');
            expect(it).to.have.been.calledWithExactly('my_scenario_name', scenarioFunc);
            expect(scenarioFunc).to.have.been.called;
        }
    };
});
