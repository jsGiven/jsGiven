// @flow
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sleepPromise from 'sleep-promise';

import {
  scenario,
  scenarios,
  setupForRspec,
  setupForAva,
  State,
  Stage,
  Before,
  After,
  Around,
  Quoted,
} from '../src';
import { aroundToBeforeAfter, type AroundMethod } from '../src/life-cycle';

import {
  BasicScenarioGivenStage,
  BasicScenarioWhenStage,
  BasicScenarioThenStage,
} from './basic-stages';

chai.use(chaiAsPromised);

if (global.describe && global.it) {
  setupForRspec(describe, it);
} else {
  const test = require('ava');
  setupForAva(test);
}

type SideEffectRecorder = {
  calledDuringBeforeInGivenStage: boolean,
  calledDuringBeforeInWhenStage: boolean,
  calledDuringBeforeInThenStage: boolean,
  calledDuringBefore: boolean,
  calledDuringAfterInGivenStage: boolean,
  calledDuringAfterInWhenStage: boolean,
  calledDuringAfterInThenStage: boolean,
  calledDuringAfter: boolean,
  statePropagated: boolean,
};

class LifeCycleGivenStage extends BasicScenarioGivenStage {
  @State
  sideEffectRecorder: SideEffectRecorder = {
    calledDuringBeforeInGivenStage: false,
    calledDuringBeforeInWhenStage: false,
    calledDuringBeforeInThenStage: false,
    calledDuringBefore: false,
    calledDuringAfterInGivenStage: false,
    calledDuringAfterInWhenStage: false,
    calledDuringAfterInThenStage: false,
    calledDuringAfter: false,
    statePropagated: false,
  };

