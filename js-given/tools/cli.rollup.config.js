// @flow
import babel from 'rollup-plugin-babel';

export default {
    entry: './src/cli.js',
    format: 'cjs',
    plugins: [ babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: ['es2015-rollup'],
        plugins: ["transform-decorators-legacy", "transform-flow-strip-types", "transform-class-properties", "transform-object-rest-spread", "transform-regenerator"],
    }) ],
    dest: 'dist/cli.js',
};
