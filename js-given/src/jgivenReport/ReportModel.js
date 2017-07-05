//@flow
import type { ScenarioModel } from './ScenarioModel';
import type { Tag } from './Tag';

export type ReportModel = {
    /**
     * Full qualified name of the test class.
     */
    className: string,

    /**
     * An optional name to group scenarios
     */
    name: ?string,

    /**
     * An optional description of the test class.
     */
    description: ?string,

    scenarios: ScenarioModel[],

    tagMap: { [key: string]: Tag },
};