  a_scenario_with_3_stages_that_contain_a_method_with_the_before_annotation(): this {
    const self = this;

    class BeforeGivenStage extends Stage {
      @Before
      async before(): Promise<void> {
        self.sideEffectRecorder.calledDuringBeforeInGivenStage = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBeforeInGivenStage).to.be
          .true;
        return this;
      }
    }
    class BeforeWhenStage extends Stage {
      @Before
      before() {
        self.sideEffectRecorder.calledDuringBeforeInWhenStage = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBeforeInWhenStage).to.be
          .true;
        return this;
      }
    }
    class BeforeThenStage extends Stage {
      @Before
      before() {
        self.sideEffectRecorder.calledDuringBeforeInThenStage = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBeforeInThenStage).to.be
          .true;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      [BeforeGivenStage, BeforeWhenStage, BeforeThenStage],
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            given().ensure_before_method_has_been_called();
            when().ensure_before_method_has_been_called();
            then().ensure_before_method_has_been_called();
          }),
        };
      }
    );

    return this;
  }

  a_scenario_with_3_stages_including_a_before_method_and_a_shared_state(): this {
    const self = this;

    class BeforeGivenStage extends Stage {
      @Before
      async before(): Promise<void> {
        this.state = { modified: true };
      }

      @State state = { modified: false };
    }
    class BeforeWhenStage extends Stage {
      @State state;
      check_if_state_modification_has_been_propagated(): this {
        expect(this.state).to.deep.equal({ modified: true });
        if (this.state.modified === true) {
          self.sideEffectRecorder.statePropagated = true;
        }
        return this;
      }
    }

    class BeforeThenStage extends Stage {
      @State state;
      check_if_state_modification_has_been_propagated(): this {
        expect(this.state).to.deep.equal({ modified: true });
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      [BeforeGivenStage, BeforeWhenStage, BeforeThenStage],
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            when().check_if_state_modification_has_been_propagated();
            then().check_if_state_modification_has_been_propagated();
          }),
        };
      }
    );

    return this;
  }

  a_scenario_with_3_stages_that_contain_a_method_with_the_after_annotation(): this {
    const self = this;

    class AfterGivenStage extends Stage {
      @After
      async after(): Promise<void> {
        self.sideEffectRecorder.calledDuringAfterInGivenStage = true;
      }
      ensure_after_method_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfterInGivenStage).to.be
          .false;
        return this;
      }
    }
    class AfterWhenStage extends Stage {
      @After
      after() {
        self.sideEffectRecorder.calledDuringAfterInWhenStage = true;
      }
      ensure_after_method_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfterInWhenStage).to.be
          .false;
        return this;
      }
    }
    class AfterThenStage extends Stage {
      @After
      after() {
        self.sideEffectRecorder.calledDuringAfterInThenStage = true;
      }
      ensure_after_method_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfterInThenStage).to.be
          .false;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      [AfterGivenStage, AfterWhenStage, AfterThenStage],
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            given().ensure_after_method_has_not_been_called();
            when().ensure_after_method_has_not_been_called();
            then().ensure_after_method_has_not_been_called();
          }),
        };
      }
    );

    return this;
  }

  a_scenario_with_a_stage_that_contains_a_method_with_the_before_annotation(): this {
    const self = this;

    class BeforeStage extends Stage {
      @Before
      async before(): Promise<void> {
        self.sideEffectRecorder.calledDuringBefore = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBefore).to.be.true;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      BeforeStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then().ensure_before_method_has_been_called();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_contains_a_method_with_the_after_annotation(): this {
    const self = this;

    class AfterStage extends Stage {
      @After
      async after(): Promise<void> {
        self.sideEffectRecorder.calledDuringAfter = true;
      }
      ensure_after_method_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfter).to.be.false;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      AfterStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then().ensure_after_method_has_not_been_called();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_contains_an_around_method_with_the_around_annotation(): this {
    const self = this;

    class AroundStage extends Stage {
      @Around
      async around(test: () => Promise<void>): Promise<void> {
        self.sideEffectRecorder.calledDuringBefore = true;
        await test();
        self.sideEffectRecorder.calledDuringAfter = true;
      }
      ensure_before_part_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBefore).to.be.true;
        return this;
      }
      ensure_after_part_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfter).to.be.false;
        return this;
      }
    }

    this.scenarioRunner.scenarios(
      'group_name',
      AroundStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then()
              .ensure_before_part_has_been_called()
              .and()
              .ensure_after_part_has_not_been_called();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_contains_an_around_method_added_with_the_addProperty_method(): this {
    const self = this;

    class AroundStage extends Stage {
      async around(test: () => Promise<void>): Promise<void> {
        self.sideEffectRecorder.calledDuringBefore = true;
        await test();
        self.sideEffectRecorder.calledDuringAfter = true;
      }
      ensure_before_part_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBefore).to.be.true;
        return this;
      }
      ensure_after_part_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfter).to.be.false;
        return this;
      }
    }
    Around.addProperty(AroundStage, 'around');

    this.scenarioRunner.scenarios(
      'group_name',
      AroundStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then()
              .ensure_before_part_has_been_called()
              .and()
              .ensure_after_part_has_not_been_called();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_defines_an_around_method_on_a_non_method_property(): this {
    class AroundStage extends Stage {
      @Around around: string = 'ok';
    }

    this.scenarioRunner.scenarios(
      'group_name',
      AroundStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {}),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_defines_a_before_method_on_a_non_method_property(): this {
    class BeforeStage extends Stage {
      @Before before: string = 'ok';
    }

    this.scenarioRunner.scenarios(
      'group_name',
      BeforeStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {}),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_contains_a_before_method_added_with_addProperty_method(): this {
    const self = this;

    class BeforeStage extends Stage {
      async before(): Promise<void> {
        self.sideEffectRecorder.calledDuringBefore = true;
      }
      ensure_before_method_has_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringBefore).to.be.true;
        return this;
      }
    }
    Before.addProperty(BeforeStage, 'before');

    this.scenarioRunner.scenarios(
      'group_name',
      BeforeStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then().ensure_before_method_has_been_called();
          }),
        };
      }
    );
    return this;
  }

  a_scenario_with_a_stage_that_contains_an_after_method_added_with_addProperty_method(): this {
    const self = this;

    class AfterStage extends Stage {
      async after(): Promise<void> {
        self.sideEffectRecorder.calledDuringAfter = true;
      }
      ensure_after_method_has_not_been_called(): this {
        expect(self.sideEffectRecorder.calledDuringAfter).to.be.false;
        return this;
      }
    }
    After.addProperty(AfterStage, 'after');

    this.scenarioRunner.scenarios(
      'group_name',
      AfterStage,
      ({ given, when, then }) => {
        return {
          scenario_using_stages: scenario({}, () => {
            then().ensure_after_method_has_not_been_called();
          }),
        };
      }
    );
    return this;
  }
}

