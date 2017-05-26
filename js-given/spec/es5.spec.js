// @flow
import { expect } from 'chai';

import {
    scenarios,
    setupForRspec,
    setupForAva,
    Stage,
} from '../src';

if (global.describe && global.it) {
    setupForRspec(describe, it);
} else {
    const test = require('ava');
    setupForAva(test);
}

function DemoStage() {
}

DemoStage.prototype = {
    a_number(value: number): DemoStage {
        this.number1 = value;
        return this;
    },

    another_number(value: number): DemoStage {
        this.number2 = value;
        return this;
    },

    they_are_summed(): DemoStage {
        this.result = this.number1 + this.number2;
        return this;
    },

    the_result_is(expectedResult: number): DemoStage {
        expect(this.result).to.equal(expectedResult);
        return this;
    },
};

Stage.addExtension(DemoStage);

scenarios('core.support.es5', DemoStage, ({ given, when, then }) => {
    return {
        scenarios_can_use_es5_stage_classes() {
            given().a_number(1).and().another_number(1);
            when().they_are_summed();
            then().the_result_is(2);
        },
    };
});
