// @flow
import babel from 'rollup-plugin-babel';

export default {
    entry: 'generateReport.js',
    format: 'cjs',
    plugins: [ babel() ],
    dest: 'dist/generateReport.js',
};