class LifeCycleThenStage extends BasicScenarioThenStage {
  @State sideEffectRecorder: SideEffectRecorder;
  @State errors: Error[] = [];

  the_methods_annotated_with_the_before_annotation_have_been_called_on_the_3_stages_before_the_scenario_execution(): this {
    expect(this.sideEffectRecorder.calledDuringBeforeInGivenStage).to.be.true;
    expect(this.sideEffectRecorder.calledDuringBeforeInWhenStage).to.be.true;
    expect(this.sideEffectRecorder.calledDuringBeforeInThenStage).to.be.true;
    return this;
  }

  the_methods_annotated_with_the_after_annotation_have_been_called_on_the_3_stages_before_the_scenario_execution(): this {
    expect(this.sideEffectRecorder.calledDuringAfterInGivenStage).to.be.true;
    expect(this.sideEffectRecorder.calledDuringAfterInWhenStage).to.be.true;
    expect(this.sideEffectRecorder.calledDuringAfterInThenStage).to.be.true;
    return this;
  }

  the_around_method_has_been_executed(): this {
    expect(this.sideEffectRecorder.calledDuringBefore).to.be.true;
    expect(this.sideEffectRecorder.calledDuringAfter).to.be.true;
    return this;
  }

  the_method_annotated_with_the_before_annotation_has_been_called_before_the_scenario_execution(): this {
    expect(this.sideEffectRecorder.calledDuringBefore).to.be.true;
    return this;
  }

  the_method_annotated_with_the_after_annotation_has_been_called_before_the_scenario_execution(): this {
    expect(this.sideEffectRecorder.calledDuringAfter).to.be.true;
    return this;
  }

  the_state_has_been_propagated_after_the_before_method_has_been_executed(): this {
    expect(this.sideEffectRecorder.statePropagated).to.be.true;
    return this;
  }

  @Quoted('error')
  the_error_$_is_reported(error: string): this {
    expect(this.errors).to.have.lengthOf(1);
    expect(this.errors[0].toString()).to.equal(error);
    return this;
  }
}

scenarios(
  'core.scenarios.life-cycle',
  [LifeCycleGivenStage, BasicScenarioWhenStage, LifeCycleThenStage],
  ({ given, when, then }) => {
    return {
      before_methods_can_be_defined_on_given_when_then_stage_classes: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_3_stages_that_contain_a_method_with_the_before_annotation();

          when().the_scenario_is_executed();

          then().the_methods_annotated_with_the_before_annotation_have_been_called_on_the_3_stages_before_the_scenario_execution();
        }
      ),

      before_methods_can_be_defined_on_a_single_stage: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .a_scenario_with_a_stage_that_contains_a_method_with_the_before_annotation();

        when().the_scenario_is_executed();

        then().the_method_annotated_with_the_before_annotation_has_been_called_before_the_scenario_execution();
      }),

      before_methods_can_be_defined_without_annotations: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .a_scenario_with_a_stage_that_contains_a_before_method_added_with_addProperty_method();

        when().the_scenario_is_executed();

        then().the_method_annotated_with_the_before_annotation_has_been_called_before_the_scenario_execution();
      }),

      after_methods_can_be_defined_on_given_when_then_stage_classes: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_3_stages_that_contain_a_method_with_the_after_annotation();

          when().the_scenario_is_executed();

          then().the_methods_annotated_with_the_after_annotation_have_been_called_on_the_3_stages_before_the_scenario_execution();
        }
      ),

      after_methods_can_be_defined_on_a_single_stage: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .a_scenario_with_a_stage_that_contains_a_method_with_the_after_annotation();

        when().the_scenario_is_executed();

        then().the_method_annotated_with_the_after_annotation_has_been_called_before_the_scenario_execution();
      }),

      after_methods_can_be_defined_without_annotations: scenario({}, () => {
        given()
          .a_scenario_runner()
          .and()
          .a_scenario_with_a_stage_that_contains_an_after_method_added_with_addProperty_method();

        when().the_scenario_is_executed();

        then().the_method_annotated_with_the_after_annotation_has_been_called_before_the_scenario_execution();
      }),

      state_annoted_fields_are_synchronized_to_other_stages_after_the_before_method_has_been_called: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_3_stages_including_a_before_method_and_a_shared_state();

          when().the_scenario_is_executed();

          then().the_state_has_been_propagated_after_the_before_method_has_been_executed();
        }
      ),

      around_methods_can_be_defined_on_a_single_stage_with_the_Around_annotation: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_a_stage_that_contains_an_around_method_with_the_around_annotation();

          when().the_scenario_is_executed();

          then().the_around_method_has_been_executed();
        }
      ),

      around_methods_can_be_defined_on_a_single_stage_with_the_addProperty_method: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_a_stage_that_contains_an_around_method_added_with_the_addProperty_method();

          when().the_scenario_is_executed();

          then().the_around_method_has_been_executed();
        }
      ),

      defining_an_around_method_on_a_property_that_is_not_a_method_is_reported_as_an_error: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_a_stage_that_defines_an_around_method_on_a_non_method_property();

          when().the_runner_tries_to_execute_the_scenario();

          then().the_error_$_is_reported(
            'Error: Property around is not a function on Stage'
          );
        }
      ),

      defining_a_before_method_on_a_property_that_is_not_a_method_is_reported_as_an_error: scenario(
        {},
        () => {
          given()
            .a_scenario_runner()
            .and()
            .a_scenario_with_a_stage_that_defines_a_before_method_on_a_non_method_property();

          when().the_runner_tries_to_execute_the_scenario();

          then().the_error_$_is_reported(
            'Error: Property before is not a function on Stage'
          );
        }
      ),
    };
  }
);

