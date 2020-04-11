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
  const sumFn = (sum: number, current: number): number => {
    return sum + current
  }
  const repoUrl = context.payload.repository?.html_url
  const actorProfileUrl = context.payload.sender?.html_url
  const actorAvatarUrl = context.payload.sender?.avatar_url.concat('&size=18')
  const workflowUrl = new URL(
    `${repoUrl}/actions?query=workflow%3A${encodeURIComponent(
      context.workflow
    )}`
  )
  const thingTitle = context.payload.pull_request
    ? `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`
    : context.ref
  const testsFailed = report.testsuites
    .map(suite => suite.failures ?? 0)
    .reduce(sumFn, 0)
  const testsErrored = report.testsuites
    .map(suite => suite.errors ?? 0)
    .reduce(sumFn, 0)
  const metricFields = [
    {
      short: true,
      title: 'Tests Run',
      value: report.testsuites
        .map(suite => suite.tests ?? 0)
        .reduce(sumFn)
        .toString()
    },
    {
      short: true,
      title: 'Tests Succeeded',
      value: report.testsuites
        .map(suite => suite.succeeded ?? 0)
        .reduce(sumFn)
        .toString()
    },
    {
      short: true,
      title: 'Tests Skipped',
      value: report.testsuites
        .map(suite => suite.skipped ?? 0)
        .reduce(sumFn)
        .toString()
    },
    {short: true, title: 'Tests Failed', value: testsFailed.toString()},
    {short: true, title: 'Tests Errored', value: testsErrored.toString()},
    {
      short: true,
      title: 'Duration',
      value: report.testsuites
        .map(suite => suite.durationSec)
        .reduce(sumFn)
        .toString()
    }
  ]
  const colour = testsFailed + testsErrored === 0 ? '#00aa00' : 'aa0000'
  const title =
    testsFailed + testsErrored === 0
      ? ':tada: Tests passed'
      : ':rotating_light: Tests failed'
  const text = `![${context.actor} avatar](${actorAvatarUrl}) [${
    context.actor
  }](${actorProfileUrl}) ran some tests ran on [${thingTitle}](${
    context.payload.pull_request?.html_url ?? 'https://example.com'
  }) at [${context.repo.owner}/${
    context.repo.repo
  }](${repoUrl}) as part of the [${context.workflow}](${workflowUrl}) workflow.`
  return {
    author_name: 'Xunit Mattermost Reporter',
    color: colour,
    fallback: `${title} - ${text}`,
    fields: metricFields,
    text,
    title
  }
}
