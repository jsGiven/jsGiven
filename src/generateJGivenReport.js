//@flow
import fs from 'fs';
import zlib from 'zlib';

import _ from 'lodash';
import maven from 'maven';
import rimraf from 'rimraf';
import DecompressZip from 'decompress-zip';

import {REPORTS_DESTINATION, ScenarioReport, ScenarioPart} from './reports';
import type {ReportModel} from './jgivenReport/ReportModel';
import type {ScenarioModel} from './jgivenReport/ScenarioModel';
import type {StepModel} from './jgivenReport/StepModel';

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

export function generateJGivenReportDataFiles(filter?: (fileName: string) => boolean = () => true, reportPrefix: string = '.') {
    const files = fs.readdirSync(`./${REPORTS_DESTINATION}`).filter(filter);
    const scenarioReports: ScenarioReport[] = files.map(file =>
        JSON.parse(fs.readFileSync(`${REPORTS_DESTINATION}/${file}`, 'utf-8')));
    const groupNamesAndScenarios: Array<[string, ScenarioReport[]]> =
        (Object.entries(_.groupBy(scenarioReports, ({groupReport: {name}}) => name)): any);
    const scenarioModels = groupNamesAndScenarios.map(([groupName, scenarioReports]) =>
        toReportModel(groupName, scenarioReports));

    const reportDir = `${reportPrefix}/jGiven-report`;

    fs.writeFileSync(`${reportDir}/data/metaData.js`, `jgivenReport.setMetaData({"created":"${new Date().toLocaleString()}","title":"J(s)Given Report","data":["data0.js"]} );\n`, 'utf-8');
    fs.writeFileSync(`${reportDir}/data/tags.js`, `jgivenReport.setTags({});\n`, 'utf-8');

    const json = JSON.stringify({scenarios: scenarioModels});
    const buffer = zlib.gzipSync(new Buffer(json, 'utf-8'));
    const base64 = buffer.toString('base64');
    fs.writeFileSync(`${reportDir}/data/data0.js`, `jgivenReport.addZippedScenarios('${base64}');\n`, 'utf-8');
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

function toReportModel(groupName: string, scenarioReports: ScenarioReport[]): ReportModel {
    return {
        className: groupName,
        description: groupName,
        name: groupName,
        scenarios: scenarioReports.map(toScenarioModel),
        tagMap: {},
    };
}

function toScenarioModel(scenarioReport: ScenarioReport, index: number): ScenarioModel {
    return {
        testMethodName: scenarioReport.name,
        tagIds: [],
        scenarioCases: [{
            caseNr: 0,
            derivedArguments: [],
            description: '',
            durationInNanos: 42,
            errorMessage: null,
            explicitParameters: [],
            explicitArguments: [],
            stackTrace: null,
            success: true,
            steps: _.flatMap(scenarioReport.parts, toSteps),
        }],
        casesAsTable: false,
        className: scenarioReport.groupReport.name,
        derivedParameters: [],
        description: scenarioReport.name,
        durationInNanos: 42,
        executionStatus: 'SUCCESS',
        explicitParameters: [],
        extendedDescription: '',
    };
}

function toSteps(scenarioPart: ScenarioPart): StepModel[] {
    return scenarioPart.steps.map(step => ({
        attachment: null,
        durationInNanos: 42,
        extendedDescription: '',
        isSectionTitle: false,
        name: step.name,
        nestedSteps: [],
        status: 'PASSED',
        words: step.words.map(word => ({
            ...(word.isIntroWord ? {isIntroWord: true} : {}),
            value: word.value,
        })),
    }));
}
