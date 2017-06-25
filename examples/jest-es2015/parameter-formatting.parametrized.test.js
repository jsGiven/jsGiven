import {
    scenario,
    scenarios,
    setupForRspec,
    Stage,
    buildParameterFormatter,
} from 'js-given';

import {sum} from './sum';

setupForRspec(describe, it);

// tag::CustomFormatterParametrized[]
const LoudFormatter = bangCharacter =>
    buildParameterFormatter(text => text.toUpperCase() + `${bangCharacter}`);

class MyStage extends Stage {
    @LoudFormatter('!')('value')
    a_value(value) {
        return this;
    }
}
// end::CustomFormatterParametrized[]

scenarios('parameter-formatting-parametrized', MyStage, ({given, when, then}) => {
    return {
        // tag::FormatterExample[]
        parameters_can_be_formatted: scenario({}, () => {
            given().a_value('hello world');
            // Will be converted to
            //   Given a value HELLO WORLD !!!

            when();

            then();
        }),
        // end::FormatterExample[]
    };
});
