// @flow
import {scenarios, setupForRspec, setupForAva, State, Stage} from '../index';

import {ScenarioRunner} from '../src/scenarios';

import {expect} from 'chai';
import sinon from 'sinon';

import _ from 'lodash';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class BasicScenarioGivenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe;
    @State it;

    a_scenario_runner(): this {
        this.scenarioRunner = new ScenarioRunner();
        this.describe = sinon.stub();
        this.it = sinon.stub();
        this.scenarioRunner.setup(this.describe, this.it);
        return this;
    }
}

class ScenarioWhenStage extends Stage {
    @State scenarioRunner: ScenarioRunner;
    @State describe;
    @State it;

    the_scenario_is_executed(): this {
        this.describe.callArg(1); // Emulate rspec describe()
        this.it.callArg(1); // Emulate rspec it()
        return this;
    }
}

class BasicScenarioThenStage extends Stage {
    @State describe;
    @State it;

    the_describe_method_has_been_called(): this {
        expect(this.describe).to.have.been.calledWith('Group name');
        return this;
    }

    the_it_method_has_been_called(): this {
        expect(this.it).to.have.been.calledWith('My scenario name');
        return this;
    }
}

class DummyScenarioGivenStage extends BasicScenarioGivenStage {
    @State scenarioFunc;

    a_dummy_scenario(): this {
        class DefaultStage extends Stage {};
        this.scenarioFunc = sinon.spy();
        this.scenarioRunner.scenarios('group_name', DefaultStage, DefaultStage, DefaultStage, () => {
            return {
                my_scenario_name: this.scenarioFunc
            };
        });
        return this;
    }
}

class DummyScenarioThenStage extends BasicScenarioThenStage {
    @State scenarioFunc;

    the_dummy_scenario_function_has_been_called(): this {
        expect(this.scenarioFunc).to.have.been.called;
        return this;
    }
}

scenarios('scenario_runner', DummyScenarioGivenStage, ScenarioWhenStage, DummyScenarioThenStage, ({given, when, then}) => {
    return {
        scenarios_can_be_run_over_any_scenario_runner() {
            given().a_scenario_runner()
                .and().a_dummy_scenario();

            when().the_scenario_is_executed();

            then().the_describe_method_has_been_called()
                .and().the_it_method_has_been_called()
                .and().the_dummy_scenario_function_has_been_called();
        }
    }
});

class StageRecorderGivenStage extends BasicScenarioGivenStage {
    @State somethingGivenCalled;
    @State somethingWhenCalled;
    @State somethingThenCalled;
    GivenStageThatRecordBeenCalled: Class<any>;
    WhenStageThatRecordBeenCalled: Class<any>;
    ThenStageThatRecordBeenCalled: Class<any>;

    three_stages_that_record_been_called(): this {
        this.somethingGivenCalled = false;
        const self = this;
        this.GivenStageThatRecordBeenCalled = class GivenStageThatRecordBeenCalled extends Stage {
            somethingGiven() { self.somethingGivenCalled = true; }
        };
        this.somethingWhenCalled = false;
        this.WhenStageThatRecordBeenCalled = class WhenStageThatRecordBeenCalled extends Stage {
            somethingWhen() { self.somethingWhenCalled = true; }
        };
        this.somethingThenCalled = false;
        this.ThenStageThatRecordBeenCalled = class ThenStageThatRecordBeenCalled extends Stage {
            somethingThen() { self.somethingThenCalled = true; }
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
}

class StageRecorderThenStage extends BasicScenarioThenStage {
    @State somethingGivenCalled;
    @State somethingWhenCalled;
    @State somethingThenCalled;

    the_three_stages_have_been_called(): this {
        expect(this.somethingGivenCalled).to.be.true;
        expect(this.somethingWhenCalled).to.be.true;
        expect(this.somethingThenCalled).to.be.true;
        return this;
    }
}

scenarios('scenario_runner', StageRecorderGivenStage, ScenarioWhenStage, StageRecorderThenStage, ({given, when, then}) => {
    return {
        scenarios_can_use_given_when_then_stages_with_methods() {
            given().a_scenario_runner()
                .and().three_stages_that_record_been_called()
                .and().a_scenario_that_uses_the_stages_that_records();

            when().the_scenario_is_executed();

            then().the_three_stages_have_been_called();
        }
    };
});

class StatefullScenarioGivenStage extends BasicScenarioGivenStage {
    GivenStageStateFull: Class<any>;
    WhenStageStateFull: Class<any>;
    ThenStageStateFull: Class<any>;
    @State expectedValueFromWhenStage;
    @State expectedValueFromGivenStage;

    three_stateful_stages(): this {
        const self = this;
        this.GivenStageStateFull = class GivenStageStateFull extends Stage {
            @State givenValue: number;
            @State expectedValue: number;
            aValue() { this.givenValue = 1; this.expectedValue = 2; }
        };
        this.WhenStageStateFull = class WhenStageStateFull extends Stage {
            @State givenValue: number;
            @State computedValue: number;
            it_gets_incremented() { this.computedValue = this.givenValue + 1; }
        };
        this.expectedValueFromWhenStage;
        this.expectedValueFromGivenStage;
        this.ThenStageStateFull = class ThenStageStateFull extends Stage {
            @State expectedValue: number;
            @State computedValue: number;
            the_value_must_be_incremented() {
                self.expectedValueFromWhenStage = this.computedValue;
                self.expectedValueFromGivenStage = this.expectedValue;
            }
        };
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

class StatefullScenarioThenStage extends BasicScenarioThenStage {
    @State expectedValueFromWhenStage;
    @State expectedValueFromGivenStage;

    the_state_has_been_propagated(): this {
        expect(this.expectedValueFromGivenStage).to.equal(2);
        expect(this.expectedValueFromWhenStage).to.equal(2);
        return this;
    }
}

scenarios('scenario_runner', StatefullScenarioGivenStage, ScenarioWhenStage, StatefullScenarioThenStage, ({given, when, then}) => {
    return {
        scenarios_can_share_state_between_stages() {
            given().a_scenario_runner()
                .and().three_stateful_stages()
                .and().a_scenario_that_uses_stateful_stages();

            when().the_scenario_is_executed();

            then().the_state_has_been_propagated();
        }
    };
});
