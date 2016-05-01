import {ScenarioRunner} from '../src/scenarios';

import {expect} from 'chai';
import sinon from 'sinon';

describe('ScenarioRunner', () => {
    it('should be able to run scenarios over an rspec runner', () => {
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
    });
});
