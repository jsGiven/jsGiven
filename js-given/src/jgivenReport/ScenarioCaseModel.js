// @flow
import type { StepModel } from './StepModel';

export type ScenarioCaseModel = {
    /**
    * The number of the case starting with 0
    */
    caseNr: number,

    /**
    * The steps of this case
    */
    steps: StepModel[],

    /**
    * The arguments that have been explicitly passed to a scenario test.
    * These arguments only appear in a report if there are multiple cases
    * and no data table could be written.
    */
    explicitArguments: string[],

    /**
    * Derived arguments are arguments that used as arguments to step methods.
    * These need not to be the same as the explicit arguments.
    * However, typically they are somehow derived from them.
    * For data tables only the derived arguments are used, because
    * these are the only visible arguments.
    */
    derivedArguments: string[],

    success: boolean,

    /**
    * An optional error message.
    * Can be {@code null}
    */
    errorMessage: ?string,

    /**
    * An optional stack trace if an exception was thrown.
    * Can be {@code null}
    */
    stackTrace: ?(string[]),

    /**
    * The total execution time of the whole case in nanoseconds.
    */
    durationInNanos: number,

    /**
    * An optional description of the case.
    * Can be {@code null}
    */
    description: ?string,
};
