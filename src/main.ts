import * as core from '@actions/core'

import {collectXUnitData} from './xunit'
import {postReportToMatterMost} from './mattermost'

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

    collectXUnitData(xunitPath)
      .then(async report => {
        core.endGroup()
        core.startGroup('Posting to Mattermost')
        return postReportToMatterMost(mattermostWebhookUrl, report)
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
