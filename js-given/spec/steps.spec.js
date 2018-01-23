// @flow
import { expect } from 'chai';

import { scenarios, scenario, setupForRspec, setupForAva, Stage } from '../src';
import { wrapParameter, decodeParameter } from '../src/parametrized-scenarios';
import { Step } from '../src/reports';
import type { Formatter } from '../src/parameter-formatting';

if (global.describe && global.it) {
  setupForRspec(describe, it);
} else {
  const test = require('ava');
  setupForAva(test);
}

class StepsStage extends Stage {
  step: Step;
  somethingWithToStringInstance: any;

  a_parametrized_step_with_$_methodName_and_$_arguments(
    methodName: string,
    ...values: mixed[]
  ): this {
    this.step = new Step(
      methodName,
      values.map((value, index) =>
        decodeParameter(value, `parameter_${index}`, [])
      ),
      false,
      null,
      'PASSED',
      0
    );
    return this;
  }

  a_parametrized_step_with_$_methodName_$_argument_and_$_formatter(
    methodName: string,
    value: mixed,
    formatter: Formatter
  ): this {
    this.step = new Step(
      methodName,
      [
        decodeParameter(
          wrapParameter(value, 'parameterName'),
          'parameterName',
          [formatter]
        ),
      ],
      false,
      null,
      'PASSED',
      0
    );
    return this;
  }

  a_parametrized_step_with_$_methodName_and_$_argument_and_$_parameter_name(
    methodName: string,
    argument: mixed,
    parameterName: string
  ): this {
    this.step = new Step(
      methodName,
      [
        decodeParameter(
          wrapParameter(argument, parameterName),
          parameterName,
          []
        ),
      ],
      false,
      null,
      'PASSED',
      0
    );
    return this;
  }

  a_class_that_defines_a_toString_method_that_returns(text: string): this {
    class SomethingWithToString {
      toString(): string {
        return text;
      }
    }
    this.somethingWithToStringInstance = new SomethingWithToString();
    return this;
  }

  a_parametrized_step_with_$_methodName_that_receives_an_argument_of_that_class(
    methodName: string
  ): this {
    this.step = new Step(
      methodName,
      [
        decodeParameter(
          this.somethingWithToStringInstance,
          'parameterName',
          []
        ),
      ],
      false,
      null,
      'PASSED',
      0
    );
    return this;
  }

  a_step_with_$_methodName_and_$_intro_word(
    methodName: string,
    introWord: string
  ): this {
    this.step = new Step(methodName, [], false, introWord, 'PASSED', 0);
    return this;
  }

  a_step_with_$_methodName_and_no_intro_word(methodName: string): this {
    this.step = new Step(methodName, [], false, null, 'PASSED', 0);
    return this;
  }

  the_step_is_named_$(expectedName: string): this {
    expect(this.step.name).to.equal(expectedName);
    return this;
  }

  it_contains_the_words(...words: string[]): this {
    expect(this.step.words.map(({ value }) => value)).to.deep.equal(words);
    return this;
  }

  only_its_first_word_is_an_intro_word(): this {
    const [firstWord, ...otherWords] = this.step.words;
    expect(firstWord.isIntroWord).to.be.true;
    otherWords.forEach(otherWord => expect(otherWord.isIntroWord).to.be.false);
    return this;
  }

  it_does_not_contain_any_intro_word(): this {
    const { words } = this.step;
    words.forEach(word => expect(word.isIntroWord).to.be.false);
    return this;
  }

  the_word_$_has_its_parameter_named_$(
    wordName: string,
    scenarioParameterName: string
  ): this {
    const { words } = this.step;
    const wordFound = words.find(word => word.value === wordName);
    expect(wordFound).to.be.exist;

    if (wordFound) {
      expect(wordFound.scenarioParameterName).to.equal(scenarioParameterName);
    }
    return this;
  }
}

