import {collectXUnitData} from '../src/xunit'
import {renderReportToMattermostAttachment} from '../src/mattermost'

jest.mock('@actions/github', () => ({
  context: {
    actor: 'test-actor',
    ref: 'test-ref',
    workflow: 'test-workflow',
    repo: {
      owner: 'test-owner',
      repo: 'test-repo'
    },
    payload: {
      sender: {
        html_url: 'https://example.com/sender',
        avatar_url: 'https://example.com/sender.png'
      },
      repository: {html_url: 'https://example.com/test-owner/test-repo'},
      pull_request: {
        title: 'PR title',
        number: 1,
        html_url: 'https://example.com/test-owner/test-repo/pulls/1'
      }
    }
  }
}))
describe('Test mattermost renderings', () => {
  describe('PR', () => {
    test('Single report renders attachment properly', async () => {
      const path = __dirname + '/fixtures/xunit-fixture.xml'
      const junitResults = await collectXUnitData(path)
      const message = renderReportToMattermostAttachment(junitResults)
      expect(message.color).toEqual('#00aa00')
      expect(message.title).toEqual('Test run success')
      expect(message.text).toEqual(
        '![test-actor avatar](https://example.com/sender.png&size=18) [test-actor](https://example.com/sender) ran 5 tests ran on [#1 PR title](https://example.com/test-owner/test-repo/pulls/1) at [test-owner/test-repo](https://example.com/test-owner/test-repo) as part of the [test-workflow](https://example.com/test-owner/test-repo/actions?query=workflow%3Atest-workflow) workflow.\n\n| Test suite | Results |\n|:---|:---|\n| `org.owntracks.android.data.repos.MemoryContactsRepoTest` (27 seconds) | :tada: 5 tests, 5 passed, 0 skipped |\n| **Total (27 seconds)** | **5 tests, 5 passed, 0 failed, 0 skipped** |'
      )
    })

    test('Multi report with failures renders attachment properly', async () => {
      const path = __dirname + '/fixtures/multiple/'
      const junitResults = await collectXUnitData(path)
      const message = renderReportToMattermostAttachment(junitResults)
      expect(message.color).toEqual('#aa0000')
      expect(message.title).toEqual('Test run failure')
      expect(message.text).toEqual(
        '![test-actor avatar](https://example.com/sender.png&size=18) [test-actor](https://example.com/sender) ran 23 tests ran on [#1 PR title](https://example.com/test-owner/test-repo/pulls/1) at [test-owner/test-repo](https://example.com/test-owner/test-repo) as part of the [test-workflow](https://example.com/test-owner/test-repo/actions?query=workflow%3Atest-workflow) workflow.\n\n| Test suite | Results |\n|:---|:---|\n| `org.owntracks.android.data.repos.MemoryContactsRepoTest` (27 seconds) | :tada: 5 tests, 5 passed, 0 skipped |\n| `org.owntracks.android.support.ParserTest` (25 seconds) | :tada: 11 tests, 11 passed, 0 skipped |\n| `org.owntracks.android.services.MessageProcessorEndpointHttpTest` (2 seconds) | :rotating_light: 7 tests, 1 failed |\n| **Total (a minute)** | **23 tests, 22 passed, 1 failed, 0 skipped** |'
      )
    })
  })
})
