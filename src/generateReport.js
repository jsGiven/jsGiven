//@flow
import fs from 'fs';
import zlib from 'zlib';

import _ from 'lodash';
import maven from 'maven';
import rimraf from 'rimraf';
import DecompressZip from 'decompress-zip';

import {REPORTS_DESTINATION, ScenarioReport} from './reports';
import type {ScenarioModel} from './jgivenReport/ScenarioModel';
import type {ScenarioCaseModel} from './jgivenReport/ScenarioCaseModel';

export const JGIVEN_APP_VERSION = '0.12.1';

export default async function start(): Promise<void> {
    await installJGivenReportApp();
    generateJGivenReportDataFiles();
}

export async function installJGivenReportApp(reportPrefix: string = '.'): Promise<void> {
    const reportDir = `${reportPrefix}/jGiven-report`;

    await removeDir(reportDir);
    fs.mkdirSync(reportDir);
    fs.mkdirSync(`${reportDir}/data`);

    const mvn = maven.create();
    await mvn.execute('org.apache.maven.plugins:maven-dependency-plugin:2.10:copy', {
        repoUrl: 'http://download.java.net/maven/2/',
        outputDirectory: reportDir,
        artifact: `com.tngtech.jgiven:jgiven-html5-report:${JGIVEN_APP_VERSION}`,
        'mdep.useBaseVersion': 'true',
        overWrite: 'true',
    });

    await unzip(`${reportDir}/jgiven-html5-report-${JGIVEN_APP_VERSION}.jar`,
        reportDir);
    await unzip(`${reportDir}/com/tngtech/jgiven/report/html5/app.zip`,
        reportDir);

    await removeDir(`${reportDir}/META-INF`);
    await removeDir(`${reportDir}/com`);
    await removeDir(`${reportDir}/jgiven-html5-report-${JGIVEN_APP_VERSION}.jar`);

    console.log('Done installing JGiven report app');
}

export function generateJGivenReportDataFiles(filter?: (fileName: string) => boolean = () => true) {
    const files = fs.readdirSync(`./${REPORTS_DESTINATION}`).filter(filter);
    const scenarioReports: ScenarioReport[] = files.map(file =>
        JSON.parse(fs.readFileSync(`${REPORTS_DESTINATION}/${file}`, 'utf-8')));
    const groupNamesAndScenarios: Array<[string, ScenarioReport[]]> =
        (Object.entries(_.groupBy(scenarioReports, ({groupReport: {name}}) => name)): any);
    const scenarioModels = groupNamesAndScenarios.map(([groupName, scenarioReports]) =>
        toScenarioModel(groupName, scenarioReports));

    fs.writeFileSync('./jGiven-report/data/metaData.js', `jgivenReport.setMetaData({"created":"${new Date().toLocaleString()}","title":"J(s)Given Report","data":["data0.js"]} );\n`, 'utf-8');
    fs.writeFileSync('./jGiven-report/data/tags.js', `jgivenReport.setTags({});\n`, 'utf-8');

    const json = JSON.stringify({scenarios: scenarioModels});
    const buffer = zlib.gzipSync(new Buffer(json, 'utf-8'));
    const base64 = buffer.toString('base64');
    fs.writeFileSync('./jGiven-report/data/data0.js', `jgivenReport.addZippedScenarios('${base64}');\n`, 'utf-8');
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

function toScenarioModel(groupName: string, scenarioReports: ScenarioReport[]): ScenarioModel {
    return {
        executionStatus: 'SUCCESS',
        casesAsTable: false,
        derivedParameters: [],
        description: '',
        durationInNanos: 42,
        explicitParameters: [],
        extendedDescription: '',
        tagIds: [],
        className: groupName,
        scenarioCases: scenarioReports.map(toScenarioCaseModel),
        testMethodName: groupName,
    };
}

function toScenarioCaseModel(scenarioReport: ScenarioReport, index: number): ScenarioCaseModel {
    return {
        caseNr: index,
        derivedArguments: [],
        description: scenarioReport.name,
        durationInNanos: 42,
        errorMessage: null,
        explicitArguments: [],
        stackTrace: null,
        steps: [],
        success: true,
    };
}
