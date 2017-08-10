//@flow
import fs from 'fs';
import zlib from 'zlib';

import _ from 'lodash';
import DecompressZip from 'decompress-zip';
import fse from 'fs-extra';
import rimraf from 'rimraf';

import { ScenarioReport, ScenarioPart, REPORTS_DESTINATION } from './reports';
import type { ReportModel } from './jgivenReport/ReportModel';
import type { ScenarioModel } from './jgivenReport/ScenarioModel';
import type { StepModel } from './jgivenReport/StepModel';

export async function generateJGivenReport(fail: boolean): Promise<void> {
    try {
        if (!directoryExists(`./${REPORTS_DESTINATION}`)) {
            console.log(
                'No jsGiven reports found, skipping jgiven report generation'
            );
            return;
        }

        await installJGivenReportApp();
        generateJGivenReportDataFiles();

        console.log(`jsGiven report available in ./jGiven-report`);
    } catch (error) {
        console.log(error);
        process.exit(-1);
    }

    if (fail) {
        process.exit(1);
    }
}

export async function cleanReports(): Promise<void> {
    try {
        await removeDir(`./${REPORTS_DESTINATION}`);
    } catch (error) {
        console.log(error);
        process.exit(-1);
    }
}

export async function installJGivenReportApp(
    reportPrefix: string = '.'
): Promise<void> {
    const reportDir = `${reportPrefix}/jGiven-report`;

    await removeDir(reportDir);
    fs.mkdirSync(reportDir);
    fs.mkdirSync(`${reportDir}/data`);

    let jarFile = './jgiven-html5-report.jar';
    if (!fileExists(jarFile)) {
        jarFile = 'node_modules/js-given/jgiven-html5-report.jar';
        if (!fileExists(jarFile)) {
            throw new Error('jgiven html 5 report not found');
        }
    }
    fse.copySync(jarFile, `${reportDir}/jgiven-html5-report.jar`);

    await unzip(`${reportDir}/jgiven-html5-report.jar`, reportDir);
    await unzip(
        `${reportDir}/com/tngtech/jgiven/report/html5/app.zip`,
        reportDir
    );

    await removeDir(`${reportDir}/META-INF`);
    await removeDir(`${reportDir}/com`);
    await removeDir(`${reportDir}/jgiven-html5-report.jar`);
}

function fileExists(fileName: string): boolean {
    try {
        return fs.statSync(fileName).isFile();
    } catch (error) {
        return false;
    }
}

function directoryExists(dirName: string): boolean {
    try {
        return fs.statSync(dirName).isDirectory();
    } catch (error) {
        return false;
    }
}

export function generateJGivenReportDataFiles(
    filter?: (fileName: string) => boolean = () => true,
    reportPrefix: string = '.',
    jsGivenReportsDir: string = REPORTS_DESTINATION
) {
    const files = fs.readdirSync(`${jsGivenReportsDir}`).filter(filter);
    const scenarioReports: ScenarioReport[] = files.map(file =>
        JSON.parse(fs.readFileSync(`${jsGivenReportsDir}/${file}`, 'utf-8'))
    );
    const groupNamesAndScenarios: Array<
        [string, ScenarioReport[]]
    > = (Object.entries(
        _.groupBy(scenarioReports, ({ groupReport: { name } }) => name)
    ): any);
    const scenarioModels = groupNamesAndScenarios.map(
        ([groupName, scenarioReports]) =>
            toReportModel(groupName, scenarioReports)
    );

    const reportDir = `${reportPrefix}/jGiven-report`;

    fs.writeFileSync(
        `${reportDir}/data/metaData.js`,
        `jgivenReport.setMetaData({"created":"${new Date().toLocaleString()}","title":"J(s)Given Report","data":["data0.js"]} );\n`,
        'utf-8'
    );
    fs.writeFileSync(
        `${reportDir}/data/tags.js`,
        `jgivenReport.setTags({});\n`,
        'utf-8'
    );

    const json = JSON.stringify({ scenarios: scenarioModels });
    const buffer = zlib.gzipSync(Buffer.from(json, 'utf-8'));
    const base64 = buffer.toString('base64');
    fs.writeFileSync(
        `${reportDir}/data/data0.js`,
        `jgivenReport.addZippedScenarios('${base64}');\n`,
        'utf-8'
    );
}

function removeDir(dir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        rimraf(dir, error => {
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

        unzipper.on('error', err => {
            console.log(
                `Caught an error when extracting: ${zipFile} to ${targetDirectory}`
            );
            reject(err);
        });

        unzipper.on('extract', log => {
            resolve();
        });

        unzipper.extract({
            path: targetDirectory,
        });
    });
}

function toReportModel(
    groupName: string,
    scenarioReports: ScenarioReport[]
): ReportModel {
    return {
        className: groupName,
        description: groupName,
        name: groupName,
        scenarios: scenarioReports.map(toScenarioModel),
        tagMap: {},
    };
}

function toScenarioModel(
    scenarioReport: ScenarioReport,
    index: number
): ScenarioModel {
    return {
        testMethodName: scenarioReport.name,
        tagIds: [],
        scenarioCases: scenarioReport.cases.map((scenarioCase, index) => ({
            caseNr: index + 1,
            derivedArguments: scenarioCase.args,
            description: '',
            durationInNanos: scenarioCase.durationInNanos,
            errorMessage: null,
            explicitParameters: scenarioCase.args,
            explicitArguments: scenarioCase.args,
            stackTrace: null,
            success: scenarioCase.successful,
            steps: _.flatMap(scenarioCase.parts, toSteps),
        })),
        casesAsTable: scenarioReport.cases.length > 1,
        className: scenarioReport.groupReport.name,
        derivedParameters: scenarioReport.argumentNames,
        description: scenarioReport.name,
        durationInNanos: scenarioReport.cases
            .map(c => c.durationInNanos)
            .reduce((a, b) => a + b, 0),
        executionStatus: scenarioReport.executionStatus,
        explicitParameters: scenarioReport.argumentNames,
        extendedDescription: '',
    };
}

function toSteps(scenarioPart: ScenarioPart): StepModel[] {
    return scenarioPart.steps.map(step => ({
        attachment: null,
        durationInNanos: step.durationInNanos,
        extendedDescription: '',
        isSectionTitle: false,
        name: step.methodName,
        nestedSteps: [],
        status: step.status,
        words: step.words.map(word => ({
            ...(word.isIntroWord ? { isIntroWord: true } : {}),
            value: word.value,
            ...(word.scenarioParameterName !== null
                ? {
                      argumentInfo: {
                          argumentName: word.scenarioParameterName,
                          parameterName: word.scenarioParameterName,
                          formattedValue: word.value,
                      },
                  }
                : {}),
        })),
    }));
}
