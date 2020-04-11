import {context} from '@actions/github'
import {JunitResults} from './xunit'
import * as core from '@actions/core'
import bent from 'bent'
import {URL} from 'url'

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

export async function postReportToMatterMost(
  mattermostWebhookUrl: string,
  report: JunitResults
): Promise<string> {
  const mmBody = {
    username: 'Github Actions Runner',
    text: '',
    attachments: [renderReportToMarkdown(report)]
  }
  core.debug(`MM payload: ${JSON.stringify(mmBody)}`)
  const mmPost = bent('string', 'POST')
  return mmPost(mattermostWebhookUrl, mmBody)
}

export function renderReportToMarkdown(
  report: JunitResults
): MattermostAttachment {
  const ghBaseUrl = new URL('https://github.com')
  const repoUrl = new URL(
    `${encodeURIComponent(context.repo.owner)}/${encodeURIComponent(
      context.repo.repo
    )}`,
    ghBaseUrl
  )
  const actorProfileUrl = new URL(encodeURIComponent(context.actor), ghBaseUrl)
  const actorAvatarUrl = new URL(
    `${encodeURIComponent(context.actor)}.png?size=18`,
    ghBaseUrl
  )
  return {
    author_name: 'Xunit Mattermost reporter on ',
    color: '#00aa00',
    fallback: 'Fallback text',
    fields: [],
    text: `![${context.actor} avatar](${actorAvatarUrl}) [${context.actor}](${actorProfileUrl}) ran some tests ran on [${context.repo.owner}/${context.repo.repo}](${repoUrl}) as part of the ${context.workflow}workflow.`,
    title: `GH Context ${JSON.stringify(context)} ${JSON.stringify(report)}`
  }
}
