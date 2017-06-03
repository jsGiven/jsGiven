// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    State,
    Stage,
} from '../src';

import {BasicScenarioGivenStage, BasicScenarioWhenStage, BasicScenarioThenStage} from './basic-stages';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class StatefullScenarioGivenStage extends BasicScenarioGivenStage {
    GivenStageStateFull: Class<any>;
    WhenStageStateFull: Class<any>;
    ThenStageStateFull: Class<any>;

    @State valueRecorder: {
        expectedValueFromWhenStage?: number;
        expectedValueFromGivenStage?: number;
    };

    three_stateful_stages_written_using_the_State_decorator(): this {
        const self = this;
        this.valueRecorder = {};
        this.GivenStageStateFull = class GivenStageStateFull extends Stage {
            @State givenValue: number;
            @State expectedValue: number;
            aValue(): this {
                this.givenValue = 1;
                this.expectedValue = 2;
                return this;
            }
        };
        this.WhenStageStateFull = class WhenStageStateFull extends Stage {
            @State givenValue: number;
            @State computedValue: number;
            it_gets_incremented(): this {
                this.computedValue = this.givenValue + 1;
                return this;
            }
        };
        this.ThenStageStateFull = class ThenStageStateFull extends Stage {
            @State expectedValue: number;
            @State computedValue: number;
            the_value_is_incremented(): this {
                self.valueRecorder.expectedValueFromWhenStage = this.computedValue;
                self.valueRecorder.expectedValueFromGivenStage = this.expectedValue;
                return this;
            }
        };
        return this;
    }

    three_stateful_stages_written_using_the_State_addProperty_method(): this {
        const self = this;
        this.valueRecorder = {};
        this.GivenStageStateFull = class GivenStageStateFull extends Stage {
            givenValue: number;
            expectedValue: number;
            aValue(): this {
                this.givenValue = 1;
                this.expectedValue = 2;
                return this;
            }
        };
        State.addProperty(this.GivenStageStateFull, 'givenValue');
        State.addProperty(this.GivenStageStateFull, 'expectedValue');
        this.WhenStageStateFull = class WhenStageStateFull extends Stage {
            givenValue: number;
            computedValue: number;
            it_gets_incremented(): this {
                this.computedValue = this.givenValue + 1;
                return this;
            }
        };
        State.addProperty(this.WhenStageStateFull, 'givenValue');
        State.addProperty(this.WhenStageStateFull, 'computedValue');
        this.ThenStageStateFull = class ThenStageStateFull extends Stage {
            expectedValue: number;
            computedValue: number;
            the_value_is_incremented(): this {
                self.valueRecorder.expectedValueFromWhenStage = this.computedValue;
                self.valueRecorder.expectedValueFromGivenStage = this.expectedValue;
                return this;
            }
        };
        State.addProperty(this.ThenStageStateFull, 'expectedValue');
        State.addProperty(this.ThenStageStateFull, 'computedValue');
        return this;
    }

    three_stateful_stages_written_using_State_decorator_and_addProperty_method(): this {
        const self = this;
        this.valueRecorder = {};
        this.GivenStageStateFull = class GivenStageStateFull extends Stage {
            @State givenValue: number;
            expectedValue: number;
            aValue(): this {
                this.givenValue = 1;
                this.expectedValue = 2;
                return this;
            }
        };
        State.addProperty(this.GivenStageStateFull, 'expectedValue');
        this.WhenStageStateFull = class WhenStageStateFull extends Stage {
            givenValue: number;
            @State computedValue: number;
            it_gets_incremented(): this {
                this.computedValue = this.givenValue + 1;
                return this;
            }
        };
        State.addProperty(this.WhenStageStateFull, 'givenValue');
        this.ThenStageStateFull = class ThenStageStateFull extends Stage {
            @State expectedValue: number;
            computedValue: number;
            the_value_is_incremented(): this {
                self.valueRecorder.expectedValueFromWhenStage = this.computedValue;
                self.valueRecorder.expectedValueFromGivenStage = this.expectedValue;
                return this;
            }
        };
        State.addProperty(this.ThenStageStateFull, 'computedValue');
        return this;
    }

    a_scenario_that_uses_stateful_stages(): this {
        this.scenarioRunner.scenarios('group_name', [this.GivenStageStateFull, this.WhenStageStateFull, this.ThenStageStateFull], ({given, when, then}) => {
            return {
                scenario_using_stages: scenario({}, () => {
                    given().aValue();
                    when().it_gets_incremented();
                    then().the_value_is_incremented();
                }),
            };
        });
        return this;
    }
}

class StatefullScenarioThenStage extends BasicScenarioThenStage {
    @State valueRecorder: {
        expectedValueFromWhenStage?: number;
        expectedValueFromGivenStage?: number;
    };

    the_state_has_been_propagated(): this {
        expect(this.valueRecorder.expectedValueFromGivenStage).to.equal(2);
        expect(this.valueRecorder.expectedValueFromWhenStage).to.equal(2);
        return this;
    }
}

scenarios('core.scenarios.state', [StatefullScenarioGivenStage, BasicScenarioWhenStage, StatefullScenarioThenStage], ({given, when, then}) => {
    return {
        scenarios_can_share_state_between_stages_using_the_State_decorator: scenario({}, () => {
            given().a_scenario_runner()
                .and().three_stateful_stages_written_using_the_State_decorator()
                .and().a_scenario_that_uses_stateful_stages();

            when().the_scenario_is_executed();

            then().the_state_has_been_propagated();
        }),

        scenarios_can_share_state_between_stages_using_the_addProperty_method: scenario({}, () => {
            given().a_scenario_runner()
                .and().three_stateful_stages_written_using_the_State_addProperty_method()
                .and().a_scenario_that_uses_stateful_stages();

            when().the_scenario_is_executed();

            then().the_state_has_been_propagated();
        }),

        scenarios_can_share_state_between_stages_using_the_both_State_decorator_and_addProperty_method: scenario({}, () => {
            given().a_scenario_runner()
                .and().three_stateful_stages_written_using_State_decorator_and_addProperty_method()
                .and().a_scenario_that_uses_stateful_stages();

            when().the_scenario_is_executed();

            then().the_state_has_been_propagated();
        }),
    };
});
