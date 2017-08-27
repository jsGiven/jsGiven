// @flow
import babel from 'rollup-plugin-babel';

// eslint-disable-next-line
export default function buildConfig(
    // eslint-disable-next-line
    input /*: string*/,
    // eslint-disable-next-line
    file /*: string*/
) /*: Object*/ {
    return {
        input,
        plugins: [
            babel({
                babelrc: false,
                exclude: 'node_modules/**',
                presets: [
                    [
                        'env',
                        {
                            targets: {
                                node: '4.8',
                            },
                            modules: false,
                            exclude: ['transform-regenerator'],
                        },
                    ],
                ],
                plugins: [
                    'transform-decorators-legacy',
                    'transform-flow-strip-types',
                    'transform-class-properties',
                    'transform-object-rest-spread',
                    'transform-async-generator-functions',
                    'external-helpers',
                ],
            }),
        ],
        output: {
            file,
            format: 'cjs',
        },
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
            'strip-ansi',
        ],
    };
}
