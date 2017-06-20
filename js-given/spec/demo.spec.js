// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    parametrized2,
    Stage,
    Hidden,
} from '../src';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    // tag::setupForAva[]
    const test = require('ava');
    setupForAva(test);
    // end::setupForAva[]
}

class DemoStage extends Stage {
    number1: number;
    number2: number;
    result: number;

    a_number(value: number): this {
        this.number1 = value;
        return this;
    }

    another_number(value: number): this {
        this.number2 = value;
        return this;
    }

    they_are_summed(): this {
        this.result = this.number1 + this.number2;
        return this;
    }

    the_result_is(expectedResult: number): this {
        expect(this.result).to.equal(expectedResult);
        return this;
    }

    @Hidden
    aCompletelyHiddenStep(): this {
        return this;
    }
}

scenarios('jsgiven.demo', DemoStage, ({given, when, then}) => ({
    scenarios_can_be_parametrized: scenario(
        {},
        parametrized2([[1, 2], [2, 4], [3, 6]], (value, result) => {
            given().a_number(value).and().another_number(value);
            when().they_are_summed();
            then().the_result_is(result);
        })
    ),
    scenarios_can_have_hidden_steps: scenario({}, () => {
        given().a_number(1).and().another_number(2);
        when().they_are_summed();
        then().the_result_is(3).and().aCompletelyHiddenStep();
    }),
}));
