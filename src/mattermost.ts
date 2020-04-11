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
  const repoUrl = context.payload.repository?.html_url
  const actorProfileUrl = context.payload.sender?.html_url
  const actorAvatarUrl = context.payload.sender?.avatar_url.concat('&size=18')

  return {
    author_name: 'Xunit Mattermost reporter on ',
    color: '#00aa00',
    fallback: 'Fallback text',
    fields: [],
    text: `![${context.actor} avatar](${actorAvatarUrl}) [${
      context.actor
    }](${actorProfileUrl}) ran some tests ran on [${
      context.payload.pull_request?.body ?? context.ref
    }](${
      context.payload.pull_request?.html_url ?? 'https://example.com'
    }) at [${context.repo.owner}/${
      context.repo.repo
    }](${repoUrl}) as part of the ${context.workflow} workflow.`,
    title: `GH Context ${JSON.stringify(context)} Report: ${JSON.stringify(
      report
    )}`
  }
}
