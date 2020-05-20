"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderReportToMattermostAttachment = exports.postReportToMatterMost = void 0;
const github_1 = require("@actions/github");
const core = __importStar(require("@actions/core"));
const bent_1 = __importDefault(require("bent"));
const url_1 = require("url");
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
function postReportToMatterMost(mattermostWebhookUrl, report) {
    return __awaiter(this, void 0, void 0, function* () {
        const mmBody = {
            username: 'Github Actions Runner',
            text: '',
            attachments: [renderReportToMattermostAttachment(report)]
        };
        core.info(`MM payload: ${JSON.stringify(mmBody)}`);
        core.debug(JSON.stringify(github_1.context));
        const mmPost = bent_1.default('string', 'POST');
        return mmPost(mattermostWebhookUrl, mmBody);
    });
}
exports.postReportToMatterMost = postReportToMatterMost;
function generateTableMarkdownFromReport(report) {
    moment_1.default.relativeTimeThreshold('ss', 1);
    const summary = summarizeReport(report);
    return ['| Test suite | Results |', '|:---|:---|']
        .concat(report.testsuites.map(suite => {
        if (suite.errors === 0) {
            return `| \`${suite.name}\` (${moment_1.default
                .duration(suite.durationSec, 's')
                .humanize()}) | :tada: ${suite.tests} tests, ${suite.succeeded} passed, ${suite.skipped} skipped |`;
        }
        else {
            return `| \`${suite.name}\` (${moment_1.default
                .duration(suite.durationSec, 's')
                .humanize()}) | :rotating_light: ${suite.tests} tests, ${suite.errors} failed |`;
        }
    }))
        .concat(`| **Total (${moment_1.default.duration(summary.duration, 's').humanize()})** | **${summary.tests} tests, ${summary.succeeded} passed, ${summary.errors} failed, ${summary.skipped} skipped** |`)
        .join('\n');
}
function summarizeReport(report) {
    const sumFn = (sum, current) => {
        return sum + current;
    };
    const testsRun = report.testsuites
        .map(suite => { var _a; return (_a = suite.tests) !== null && _a !== void 0 ? _a : 0; })
        .reduce(sumFn);
    const testsSkipped = report.testsuites
        .map(suite => { var _a; return (_a = suite.skipped) !== null && _a !== void 0 ? _a : 0; })
        .reduce(sumFn);
    const testsErrored = report.testsuites
        .map(suite => { var _a; return (_a = suite.errors) !== null && _a !== void 0 ? _a : 0; })
        .reduce(sumFn);
    const testsSucceeded = report.testsuites
        .map(suite => { var _a; return (_a = suite.succeeded) !== null && _a !== void 0 ? _a : 0; })
        .reduce(sumFn);
    const testDuration = report.testsuites
        .map(suite => { var _a; return (_a = suite.durationSec) !== null && _a !== void 0 ? _a : 0; })
        .reduce(sumFn);
    return {
        tests: testsRun,
        succeeded: testsSucceeded,
        skipped: testsSkipped,
        errors: testsErrored,
        duration: testDuration
    };
}
function renderReportToMattermostAttachment(report) {
    var _a, _b, _c, _d, _e;
    const summary = summarizeReport(report);
    const allSucceeded = summary.errors === 0;
    const githubBaseUrl = new url_1.URL('https://github.com/');
    const repoUrl = ((_a = github_1.context.payload.repository) === null || _a === void 0 ? void 0 : _a.html_url) ? new url_1.URL(github_1.context.payload.repository.html_url)
        : new url_1.URL(`${github_1.context.repo.owner}/${github_1.context.repo.repo}`, githubBaseUrl);
    const branchUrl = getBranchUrl(repoUrl, github_1.context.ref);
    const actorProfileUrl = new url_1.URL((_b = github_1.context.payload.sender) === null || _b === void 0 ? void 0 : _b.html_url);
    const actorAvatarUrl = new url_1.URL((_c = github_1.context.payload.sender) === null || _c === void 0 ? void 0 : _c.avatar_url.concat('&size=18'));
    const workflowUrl = new url_1.URL(`${repoUrl}/actions?query=workflow%3A${encodeURIComponent(github_1.context.workflow)}`);
    const thingTitle = github_1.context.payload.pull_request
        ? `#${github_1.context.payload.pull_request.number} ${github_1.context.payload.pull_request.title}`
        : getBranchNameFromRef(github_1.context.ref);
    const colour = allSucceeded ? '#00aa00' : '#aa0000';
    const notificationTitle = allSucceeded
        ? 'Test run success'
        : 'Test run failure';
    const resultsTable = generateTableMarkdownFromReport(report);
    const notificationText = `![${github_1.context.actor} avatar](${actorAvatarUrl}) [${github_1.context.actor}](${actorProfileUrl}) ran some tests ran on [${thingTitle}](${(_e = (_d = github_1.context.payload.pull_request) === null || _d === void 0 ? void 0 : _d.html_url) !== null && _e !== void 0 ? _e : branchUrl}) at [${github_1.context.repo.owner}/${github_1.context.repo.repo}](${repoUrl}) as part of the [${github_1.context.workflow}](${workflowUrl}) workflow.\n\n${resultsTable}`;
    return {
        author_name: 'Xunit Mattermost Reporter',
        color: colour,
        fallback: `${notificationTitle} - ${notificationText}`,
        text: notificationText,
        title: notificationTitle
    };
}
exports.renderReportToMattermostAttachment = renderReportToMattermostAttachment;
function getBranchNameFromRef(ref) {
    return ref.startsWith('refs/heads/') ? ref.substr(11) : ref;
}
function getBranchUrl(repoUrl, ref) {
    return new url_1.URL(path_1.default.join(repoUrl.pathname, 'tree', getBranchNameFromRef(ref)), repoUrl).toString();
}
