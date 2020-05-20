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
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const xunit_1 = require("./xunit");
const mattermost_1 = require("./mattermost");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.startGroup('Collecting XUnit results');
            const xunitPath = core.getInput('xUnitTestPath');
            const mattermostWebhookUrl = core.getInput('mattermostWebhookUrl');
            if (xunitPath === '') {
                core.setFailed('xunitPath parameter is required');
                return;
            }
            if (mattermostWebhookUrl === '') {
                core.setFailed('mattermostWebhookUrl parameter is required');
                return;
            }
            core.debug(`Pulling xunit results from  ${xunitPath}`);
            xunit_1.collectXUnitData(xunitPath)
                .then((report) => __awaiter(this, void 0, void 0, function* () {
                core.endGroup();
                core.startGroup('Posting to Mattermost');
                return mattermost_1.postReportToMatterMost(mattermostWebhookUrl, report);
            }))
                .then(result => {
                core.setOutput('Mattermost response', `Success: ${result}`);
                core.endGroup();
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
