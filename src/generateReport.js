//@flow
import fs from 'fs';

import maven from 'maven';
import rimraf from 'rimraf';
import DecompressZip from 'decompress-zip';

const JGIVEN_APP_VERSION = '0.11.4';

export default async function start(): Promise<void> {
    await installJGivenReportApp();
}

async function installJGivenReportApp(): Promise<void> {
    await removeDir('./jGiven-report');
    fs.mkdirSync('./jGiven-report');

    const mvn = maven.create();
    await mvn.execute('org.apache.maven.plugins:maven-dependency-plugin:2.10:copy', {
        repoUrl: 'http://download.java.net/maven/2/',
        outputDirectory: './jGiven-report',
        artifact: `com.tngtech.jgiven:jgiven-html5-report:${JGIVEN_APP_VERSION}`,
        'mdep.useBaseVersion': 'true',
        overWrite: 'true',
    });

    await unzip(`./jGiven-report/jgiven-html5-report-${JGIVEN_APP_VERSION}.jar`,
        './jGiven-report');
    await unzip('./jGiven-report/com/tngtech/jgiven/report/html5/app.zip',
        './jGiven-report');

    await removeDir('./jGiven-report/META-INF');
    await removeDir('./jGiven-report/com');
    await removeDir(`./jGiven-report/jgiven-html5-report-${JGIVEN_APP_VERSION}.jar`);

    console.log('Done installing JGiven report app');
}

function removeDir(dir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        rimraf(dir, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

function unzip(zipFile: string, targetDirectory: string): Promise<void> {
    return new Promise((resolve, reject) => {
        var unzipper = new DecompressZip(zipFile);

        unzipper.on('error', (err) => {
            console.log('Caught an error');
            reject(err);
        });

        unzipper.on('extract', (log) => {
            console.log(`Finished extracting: ${zipFile} to ${targetDirectory}`);
            resolve();
        });

        unzipper.extract({
            path: targetDirectory,
        });
    });
}
