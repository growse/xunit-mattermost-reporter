import {context} from '@actions/github'
import {JunitResults} from './xunit'
import * as core from '@actions/core'
import bent from 'bent'
import {URL} from 'url'

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
  image_url?: URL
}

export async function postReportToMatterMost(
  mattermostWebhookUrl: string,
  report: JunitResults
): Promise<string> {
  const mmBody = {
    username: 'Github Actions Runner',
    text: '',
    attachments: [renderReportToMattermostAttachment(report)]
  }
  core.info(`MM payload: ${JSON.stringify(mmBody)}`)
  const mmPost = bent('string', 'POST')
  return mmPost(mattermostWebhookUrl, mmBody)
}

interface JunitSummary {
  tests: number
  succeeded: number
  skipped: number
  errors: number
  duration: number
}

function generateTableMarkdownFromReport(report: JunitResults): string {
  const summary = summarizeReport(report)
  return ['| Test suite | Results |', '|:---|:---|']
    .concat(
      report.testsuites.map(suite => {
        if (suite.errors === 0) {
          return `| ${suite.name} (${suite.durationSec}s) | :tada: ${suite.tests} tests, ${suite.succeeded} passed, ${suite.skipped} skipped |`
        } else {
          return `| ${suite.name} (${suite.durationSec}s) | :rotating_light: ${suite.tests} tests, ${suite.errors} failed |`
        }
      })
    )
    .concat(
      `| **Total (${summary.duration}s)** | **${summary.tests} tests, ${summary.succeeded} passed, ${summary.errors} failed, ${summary.skipped} skipped** |`
    )
    .join('\n')
}

function summarizeReport(report: JunitResults): JunitSummary {
  const sumFn = (sum: number, current: number): number => {
    return sum + current
  }
  const testsRun = report.testsuites
    .map(suite => suite.tests ?? 0)
    .reduce(sumFn)
  const testsSkipped = report.testsuites
    .map(suite => suite.skipped ?? 0)
    .reduce(sumFn)
  const testsErrored = report.testsuites
    .map(suite => suite.errors ?? 0)
    .reduce(sumFn)
  const testsSucceeded = report.testsuites
    .map(suite => suite.succeeded ?? 0)
    .reduce(sumFn)
  const testDuration = report.testsuites
    .map(suite => suite.durationSec ?? 0)
    .reduce(sumFn)
  return {
    tests: testsRun,
    succeeded: testsSucceeded,
    skipped: testsSkipped,
    errors: testsErrored,
    duration: testDuration
  }
}

export function renderReportToMattermostAttachment(
  report: JunitResults
): MattermostAttachment {
  const summary = summarizeReport(report)
  const allSucceeded = summary.errors === 0

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

  const colour = allSucceeded ? '#00aa00' : '#aa0000'
  const notificationTitle = allSucceeded
    ? 'Test run success'
    : 'Test run failure'

  const resultsTable = generateTableMarkdownFromReport(report)
  const notificationText = `![${context.actor} avatar](${actorAvatarUrl}) [${
    context.actor
  }](${actorProfileUrl}) ran some tests ran on [${thingTitle}](${
    context.payload.pull_request?.html_url ?? repoUrl
  }) at [${context.repo.owner}/${
    context.repo.repo
  }](${repoUrl}) as part of the [${
    context.workflow
  }](${workflowUrl}) workflow.\n\n${resultsTable}`

  return {
    author_name: 'Xunit Mattermost Reporter',
    color: colour,
    fallback: `${notificationTitle} - ${notificationText}`,
    text: notificationText,
    title: notificationTitle
  }
}
