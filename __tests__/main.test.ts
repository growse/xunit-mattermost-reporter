import {collectXUnitData} from '../src/xunit'
import {
  generateTableMarkdownFromReport,
  summarizeReport
} from '../src/mattermost'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn()
}))

describe('Test mattermost renderings', () => {
  test('test summary', async () => {
    const path = __dirname + '/fixtures/multiple/'
    const junitResults = await collectXUnitData(path)
    const summary = summarizeReport(junitResults)
    expect(summary.tests).toEqual(23)
    expect(summary.succeeded).toEqual(22)
    expect(summary.skipped).toEqual(0)
    expect(summary.errors).toEqual(1)
    expect(summary.duration).toEqual(53.62)
  })
  test('Report renders table properly', async () => {
    const path = __dirname + '/fixtures/xunit-fixture.xml'
    const junitResults = await collectXUnitData(path)
    const table = generateTableMarkdownFromReport(junitResults)
    expect(table).toEqual(
      '| Test suite | Results |\n|:---|:---|\n| org.owntracks.android.data.repos.MemoryContactsRepoTest (26.802s) | :tada: 5 tests, 5 passed, 0 skipped |\n| **Total (26.802s)** | **5 tests, 5 passed, 0 failed, 0 skipped** |'
    )
  })
  test('Report renders table properly when there are failures', async () => {
    const path = __dirname + '/fixtures/xunit-failure-fixture.xml'
    const junitResults = await collectXUnitData(path)
    const table = generateTableMarkdownFromReport(junitResults)
    expect(table).toEqual(
      '| Test suite | Results |\n|:---|:---|\n| org.owntracks.android.services.MessageProcessorEndpointHttpTest (2.117s) | :rotating_light: 7 tests, 1 failed |\n| **Total (2.117s)** | **7 tests, 6 passed, 1 failed, 0 skipped** |'
    )
  })
})

describe('Test XUnit report merging', () => {
  test('non-existent path', async () => {
    const path = ''
    await expect(collectXUnitData(path)).rejects.toThrow(
      'ENOENT: no such file or directory, stat'
    )
  })

  test('single test fixture', async () => {
    const path = __dirname + '/fixtures/xunit-fixture.xml'
    const junitResults = await collectXUnitData(path)
    expect(junitResults.testsuites.length).toEqual(1)
    expect(junitResults.testsuites[0].name).toEqual(
      'org.owntracks.android.data.repos.MemoryContactsRepoTest'
    )
  })

  test('multiple test fixture', async () => {
    const path = __dirname + '/fixtures/multiple/'
    const junitResults = await collectXUnitData(path)
    expect(junitResults.testsuites.length).toEqual(3)
  })
})
