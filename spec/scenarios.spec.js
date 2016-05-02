// @flow
import {scenarios, setupForRspec, State, Stage} from '../index';

import {ScenarioRunner} from '../src/scenarios';

import {expect} from 'chai';
import sinon from 'sinon';

import _ from 'lodash';

setupForRspec(describe, it);

class ScenariosGivenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe;
    @State it;
    @State scenarioFunc;

    a_scenario_runner(): this {
        this.scenarioRunner = new ScenarioRunner();
        this.describe = sinon.stub();
        this.it = sinon.stub();
        this.scenarioRunner.setupForRspec(this.describe, this.it);
        this.scenarioFunc = sinon.spy();
        return this;
    }
}

class ScenarioWhenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe;
    @State it;
    @State scenarioFunc;

    a_scenario_is_executed(): this {
        this.scenarioRunner.scenarios('group_name', DefaultStage, DefaultStage, DefaultStage, () => {
            return {
                my_scenario_name: this.scenarioFunc
            };
        });
        this.describe.callArg(1); // Emulate rspec describe()
        this.it.callArg(1); // Emulate rspec it()
        return this;
    }
}

class ScenarioThenStage extends Stage {
    @State describe;
    @State it;
    @State scenarioFunc;

    describe_has_been_called(): this {
        expect(this.describe).to.have.been.calledWith('Group name');
        return this;
    }

    it_has_been_called(): this {
        expect(this.it).to.have.been.calledWith('My scenario name');
        return this;
    }

    the_scenario_function_has_been_called(): this {
        expect(this.scenarioFunc).to.have.been.called;
        return this;
    }
}

class DefaultStage {

}

scenarios('scenario_runner', ScenariosGivenStage, ScenarioWhenStage, ScenarioThenStage, ({given, when, then}) => {
    return {
        scenarios_can_be_run_over_an_rspec_runner() {
            // given
            given().a_scenario_runner();

            // when
            when().a_scenario_is_executed();

            // then
            then().describe_has_been_called().and()
                .it_has_been_called().and()
                .the_scenario_function_has_been_called();
        },


        scenarios_can_use_given_when_then_stages_with_methods() {
            // given
            const scenarioRunner = new ScenarioRunner();
            const describe = sinon.stub();
            const it = sinon.stub();
            scenarioRunner.setupForRspec(describe, it);
            const scenarioFunc = sinon.spy();
            let somethingGivenCalled = false;
            class GivenStage {
                somethingGiven() { somethingGivenCalled = true; }
            };
            let somethingWhenCalled = false;
            class WhenStage {
                somethingWhen() { somethingWhenCalled = true; }
            };
            let somethingThenCalled = false;
            class ThenStage {
                somethingThen() { somethingThenCalled = true; }
            };

            // when
            scenarioRunner.scenarios('group_name', GivenStage, WhenStage, ThenStage, ({given, when, then}) => {
                return {
                    scenario_using_stages() {
                        given().somethingGiven();
                        when().somethingWhen();
                        then().somethingThen();
                    }
                };
            });
            describe.callArg(1); // Emulate rspec describe()
            it.callArg(1); // Emulate rspec it()

            // then
            expect(somethingGivenCalled).to.have.be.true;
            expect(somethingWhenCalled).to.have.be.true;
            expect(somethingThenCalled).to.have.be.true;
        },

        scenarios_can_share_state_between_stages() {
            // given
            const scenarioRunner = new ScenarioRunner();
            const describe = sinon.stub();
            const it = sinon.stub();
            scenarioRunner.setupForRspec(describe, it);
            const scenarioFunc = sinon.spy();
            class GivenStage {
                @State givenValue: number;
                @State expectedValue: number;
                aValue() { this.givenValue = 1; this.expectedValue = 2; }
            };
            class WhenStage {
                @State givenValue: number;
                @State computedValue: number;
                it_gets_incremented() { this.computedValue = this.givenValue + 1; }
            };
            let expectedValueFromWhenStage;
            let expectedValueFromGivenStage;
            class ThenStage {
                @State expectedValue: number;
                @State computedValue: number;
                the_value_must_be_incremented() {
                    expectedValueFromWhenStage = this.computedValue;
                    expectedValueFromGivenStage = this.expectedValue;
                }
            };

            // when
            scenarioRunner.scenarios('group_name', GivenStage, WhenStage, ThenStage, ({given, when, then}) => {
                return {
                    scenario_using_stages() {
                        given().aValue();
                        when().it_gets_incremented();
                        then().the_value_must_be_incremented();
                    }
                };
            });
            describe.callArg(1); // Emulate rspec describe()
            it.callArg(1); // Emulate rspec it()

            // then
            expect(expectedValueFromWhenStage).to.equal(2);
            expect(expectedValueFromGivenStage).to.equal(2);
        }
    };
});
