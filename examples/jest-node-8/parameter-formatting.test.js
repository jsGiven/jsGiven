import {
    scenario,
    scenarios,
    setupForRspec,
    Stage,
    buildParameterFormatter,
} from 'js-given';

import { sum } from './sum';

setupForRspec(describe, it);

const LoudFormatter = buildParameterFormatter(
    text => text.toUpperCase() + ' !!!'
);

class MyStage extends Stage {
    @LoudFormatter('value')
    a_value(value) {
        return this;
    }
}

scenarios('parameter-formatting', MyStage, ({ given, when, then }) => {
    return {
        parameters_can_be_formatted: scenario({}, () => {
            given().a_value('hello world');
            // Will be converted to
            //   Given a value HELLO WORLD !!!

            when();

            then();
        }),
    };
});
