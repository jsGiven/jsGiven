// @flow
import {expect} from 'chai';

import {
    scenario,
    scenarios,
    setupForRspec,
    setupForAva,
    parametrized2,
    Stage,
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
}

scenarios('jsgiven.demo', DemoStage, ({given, when, then}) => {
    return {
        scenarios_can_be_parametrized: scenario(
            {},
            parametrized2([[1, 2], [2, 4], [3, 6]], (value, result) => {
                given().a_number(value).and().another_number(value);
                when().they_are_summed();
                then().the_result_is(result);
            })
        ),
    };
});
