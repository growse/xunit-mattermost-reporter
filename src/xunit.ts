import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

import Parser from 'junitxml-to-javascript'

export interface JunitSuite {
  name: String
  tests: number
  succeeded: number
  skipped: number
  errors: number
  durationSec: number
}

export interface JunitResults {
  testsuites: JunitSuite[]
}

export async function collectXUnitData(
  xUnitPath: fs.PathLike
): Promise<JunitResults> {
  const pathStat = fs.statSync(xUnitPath)
  if (pathStat.isFile()) {
    return new Parser()
      .parseXMLFile(xUnitPath)
      .then(report => report as JunitResults)
  }
  if (pathStat.isDirectory()) {
    return fs
      .readdirSync(xUnitPath)
      .filter(p => fs.statSync(path.join(xUnitPath.toString(), p)).isFile())
      .map(
        async p =>
          new Parser().parseXMLFile(
            path.join(xUnitPath.toString(), p)
          ) as Promise<JunitResults>
      )
      .reduce(async (promiseChain, currentTask) => {
        return promiseChain.then(async chainResults => {
          return currentTask.then(currentResult => {
            currentResult.testsuites
              .map(suite => `Adding report for ${suite.name}`)
              .forEach(msg => core.info(msg))
            const mergedResults: JunitResults = {
              testsuites: chainResults.testsuites.concat(
                currentResult.testsuites
              )
            }
            return mergedResults
          })
        })
      }, Promise.resolve({testsuites: []}))
  }
  throw new Error("Given path isn't a directory or file")
}
