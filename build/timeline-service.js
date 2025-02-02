"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const generate_markup_1 = require("./components/generate-markup");
const index_template_1 = __importDefault(require("./index-template"));
const utils_1 = require("./utils");
const util_1 = require("util");
const writeFilePromiseSync = util_1.promisify(fs_1.writeFile);
const BEFORE_CLICK = 'before:click';
const ON_ERROR = 'on:error';
class TimelineService {
    setReporterOptions(config) {
        const timelineFilter = config.reporters.filter(item => Array.isArray(item) && item[0] === 'timeline');
        if (timelineFilter.length === 0) {
            throw new Error(`Add timeline to reporters in wdio config: 
            reporters: [[timeline]]
        `);
        }
        const timeline = timelineFilter[0];
        if (timeline.length !== 2 || typeof timeline[1] !== 'object') {
            throw new Error(`Add reporter options object to timeline reporter: 
            reporters: [[timeline, {}]]
        `);
        }
        if (!timeline[1].outputDir) {
            throw new Error(`Set outputDir on reporter options object: 
            reporters: [[timeline, {
              outputDir: 'desired_folder'
            }]]
        `);
        }
        this.reporterOptions = timeline[1];
        this.resolvedOutputDir = path_1.resolve(this.reporterOptions.outputDir);
    }
    onPrepare(config) {
        this.startTime = Date.now();
        this.setReporterOptions(config);
        try {
            // mkdir recursively
            const initDir = path_1.isAbsolute(this.resolvedOutputDir) ? path_1.sep : '';
            this.resolvedOutputDir.split(path_1.sep).reduce((parentDir, childDir) => {
                const curDir = path_1.resolve(parentDir, childDir);
                if (!fs_1.existsSync(curDir)) {
                    fs_1.mkdirSync(curDir);
                }
                return curDir;
            }, initDir);
            this.changeLogFile = `${this.resolvedOutputDir}/changelog.txt`;
            fs_1.writeFileSync(this.changeLogFile, '');
            // close watcher in onComplete
            this.watcher = fs_1.watch(this.resolvedOutputDir, (eventType, filename) => {
                if (filename.includes('timeline-reporter')) {
                    fs_1.appendFileSync(this.changeLogFile, `${filename}\n`);
                }
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    beforeSession(config) {
        this.setReporterOptions(config);
    }
    beforeCommand(commandName) {
        const { screenshotStrategy } = this.reporterOptions;
        if (screenshotStrategy === BEFORE_CLICK && 'click' === commandName) {
            browser.takeScreenshot();
        }
    }
    afterTest(test) {
        const { screenshotStrategy } = this.reporterOptions;
        if (screenshotStrategy === BEFORE_CLICK) {
            browser.takeScreenshot();
        }
        if (screenshotStrategy === ON_ERROR && !test.passed) {
            browser.takeScreenshot();
        }
    }
    resize(screenshots) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.reporterOptions.images && this.reporterOptions.images.resize) {
                let { quality, reductionRatio } = this.reporterOptions.images;
                console.log(`TIMELINE:ScreenshotService: Attempting to resize ${screenshots.length} images`);
                quality =
                    Number.isInteger(quality) && quality > 0 && quality <= 100
                        ? Math.round(quality)
                        : 70;
                reductionRatio =
                    Number.isInteger(reductionRatio) &&
                        reductionRatio > 0 &&
                        reductionRatio <= 5
                        ? Math.round(reductionRatio)
                        : 1;
                const promises = screenshots.map(filePath => utils_1.waitForFileExistsAndResize(filePath, quality, reductionRatio));
                return Promise.all(promises);
            }
            return Promise.all([]);
        });
    }
    getFileName() {
        return `${this.resolvedOutputDir}/${this.reporterOptions.fileName ||
            'timeline-report.html'}`;
    }
    onComplete() {
        const folderAndChangeLogFileExists = fs_1.existsSync(this.resolvedOutputDir) && fs_1.existsSync(this.changeLogFile);
        // close watcher
        this.watcher.close();
        if (folderAndChangeLogFileExists) {
            const runnerLogFiles = fs_1.readFileSync(this.changeLogFile, 'utf-8')
                .split('\n')
                .filter(line => line !== '');
            const results = [];
            Array.from(new Set(runnerLogFiles))
                .filter(line => line !== '')
                .forEach(file => {
                let runnerResult;
                try {
                    const reportLogPath = `${this.resolvedOutputDir}/${file}`;
                    const reportLog = fs_1.readFileSync(reportLogPath).toString();
                    if (reportLog) {
                        runnerResult = JSON.parse(reportLog);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                finally {
                    runnerResult && results.push(runnerResult);
                }
            });
            const combinedTestResults = this.generateTestResults(results);
            const screenshots = utils_1.deepSearch('screenshots', combinedTestResults);
            const flattenedArrayOfScreenshots = [].concat.apply([], screenshots);
            return this.resize(flattenedArrayOfScreenshots).then(() => new Promise(resolve => {
                const body = generate_markup_1.generateMarkup(combinedTestResults);
                const finalHtml = index_template_1.default(body);
                resolve(finalHtml);
            })
                .then(finalHtml => writeFilePromiseSync(this.getFileName(), finalHtml))
                .then(() => {
                const cyan = '\x1b[35m';
                console.log(`${cyan}--------\n${cyan}TIMELINE REPORTER: Created ${this.getFileName()}\n${cyan}--------`);
            })
                .catch(error => {
                throw error;
            }));
        }
    }
    getBrowserNameAndCombo(capabilities) {
        const name = capabilities.browserName ||
            capabilities.deviceName ||
            'unknown browser name';
        const version = capabilities.browserVersion ||
            capabilities.platformVersion ||
            capabilities.version ||
            'unknown browser version';
        return `${name} ${version}`;
    }
    generateTestResults(results) {
        this.stopTime = Date.now();
        const passed = results.reduce((accumulator, result) => result.state.passed + accumulator, 0);
        const failed = results.reduce((accumulator, result) => result.state.failed + accumulator, 0);
        const skipped = results.reduce((accumulator, result) => result.state.skipped + accumulator, 0);
        const totalDuration = this.stopTime - this.startTime;
        const total = passed + failed + skipped;
        let unknown = 0;
        return {
            summary: {
                passed,
                failed,
                skipped,
                total,
                unknown,
                duration: totalDuration
            },
            specs: results.map(result => ({
                start: result.start,
                end: result.end,
                duration: result.duration,
                filename: result.specs[0],
                browser: this.getBrowserNameAndCombo(result.capabilities),
                suites: result.suites.map(suite => ({
                    title: suite.title,
                    duration: suite.duration,
                    start: suite.start,
                    end: suite.end,
                    tests: suite.tests.map(test => ({
                        browser: this.getBrowserNameAndCombo(result.capabilities),
                        title: test.title,
                        start: test.start,
                        end: test.end,
                        duration: test.duration,
                        state: test.state,
                        screenshots: test.screenshots || [],
                        error: test.error,
                        context: test.context,
                        embedImages: this.reporterOptions.embedImages
                    }))
                }))
            }))
        };
    }
}
exports.TimelineService = TimelineService;
