import {
  scenario,
  scenarios,
  setupForRspec,
  Stage,
  buildParameterFormatter,
  Quoted,
  QuotedWith,
  NotFormatter,
} from 'js-given';

import { sum } from './sum';

setupForRspec(describe, it);

class QuotedStage extends Stage {
  @Quoted('message')
  the_message_$_is_printed_to_the_console(message) {
    return this;
  }
}

scenarios(
  'parameter-formatting-default-quoted',
  QuotedStage,
  ({ given, when, then }) => {
    return {
      parameters_can_be_formatted: scenario({}, () => {
        given();

        when();

        then().the_message_$_is_printed_to_the_console('hello world');
      }),
    };
  }
);

class QuotedWithStage extends Stage {
  @QuotedWith("'")('message')
  the_message_$_is_printed_to_the_console(message) {
    return this;
  }
}

scenarios(
  'parameter-formatting-default-quoted-with',
  QuotedWithStage,
  ({ given, when, then }) => {
    return {
      parameters_can_be_formatted: scenario({}, () => {
        given();

        when();

        then().the_message_$_is_printed_to_the_console('hello world');
      }),
    };
  }
);

class NotFormatterStage extends Stage {
  @NotFormatter('present')
  the_message_is_$_displayed_to_the_user(present) {
    return this;
  }
}

scenarios(
  'parameter-formatting-default-not-formatter',
  NotFormatterStage,
  ({ given, when, then }) => {
    return {
      parameters_can_be_formatted: scenario({}, () => {
        given();

        when();

        then().the_message_is_$_displayed_to_the_user(true);

        then().the_message_is_$_displayed_to_the_user(false);
      }),
    };
  }
);
