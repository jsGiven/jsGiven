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
    @State somethingGivenCalled;
    @State somethingWhenCalled;
    @State somethingThenCalled;
    GivenStageThatRecordBeenCalled;
    WhenStageThatRecordBeenCalled;
    ThenStageThatRecordBeenCalled;
    GivenStageStateFull;
    WhenStageStateFull;
    ThenStageStateFull;
    @State expectedValueFromWhenStage;
    @State expectedValueFromGivenStage;

    a_scenario_runner(): this {
        this.scenarioRunner = new ScenarioRunner();
        this.describe = sinon.stub();
        this.it = sinon.stub();
        this.scenarioRunner.setupForRspec(this.describe, this.it);
        return this;
    }

    a_dummy_scenario(): this {
        this.scenarioFunc = sinon.spy();
        this.scenarioRunner.scenarios('group_name', DefaultStage, DefaultStage, DefaultStage, () => {
            return {
                my_scenario_name: this.scenarioFunc
            };
        });
        return this;
    }

    three_stages_that_record_been_called(): this {
        this.somethingGivenCalled = false;
        const self = this;
        this.GivenStageThatRecordBeenCalled = class GivenStageThatRecordBeenCalled {
            somethingGiven() { self.somethingGivenCalled = true; }
        };
        this.somethingWhenCalled = false;
        this.WhenStageThatRecordBeenCalled = class WhenStageThatRecordBeenCalled {
            somethingWhen() { self.somethingWhenCalled = true; }
        };
        this.somethingThenCalled = false;
        this.ThenStageThatRecordBeenCalled = class ThenStageThatRecordBeenCalled {
            somethingThen() { self.somethingThenCalled = true; }
        };

        return this;
    }

    three_stateful_stages(): this {
        const self = this;
        this.GivenStageStateFull = class GivenStageStateFull {
            @State givenValue: number;
            @State expectedValue: number;
            aValue() { this.givenValue = 1; this.expectedValue = 2; }
        };
        this.WhenStageStateFull = class WhenStageStateFull {
            @State givenValue: number;
            @State computedValue: number;
            it_gets_incremented() { this.computedValue = this.givenValue + 1; }
        };
        this.expectedValueFromWhenStage;
        this.expectedValueFromGivenStage;
        this.ThenStageStateFull = class ThenStageStateFull {
            @State expectedValue: number;
            @State computedValue: number;
            the_value_must_be_incremented() {
                self.expectedValueFromWhenStage = this.computedValue;
                self.expectedValueFromGivenStage = this.expectedValue;
            }
        };
        return this;
    }

    a_scenario_that_uses_the_stages_that_records(): this {
        this.scenarioRunner.scenarios('group_name', this.GivenStageThatRecordBeenCalled, this.WhenStageThatRecordBeenCalled, this.ThenStageThatRecordBeenCalled, ({given, when, then}) => {
            return {
                scenario_using_stages() {
                    given().somethingGiven();
                    when().somethingWhen();
                    then().somethingThen();
                }
            };
        });
        return this;
    }

    a_scenario_that_uses_stateful_stages(): this {
        this.scenarioRunner.scenarios('group_name', this.GivenStageStateFull, this.WhenStageStateFull, this.ThenStageStateFull, ({given, when, then}) => {
            return {
                scenario_using_stages() {
                    given().aValue();
                    when().it_gets_incremented();
                    then().the_value_must_be_incremented();
                }
            };
        });
        return this;
    }
}

class ScenarioWhenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe;
    @State it;
    @State scenarioFunc;

    the_scenario_is_executed(): this {
        this.describe.callArg(1); // Emulate rspec describe()
        this.it.callArg(1); // Emulate rspec it()
        return this;
    }
}

class ScenarioThenStage extends Stage {
    @State describe;
    @State it;
    @State scenarioFunc;

    @State somethingGivenCalled;
    @State somethingWhenCalled;
    @State somethingThenCalled;

    @State expectedValueFromWhenStage;
    @State expectedValueFromGivenStage;

    the_describe_method_has_been_called(): this {
        expect(this.describe).to.have.been.calledWith('Group name');
        return this;
    }

    the_it_method_has_been_called(): this {
        expect(this.it).to.have.been.calledWith('My scenario name');
        return this;
    }

    the_dummy_scenario_function_has_been_called(): this {
        expect(this.scenarioFunc).to.have.been.called;
        return this;
    }

    the_three_stages_have_been_called(): this {
        expect(this.somethingGivenCalled).to.be.true;
        expect(this.somethingWhenCalled).to.be.true;
        expect(this.somethingThenCalled).to.be.true;
        return this;
    }

    the_value_from_when_stage_should_be_modified(): this {
        expect(this.expectedValueFromWhenStage).to.equal(2);
        return this;
    }

    the_value_from_given_stage_should_be_modified(): this {
        expect(this.expectedValueFromGivenStage).to.equal(2);
        return this;
    }
}

class DefaultStage {

}

scenarios('scenario_runner', ScenariosGivenStage, ScenarioWhenStage, ScenarioThenStage, ({given, when, then}) => {
    return {
        scenarios_can_be_run_over_an_rspec_runner() {
            given().a_scenario_runner()
                .and().a_dummy_scenario();

            when().the_scenario_is_executed();

            then().the_describe_method_has_been_called()
                .and().the_it_method_has_been_called()
                .and().the_dummy_scenario_function_has_been_called();
        },

        scenarios_can_use_given_when_then_stages_with_methods() {
            given().a_scenario_runner()
                .and().three_stages_that_record_been_called()
                .and().a_scenario_that_uses_the_stages_that_records();

            when().the_scenario_is_executed();

            then().the_three_stages_have_been_called();
        },

        scenarios_can_share_state_between_stages() {
            given().a_scenario_runner()
                .and().three_stateful_stages()
                .and().a_scenario_that_uses_stateful_stages();

            when().the_scenario_is_executed();

            then().the_value_from_when_stage_should_be_modified()
                .and().the_value_from_when_stage_should_be_modified();
        }
    };
});
