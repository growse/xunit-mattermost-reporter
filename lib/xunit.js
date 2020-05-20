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
exports.collectXUnitData = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core = __importStar(require("@actions/core"));
const junitxml_to_javascript_1 = __importDefault(require("junitxml-to-javascript"));
function collectXUnitData(xUnitPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const pathStat = fs_1.default.statSync(xUnitPath);
        if (pathStat.isFile()) {
            return new junitxml_to_javascript_1.default()
                .parseXMLFile(xUnitPath)
                .then(report => report);
        }
        if (pathStat.isDirectory()) {
            return fs_1.default
                .readdirSync(xUnitPath)
                .filter(p => fs_1.default.statSync(path_1.default.join(xUnitPath.toString(), p)).isFile())
                .map((p) => __awaiter(this, void 0, void 0, function* () {
                return new junitxml_to_javascript_1.default().parseXMLFile(path_1.default.join(xUnitPath.toString(), p));
            }))
                .reduce((promiseChain, currentTask) => __awaiter(this, void 0, void 0, function* () {
                return promiseChain.then((chainResults) => __awaiter(this, void 0, void 0, function* () {
                    return currentTask.then(currentResult => {
                        currentResult.testsuites
                            .map(suite => `Adding report for ${suite.name}`)
                            .forEach(msg => core.info(msg));
                        const mergedResults = {
                            testsuites: chainResults.testsuites.concat(currentResult.testsuites)
                        };
                        return mergedResults;
                    });
                }));
            }), Promise.resolve({ testsuites: [] }));
        }
        throw new Error("Given path isn't a directory or file");
    });
}
exports.collectXUnitData = collectXUnitData;
