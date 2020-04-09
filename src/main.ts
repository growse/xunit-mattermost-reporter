import * as core from '@actions/core'
import {collectXUnitData} from './xunit'


const bent = require('bent')

async function run(): Promise<void> {
    try {
        const xunitPath: string = core.getInput('xUnitTestPath')
        const mattermostWebhookUrl: string = core.getInput('mattermostWebhookUrl')
        core.debug(`Pulling xunit results from  ${xunitPath}`)
        const mmPost = bent('POST', 'json')
        collectXUnitData(xunitPath)
            .then(report => {
                    let mmBody = {"username": "Github actions runner", "text": "test"}
                    return mmPost(mattermostWebhookUrl, mmBody)
                }
            ).then(result => {
            console.log(result)
            core.setOutput('Mattermost response', `Success: ${result}`)
        })

    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
