// @flow

import type { ScenarioCaseModel } from './ScenarioCaseModel';

type ExecutionStatus =
    | 'SCENARIO_PENDING'
    | 'SUCCESS'
    | 'FAILED'
    | 'SOME_STEPS_PENDING';

export type ScenarioModel = {
    className: string,
    testMethodName: string,
    description: ?string,
    extendedDescription: ?string,
    /**
     * A list of tag ids
     */
    tagIds: string[],
    explicitParameters: string[],
    derivedParameters: string[],
    casesAsTable: boolean,
    scenarioCases: ScenarioCaseModel[],
    durationInNanos: number,
    executionStatus: ExecutionStatus,
};
