// @flow
import { expect } from 'chai';
import sinon from 'sinon';

import {
  scenario,
  scenarios,
  setupForRspec,
  setupForAva,
  State,
  Stage,
} from '../src';

import {
  BasicScenarioGivenStage,
  BasicScenarioWhenStage,
  BasicScenarioThenStage,
} from './basic-stages';

if (global.describe && global.it) {
  setupForRspec(describe, it);
} else {
  const test = require('ava');
  setupForAva(test);
}

class DummyScenarioGivenStage extends BasicScenarioGivenStage {
  @State scenarioFunc;

  a_dummy_scenario(): this {
    class DefaultStage extends Stage {}
    this.scenarioFunc = sinon.spy();
    this.scenarioRunner.scenarios('group_name', DefaultStage, () => {
      return {
        scenario_name: scenario({}, this.scenarioFunc),
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

scenarios(
  'core.scenarios',
  [DummyScenarioGivenStage, BasicScenarioWhenStage, DummyScenarioThenStage],
  ({ given, when, then }) => {
    return {
      scenarios_can_be_run_over_any_scenario_runner: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .a_dummy_scenario();

        when().the_scenario_is_executed();

        then()
          .the_describe_method_has_been_called()
          .and()
          .the_it_method_has_been_called()
          .and()
          .the_dummy_scenario_function_has_been_called();
      }),
    };
  }
);

class StageRecorderGivenStage extends BasicScenarioGivenStage {
  @State
  callRecorder: {
    somethingGivenCalled: boolean,
    somethingWhenCalled: boolean,
    somethingThenCalled: boolean,
  };
  GivenStageThatRecordBeenCalled: Class<any>;
  WhenStageThatRecordBeenCalled: Class<any>;
  ThenStageThatRecordBeenCalled: Class<any>;

  three_stages_that_record_been_called(): this {
    this.callRecorder = {
      somethingGivenCalled: false,
      somethingWhenCalled: false,
      somethingThenCalled: false,
    };
    const self = this;
    this.GivenStageThatRecordBeenCalled = class GivenStageThatRecordBeenCalled extends Stage {
      somethingGiven(): this {
        self.callRecorder.somethingGivenCalled = true;
        return this;
      }
    };
    this.WhenStageThatRecordBeenCalled = class WhenStageThatRecordBeenCalled extends Stage {
      somethingWhen(): this {
        self.callRecorder.somethingWhenCalled = true;
        return this;
      }
    };
    this.ThenStageThatRecordBeenCalled = class ThenStageThatRecordBeenCalled extends Stage {
      somethingThen(): this {
        self.callRecorder.somethingThenCalled = true;
        return this;
      }
    };

    return this;
  }

  a_scenario_that_uses_the_stages_that_records(): this {
    this.scenarioRunner.scenarios(
      'group_name',
      [
        this.GivenStageThatRecordBeenCalled,
        this.WhenStageThatRecordBeenCalled,
        this.ThenStageThatRecordBeenCalled,
      ],
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            given().somethingGiven();
            when().somethingWhen();
            then().somethingThen();
          }),
        };
      }
    );
    return this;
  }
}

class StageRecorderThenStage extends BasicScenarioThenStage {
  @State
  callRecorder: {
    somethingGivenCalled: boolean,
    somethingWhenCalled: boolean,
    somethingThenCalled: boolean,
  };

  the_three_stages_have_been_called(): this {
    expect(this.callRecorder.somethingGivenCalled).to.be.true;
    expect(this.callRecorder.somethingWhenCalled).to.be.true;
    expect(this.callRecorder.somethingThenCalled).to.be.true;
    return this;
  }

  a_proper_error_is_thrown(): this {
    return this;
  }
}

scenarios(
  'core.scenarios.stages',
  [StageRecorderGivenStage, BasicScenarioWhenStage, StageRecorderThenStage],
  ({ given, when, then }) => {
    return {
      scenarios_can_use_given_when_then_stages_with_methods: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .three_stages_that_record_been_called()
            .and()
            .a_scenario_that_uses_the_stages_that_records();

          when().the_scenario_is_executed();

          then().the_three_stages_have_been_called();
        }
      ),
    };
  }
);

class UninitializedJsGivenWhenStage extends BasicScenarioWhenStage {
  @State caughtError: Error;

  declaring_a_scenario(): this {
    class AStage extends Stage {}

    try {
      this.scenarioRunner.scenarios('groupName', AStage, () => ({}));
    } catch (error) {
      this.caughtError = error;
    }

    return this;
  }
}

class UninitializedJsGivenThenStage extends BasicScenarioThenStage {
  @State caughtError: Error;

  a_proper_error_is_thrown(): this {
    expect(this.caughtError).to.exist;
    expect(this.caughtError.message).to.equal(
      'JsGiven is not initialized, please call setupForRspec() or setupForAva() in your test code'
    );
    return this;
  }
}

scenarios(
  'core.scenarios.uninitialized',
  [
    BasicScenarioGivenStage,
    UninitializedJsGivenWhenStage,
    UninitializedJsGivenThenStage,
  ],
  ({ given, when, then }) => ({
    uninitialized_use_of_jsgiven_is_properly_reported: scenario({}, () => {
      given().a_scenario_runner_incorrectly_initialized();

      when().declaring_a_scenario();

      then().a_proper_error_is_thrown();
    }),
  })
);
