// @flow
var https = require('https');
var fs = require('fs');
var crypto = require('crypto');

var shasum = crypto.createHash('sha1');

var jGivenVersion = '0.15.1';
// Should match : https://repo1.maven.org/maven2/com/tngtech/jgiven/jgiven-html-app/0.15.1/jgiven-html-app-0.15.1.jar.sha1
var expectedSha1 = '4e34aee571bc4136cd05ca2a34ccef42c56c2bed';

var jgivenFile = 'jgiven-html5-report.jar';
var jgivenURL = 'https://repo1.maven.org/maven2/com/tngtech/jgiven/jgiven-html-app/' + jGivenVersion + '/jgiven-html-app-' + jGivenVersion + '.jar';

console.log('Downloading JGiven ' + jGivenVersion);

var file = fs.createWriteStream(jgivenFile);
// eslint-disable-next-line flowtype/require-parameter-type
https.get(jgivenURL, function (response/*: any*/) {
    if (response.statusCode >= 400) {
        throw new Error('Invalid response : received a ' + response.statusCode + ' error for ' + jgivenURL);
    }
    console.log('Received: ' + response.statusCode + ' response for ' + jgivenURL);

    response.pipe(file);
    // eslint-disable-next-line flowtype/require-parameter-type
    response.on('data', function (data/*: Buffer*/) {
        process.stdout.write('.');
        shasum.update(data);
    });
    response.on('end', function () {
        console.log();
        console.log('Done downloading JGiven ' + jGivenVersion);

        var sha1 = shasum.digest('hex');
        if (sha1 === expectedSha1) {
            console.log('SHA1: ' + sha1 + " matches expected SHA1 value");
        } else {
            throw new Error('Invalid SHA1: expected SHA1 value ' + expectedSha1 + ' while downloaded file has SHA1 value ' + sha1);
        }
    });
});
