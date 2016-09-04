// @flow
import {scenarios, setupForRspec, setupForAva, Stage} from '../index';
import {Step} from '../src/reports';

import {expect} from 'chai';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

class StepsStage extends Stage {
    step: Step;
    somethingWithToStringInstance: any;

    a_parametrized_step_with_$_methodName_and_$_argument(methodName: string, value: mixed): this {
        this.step = new Step(methodName, [value], false);
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

    a_parametrized_step_with_$_methodName_that_receives_an_argument_of_that_class(methodName: string): this {
        this.step = new Step(methodName, [this.somethingWithToStringInstance], false);
        return this;
    }

    the_parametrized_step_is_named_$(expectedName: string): this {
        expect(this.step.name).to.equal(expectedName);
        return this;
    }
}

scenarios('parametrized_steps', StepsStage, ({given, when, then}) => {
    return {
        basic_properties_can_be_used_as_parameters() {
            given().a_parametrized_step_with_$_methodName_and_$_argument('$_grams_of_flour', 500);
            then().the_parametrized_step_is_named_$('500 grams of flour');
        },

        arrays_can_be_used_as_parameters() {
            given().a_parametrized_step_with_$_methodName_and_$_argument('$_values', ['foo', 'bar']);
            then().the_parametrized_step_is_named_$(`["foo","bar"] values`);
        },

        objects_can_be_used_as_parameters() {
            given().a_parametrized_step_with_$_methodName_and_$_argument('$_object', {foo: true, bar: 'not'});
            then().the_parametrized_step_is_named_$(`{"foo":true,"bar":"not"} object`);
        },

        dollar_can_be_used_at_the_last_position() {
            given().a_parametrized_step_with_$_methodName_and_$_argument('before_$', 500);
            then().the_parametrized_step_is_named_$('before 500');
        },

        dollar_can_be_used_in_the_middle_position() {
            given().a_parametrized_step_with_$_methodName_and_$_argument('before_$_after', 500);
            then().the_parametrized_step_is_named_$('before 500 after');
        },

        two_dollar_signs_should_not_be_treated_as_a_placeholder() {
            given().a_parametrized_step_with_$_methodName_and_$_argument('many_$$', 500);
            then().the_parametrized_step_is_named_$('many $');
        },

        the_toString_method_should_be_used_when_present() {
            given().a_class_that_defines_a_toString_method_that_returns('customToString')
                .and().a_parametrized_step_with_$_methodName_that_receives_an_argument_of_that_class('do_something_with_$');
            then().the_parametrized_step_is_named_$('do something with customToString');
        },
    };
});
