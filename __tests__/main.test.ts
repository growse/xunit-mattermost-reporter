import {collectXUnitData} from '../src/main'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))
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
    expect(junitResults.testsuites.length).toEqual(2)
  })
})