scenarios('core.steps', StepsStage, ({ given, when, then }) => ({
  intro_words_can_be_used: scenario({}, () => {
    given().a_step_with_$_methodName_and_$_intro_word('an_object', 'given');
    then()
      .the_step_is_named_$('given an object')
      .and()
      .it_contains_the_words('given', 'an object')
      .and()
      .only_its_first_word_is_an_intro_word();
  }),

  intro_words_are_not_necessary: scenario({}, () => {
    given().a_step_with_$_methodName_and_no_intro_word('an_object');
    then()
      .the_step_is_named_$('an object')
      .and()
      .it_contains_the_words('an object')
      .and()
      .it_does_not_contain_any_intro_word();
  }),
}));

scenarios('core.steps', StepsStage, ({ given, when, then }) => {
  return {
    basic_properties_can_be_used_as_parameters: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_and_$_arguments(
        '$_grams_of_flour',
        500
      );
      then()
        .the_step_is_named_$('500 grams of flour')
        .and()
        .it_contains_the_words('500', 'grams of flour');
    }),

    arrays_can_be_used_as_parameters: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_and_$_arguments(
        '$_values',
        ['foo', 'bar']
      );
      then()
        .the_step_is_named_$(`["foo","bar"] values`)
        .and()
        .it_contains_the_words('["foo","bar"]', 'values');
    }),

    objects_can_be_used_as_parameters: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_and_$_arguments(
        '$_object',
        { foo: true, bar: 'not' }
      );
      then()
        .the_step_is_named_$(`{"foo":true,"bar":"not"} object`)
        .and()
        .it_contains_the_words('{"foo":true,"bar":"not"}', 'object');
    }),

    parameters_can_be_formatted_with_a_customer_formatter: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_$_argument_and_$_formatter(
        '$_value',
        1337,
        x => `"${x}"`
      );
      then()
        .the_step_is_named_$(`"1337" value`)
        .and()
        .it_contains_the_words('"1337"', 'value');
    }),

    parameters_can_be_formatted_with_a_customer_formatter_that_returns_an_empty_string: scenario(
      {},
      () => {
        given().a_parametrized_step_with_$_methodName_$_argument_and_$_formatter(
          '$_value',
          1337,
          x => ''
        );
        then()
          .the_step_is_named_$(`value`)
          .and()
          .it_contains_the_words('value');
      }
    ),

    dollar_can_be_used_at_the_last_position: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_and_$_arguments(
        'before_$',
        500
      );
      then()
        .the_step_is_named_$('before 500')
        .and()
        .it_contains_the_words('before', '500');
    }),

    dollar_can_be_used_in_the_middle_position: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_and_$_arguments(
        'before_$_after',
        500
      );
      then()
        .the_step_is_named_$('before 500 after')
        .and()
        .it_contains_the_words('before', '500', 'after');
    }),

    two_dollar_signs_should_not_be_treated_as_a_placeholder: scenario(
      {},
      () => {
        given().a_parametrized_step_with_$_methodName_and_$_arguments(
          'many_$$'
        );
        then()
          .the_step_is_named_$('many $')
          .and()
          .it_contains_the_words('many $');
      }
    ),

    the_toString_method_should_be_used_when_present: scenario({}, () => {
      given()
        .a_class_that_defines_a_toString_method_that_returns('customToString')
        .and()
        .a_parametrized_step_with_$_methodName_that_receives_an_argument_of_that_class(
          'do_something_with_$'
        );
      then()
        .the_step_is_named_$('do something with customToString')
        .and()
        .it_contains_the_words('do something with', 'customToString');
    }),

    objects_passed_at_the_last_position_are_automatically_appended_even_if_there_is_no_dollar_sign: scenario(
      {},
      () => {
        given().a_parametrized_step_with_$_methodName_and_$_arguments(
          'before',
          500,
          600
        );
        then()
          .the_step_is_named_$('before 500 600')
          .and()
          .it_contains_the_words('before', '500', '600');
      }
    ),

    parameter_names_are_contained_in_words: scenario({}, () => {
      given().a_parametrized_step_with_$_methodName_and_$_argument_and_$_parameter_name(
        '$_grams_of_flour',
        500,
        'flourQuantity'
      );
      then()
        .the_step_is_named_$('500 grams of flour')
        .and()
        .the_word_$_has_its_parameter_named_$('500', 'flourQuantity');
    }),
  };
});
