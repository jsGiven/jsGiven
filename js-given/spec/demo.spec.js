// @flow
import {expect} from 'chai';

import {
    scenarios,
    setupForRspec,
    setupForAva,
    parametrized,
    Stage,
} from '../src';


if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
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

scenarios('demo', DemoStage, ({given, when, then}) => {
    return {
        scenarios_can_be_parametrized: parametrized([1, 2, 3], (value) => {
            given().a_number(value).and().another_number(value);
            when().they_are_summed();
        }),
    };
});
