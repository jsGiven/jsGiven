//@flow

type TagValue = string | string[];

/**
 * A tag represents an annotation of a scenario-test.
 */
export type Tag = {
    /**
    * The type of the annotation of the tag
    */
    +type: string,

    /**
    * An optional name of the tag. If not set, the type is the name
    */
    +name: ?string,

    /**
    * An optional value
    */
    +value: ?TagValue,

    /**
    * An optional description.
    */
    +description: ?string,

    /**
    * Whether the type should be prepended in the report.
    * <p>
    * Is either {@code true} or {@code null}
    */
    +prependType: ?boolean,

    /**
    * An optional color that is used in reports
    */
    +color: ?string,

    /**
    * An optional cssClass used in the HTML report.
    * Can be {@code null}.
    */
    +cssClass: ?string,

    /**
    * An optional style used in the HTML report.
    * Can be {@code null}.
    */
    +style: ?string,

    /**
    * An optional (maybe null) list of tags that this tag is tagged with.
    * The tags are normalized as follows: <name>[-value].
    */
    +tags: ?string,

    /**
    * An optional href used in the HTML report.
    * Can be {@code null}.
    */
    +href: ?string,
};
