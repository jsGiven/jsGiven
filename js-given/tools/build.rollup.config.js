// @flow
import babel from 'rollup-plugin-babel';

// eslint-disable-next-line
export default function buildConfig(entry /*: string*/, dest/*: string*/) /*: Object*/ {
    return {
        entry,
        format: 'cjs',
        plugins: [ babel({
            babelrc: false,
            exclude: 'node_modules/**',
            presets: ['es2015-rollup'],
            plugins: ["transform-decorators-legacy", "transform-flow-strip-types", "transform-class-properties", "transform-object-rest-spread", "transform-regenerator"],
        }) ],
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
