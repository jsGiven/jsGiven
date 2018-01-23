// @flow
import { Stage, Hidden, scenarios, scenario } from '../index.js';

class SingleStage extends Stage {
  @Hidden
  someHiddenStep(): this {
    return this;
  }

  someOtherHiddenStep(): this {
    return this;
  }
}

// $ExpectError
Hidden.addHiddenStep();

// $ExpectError
Hidden.addHiddenStep(SingleStage);

Hidden.addHiddenStep(SingleStage, 'someOtherHiddenStep');

scenarios('group.name', SingleStage, ({ given, when, then }) => ({
  a_scenario: scenario({}, () => {
    given().someHiddenStep();
    when().someOtherHiddenStep();
  }),
}));
