import * as core from '@actions/core'

import bent from 'bent'

import {collectXUnitData} from './xunit'
import {renderReportToMarkdown} from './mattermost'

async function run(): Promise<void> {
  try {
    core.startGroup('Collecting XUnit results')
    const xunitPath: string = core.getInput('xUnitTestPath')
    const mattermostWebhookUrl: string = core.getInput('mattermostWebhookUrl')
    if (xunitPath === '') {
      core.setFailed('xunitPath parameter is required')
      return
    }
    if (mattermostWebhookUrl === '') {
      core.setFailed('mattermostWebhookUrl parameter is required')
      return
    }

    core.debug(`Pulling xunit results from  ${xunitPath}`)
    const mmPost = bent('POST', 'string')
    collectXUnitData(xunitPath)
      .then(async report => {
        core.endGroup()
        core.startGroup('Posting to Mattermost')
        const mmBody = {
          username: 'Github Actions Runner',
          text: 'test',
          props: {attachments: [renderReportToMarkdown(report)]}
        }
        core.debug(`MM payload: ${JSON.stringify(mmBody)}`)
        return mmPost(mattermostWebhookUrl, mmBody)
      })
      .then(result => {
        core.setOutput(
          'Mattermost response',
          `Success: ${result.statusCode} ${result}`
        )
        core.endGroup()
      })
  } catch (error) {
    console.log(error)
    console.log(core)
    core.setFailed(error.message)
  }
}

run()
