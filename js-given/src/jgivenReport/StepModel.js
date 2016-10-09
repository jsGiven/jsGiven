// @flow
import type {AttachmentModel} from './AttachmentModel';
import type {Word} from './Word';

type StepStatus = 'PASSED'
    | 'FAILED'
    | 'SKIPPED'
    | 'PENDING';

export type StepModel = {
    /**
     * The original name of this step as it appeared in the Java code.
     */
    name: string;

    /**
     * All words of this step including the introduction word.
     */
    words: Word[];

    /**
     * An optional list of nested steps
     * Can be {@code null}
     */
    nestedSteps: StepModel[];

    /**
     * The execution status of this step.
     */
    status: StepStatus;

    /**
     * The total execution time of the step in nano seconds.
     */
    durationInNanos: number;

    /**
     * An optional extended description of this step.
     * Can be {@code null}
     */
    extendedDescription: ?string;

    /**
     * An optional attachment of the step
     */
    attachment: ?AttachmentModel;

    /**
     * Whether this step is a section title.
     * Section titles look differently in the generated report.
     * Can be {@code null} which is equivalent to {@code false}
     *
     * @since 0.10.2
     */
    isSectionTitle: ?boolean;
}