if (global.describe && global.it) {
  describe('life-cycle', () => {
    describe('aroundToBeforeAfter()', () => {
      it('should execute only "before" part when after() is not invoked', async () => {
        // Given
        const sideEffects = {
          inBefore: false,
          inAfter: false,
        };
        const around: AroundMethod = async test => {
          sideEffects.inBefore = true;
          await test();
          sideEffects.inAfter = true;
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        await beforeAfter.before();

        // then
        expect(sideEffects).to.deep.equal({ inBefore: true, inAfter: false });
      });

      it('should execute "after" part when after() is invoked', async () => {
        // Given
        const sideEffects = {
          inBefore: false,
          inAfter: false,
        };
        const around: AroundMethod = async test => {
          sideEffects.inBefore = true;
          await test();
          sideEffects.inAfter = true;
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        await beforeAfter.before();
        await beforeAfter.after();

        // then
        expect(sideEffects).to.deep.equal({ inBefore: true, inAfter: true });
      });

      it('an error occurring before calling test() should be reported in the before() call', async () => {
        // Given
        const around: AroundMethod = async test => {
          throw new Error('Failure');
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        const promise = beforeAfter.before();

        // then
        await expect(promise).to.be.rejected;
      });

      it('an error occurring after awaiting test() should be reported in the after() call', async () => {
        // Given
        const around: AroundMethod = async test => {
          await test();
          throw new Error('Failure');
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        await beforeAfter.before();
        const afterPromise = beforeAfter.after();

        // then
        await expect(afterPromise).to.be.rejected;
      });

      it('should reject invoking before() twice', async () => {
        // Given
        const around: AroundMethod = async test => {
          await test();
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        beforeAfter.before();
        const promise = beforeAfter.before();

        // then
        await expect(promise).to.be.rejected;
      });

      it('should reject invoking after() if before() has not been invoked', async () => {
        // Given
        const around: AroundMethod = async test => {
          await test();
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        const promise = beforeAfter.after();

        // then
        await expect(promise).to.be.rejected;
      });

      it('should reject invoking after() if before() has not been invoked and awaited', async () => {
        // Given
        const around: AroundMethod = async test => {
          await sleepPromise(0);
          await await test();
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        beforeAfter.before();
        const promise = beforeAfter.after();

        // then
        await expect(promise).to.be.rejected;
      });

      it('should reject invoking after() twice', async () => {
        // Given
        const around: AroundMethod = async test => {
          await test();
        };
        const beforeAfter = aroundToBeforeAfter(around);

        // when
        await beforeAfter.before();
        beforeAfter.after();
        const promise = beforeAfter.after();

        // then
        await expect(promise).to.be.rejected;
      });
    });
  });
}
