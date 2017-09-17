// @flow
export type TagValue = string | string[];

export type Tag = {
    (...values: string[]): Tag,
    +tagDescriptionGenerator: (tag: TagConfiguration, value: string) => string,
} & TagConfiguration;

export type TagConfiguration = {
    +tagName: string,
    +description: string,
    +values: string[],
    +parentTags: Tag[],
    +prependName: boolean,
};

type BuildTagOptions = {
    description: string,
    style: string,
    values: string[],
    parentTags: Tag[],
    prependName: boolean,
    tagDescriptionGenerator: (tag: TagConfiguration, value: string) => string,
};
export function buildTag(
    tagName: string,
    {
        description = '',
        style = '',
        values = [],
        parentTags = [],
        prependName = false,
        tagDescriptionGenerator = ({ description }) => description,
    }: $Shape<BuildTagOptions> = {}
): Tag {
    const tag = (...values: string[]) => {
        const buildTagOptions: BuildTagOptions = {
            description,
            style,
            values,
            parentTags,
            prependName,
            tagDescriptionGenerator,
        };
        return buildTag(tagName, buildTagOptions);
    };
    tag.tagName = tagName;
    tag.description = tag.description;
    tag.values = values;
    tag.parentTags = parentTags;
    tag.prependName = prependName;
    tag.tagDescriptionGenerator = tagDescriptionGenerator;

    return tag;
}
