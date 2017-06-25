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

import {sum} from './sum';

setupForRspec(describe, it);

class QuotedStage extends Stage {
    // tag::QuotedExample[]
    @Quoted('message')
    the_message_$_is_printed_to_the_console(message) {
        return this;
    }
    // end::QuotedExample[]
}

scenarios(
    'parameter-formatting-default-quoted',
    QuotedStage,
    ({given, when, then}) => {
        return {
            parameters_can_be_formatted: scenario({}, () => {
                given();

                when();

                // tag::QuotedExampleUse[]
                then().the_message_$_is_printed_to_the_console('hello world');
                // end::QuotedExampleUse[]
            }),
        };
    }
);

class QuotedWithStage extends Stage {
    // tag::QuotedWithExample[]
    @QuotedWith("'")('message')
    the_message_$_is_printed_to_the_console(message) {
        return this;
    }
    // end::QuotedWithExample[]
}

scenarios(
    'parameter-formatting-default-quoted-with',
    QuotedWithStage,
    ({given, when, then}) => {
        return {
            parameters_can_be_formatted: scenario({}, () => {
                given();

                when();

                // tag::QuotedWithExampleUse[]
                then().the_message_$_is_printed_to_the_console('hello world');
                // end::QuotedWithExampleUse[]
            }),
        };
    }
);

class NotFormatterStage extends Stage {
    // tag::FormatterExample[]
    @NotFormatter('present')
    the_message_is_$_displayed_to_the_user(present) {
        return this;
    }
    // end::FormatterExample[]
}

scenarios(
    'parameter-formatting-default-not-formatter',
    NotFormatterStage,
    ({given, when, then}) => {
        return {
            parameters_can_be_formatted: scenario({}, () => {
                given();

                when();

                // tag::FormatterExampleUseTrue[]
                then().the_message_is_$_displayed_to_the_user(true);
                // end::FormatterExampleUseTrue[]

                // tag::FormatterExampleUseFalse[]
                then().the_message_is_$_displayed_to_the_user(false);
                // end::FormatterExampleUseFalse[]
            }),
        };
    }
);
