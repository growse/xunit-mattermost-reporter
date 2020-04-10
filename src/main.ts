import core from '@actions/core'
import {context} from '@actions/github'

import bent from 'bent'

import Parser from 'junitxml-to-javascript'
import * as path from 'path'
import * as fs from 'fs'

export interface JunitSuite {
  name: String
}

export interface JunitResults {
  testsuites: JunitSuite[]
}

export interface MattermostAttachmentField {
  short: boolean
  title: string
  value: string
}

export interface MattermostAttachment {
  fallback: string
  color: string
  pretext?: string
  text: string
  author_name: string
  author_icon?: URL
  author_link?: URL
  title: string
  title_link?: URL
  fields: MattermostAttachmentField[]
  image_url?: URL
}

export async function collectXUnitData(
  xunitPath: fs.PathLike
): Promise<JunitResults> {
  const pathStat = fs.statSync(xunitPath)
  if (pathStat.isFile()) {
    return new Parser()
      .parseXMLFile(xunitPath)
      .then(report => report as JunitResults)
  }
  if (pathStat.isDirectory()) {
    return fs
      .readdirSync(xunitPath)
      .filter(p => fs.statSync(path.join(xunitPath.toString(), p)).isFile())
      .map(
        async p =>
          new Parser().parseXMLFile(
            path.join(xunitPath.toString(), p)
          ) as Promise<JunitResults>
      )
      .reduce(async (promiseChain, currentTask) => {
        return promiseChain.then(async chainResults => {
          return currentTask.then(currentResult => {
            currentResult.testsuites
              .map(suite => `Adding report for ${suite}`)
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

export function renderReportToMarkdown(
  report: JunitResults
): MattermostAttachment {
  return {
    author_name: 'Xunit Mattermost reporter',
    color: '#00aa00',
    fallback: 'Fallback text',
    fields: [],
    text: `Xunit report for ${report.testsuites.length} test suites on ${context.workflow}`,
    title: 'Test Title'
  }
}

async function run(): Promise<void> {
  try {
    core.startGroup('Collecting XUnit results')
    const xunitPath: string = core.getInput('xUnitTestPath')
    const mattermostWebhookUrl: string = core.getInput('mattermostWebhookUrl')
    if (xunitPath==="") {
      core.setFailed("xunitPath parameter is required")
      return
    }
    if (mattermostWebhookUrl==="") {
      core.setFailed("mattermostWebhookUrl parameter is required")
      return
    }

    core.debug(`Pulling xunit results from  ${xunitPath}`)
    const mmPost = bent('POST', 'json')
    collectXUnitData(xunitPath)
      .then(async report => {
        core.endGroup()
        core.startGroup('Posting to Mattermost')
        const mmBody = {
          username: 'Github actions runner',
          text: 'test',
          props: {attachments: [renderReportToMarkdown(report)]}
        }
        return mmPost(mattermostWebhookUrl, mmBody)
      })
      .then(result => {
        core.setOutput('Mattermost response', `Success: ${result}`)
        core.endGroup()
      })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
