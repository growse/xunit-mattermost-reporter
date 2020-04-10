![build-test](https://github.com/growse/xunit-mattermost-reporter/workflows/build-test/badge.svg)

# xUnit Mattermost Reporter build action

This Github action sends a message to Mattermost (via a webhook) that describes the output from one or more xUnit test result XML files.

## Inputs

### `mattermostWebhookUrl`

**Required** URL of the Mattermost webhook to send the notification to

### `xUnitTestPath`

**Required** Relative path to the directory containing the xUnit result files (or single XML file)