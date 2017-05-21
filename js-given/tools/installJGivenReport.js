// @flow
var https = require('https');
var fs = require('fs');

var jGivenVersion = '0.12.1';

var jgivenFile = 'jgiven-html5-report.jar';
var jgivenURL = 'https://repo1.maven.org/maven2/com/tngtech/jgiven/jgiven-html5-report/' + jGivenVersion + '/jgiven-html5-report-' + jGivenVersion + '.jar';

console.log('Downloading JGiven ' + jGivenVersion);

var file = fs.createWriteStream(jgivenFile);
// eslint-disable-next-line flowtype/require-parameter-type
https.get(jgivenURL, function (response/*: any*/) {
    if (response.statusCode >= 400) {
        throw new Error('Invalid response : received a ' + response.statusCode + ' error for ' + jgivenURL);
    }
    console.log('Received: ' + response.statusCode + ' response for ' + jgivenURL);

    response.pipe(file);
    response.on('data', function () {
        process.stdout.write('.');
    });
    response.on('end', function () {
        console.log();
        console.log('Done downloading JGiven ' + jGivenVersion);
    });
});
