// @flow
import babel from 'rollup-plugin-babel';

// eslint-disable-next-line
export default function buildConfig(
    // eslint-disable-next-line
    entry /*: string*/,
    // eslint-disable-next-line
    dest /*: string*/
) /*: Object*/ {
    return {
        entry,
        format: 'cjs',
        plugins: [
            babel({
                babelrc: false,
                exclude: 'node_modules/**',
                presets: [[
                    'env',
                    {
                        targets: {
                            node: "4.8",
                        },
                        modules: false,
                    },
                ]],
                plugins: [
                    'transform-decorators-legacy',
                    'transform-flow-strip-types',
                    'transform-class-properties',
                    'transform-object-rest-spread',
                    'external-helpers',
                ],
            }),
        ],
        dest,
        external: [
            'lodash',
            'string-humanize',
            'retrieve-arguments',
            'fs',
            'crypto',
            'babel-polyfill',
            'yargs',
            'zlib',
            'decompress-zip',
            'fs-extra',
            'rimraf',
        ],
    };
}
