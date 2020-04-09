import {PathLike} from "fs"

import fs from "fs"

import Parser from "junitxml-to-javascript"
import * as path from "path"

export interface JunitSuite {
    name: String
}

export interface JunitResults {
    testsuites: JunitSuite[]
}

export async function collectXUnitData(xunitPath: PathLike): Promise<JunitResults> {
    const pathStat = fs.statSync(xunitPath)
    if (pathStat.isFile()) {
        return new Parser()
            .parseXMLFile(xunitPath)
            .then(report => report as JunitResults)
    }
    if (pathStat.isDirectory()) {
        return fs.readdirSync(xunitPath)
            .filter(p => fs.statSync(path.join(xunitPath.toString(), p)).isFile())
            .map(p => new Parser().parseXMLFile(path.join(xunitPath.toString(), p)) as Promise<JunitResults>)
            .reduce((promiseChain, currentTask) => {
                return promiseChain.then(chainResults => {
                    console.log(`Chain results: ${chainResults.testsuites.length}`)
                    return currentTask.then(currentResult => {
                        console.log(`Current result: ${currentResult.testsuites.length}`)
                        return {"testsuites": chainResults.testsuites.concat(currentResult.testsuites)} as JunitResults
                    })
                })
            }, Promise.resolve({"testsuites": []} as JunitResults))
    }
    throw new Error("Given path isn't a directory or file")
}
