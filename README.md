# PR Commenter Action

This GitHub action posts comments on a PR that can vary depending on which files are being changed in the PR.
 
## Getting Started

### Create workflow

Create your workflow file `.github/workflows/pr-commenter.yml` as follows.

```yaml
name: "PR Commenter"
on:
  - pull_request_target

jobs:
  pr-comment:
    runs-on: ubuntu-latest
    steps:
      - uses: angelikatyborska/pr-commenter-action@v1
        with:
          github-token: "${{ github.token }}"
          config-file: ".github/pr-commenter.yml"
```

### Create configuration file

Create your action configuration file `.github/pr-commenter.yml` as follows.

```yaml
comment:
  on-update: recreate
  header: |
    Thank you for contributing this repository :tada:.

  footer: |
    ---
    Automated comment created by [PR Commenter](https://github.com/angelikatyborska/pr-commenter-action) :robot:.

  snippets:
    - id: any-markdown-file-changed
      files:
        - '**/*.md'
      body: |
        It looks like you're changing a Markdown file. Make sure your changes follow our [language guidelines](some-link) when writing documentation.
```

## Reference

### Workflow inputs

| Name | Description | Required? | Default |
| ---- | ----------- | --------- | ------- |
| `repo-token` | Auth token used to manage issues or pull requests | true | `${{ github.token }}` |
| `config-file` | The path to the action configuration file | true | `.github/pr-commenter.yml` |

### Configuration file

| Key | Description | Required? | Default |
| --- | ----------- | --------- | ------- |
| `comment.on-update` | One of: `recreate`, `edit`, and `nothing`. Dictates what should happen if a comment was already created on this PR, but more changes were pushed to the PR and the comment needs to change. `recreate` means delete the old comment and create a new one, `edit`, means edit the old comment, and `nothing` means leave the old comment unchanged. | true | `recreate` |
| `comment.header` | An optional text to be included at the beginning of each comment. | false | |
| `comment.footer` | An optional text to be included at the end of each comment. | false | |
| `comment.snippets` | A list of comment snippet configurations. At least one snippet is required. Note that a PR comment will only be created if at least one of the snippets match, even if `comment.header` and/or `comment.footer` are given. | true | |
| `comment.snippets[].id` | A string consisting of letters, numbers, `-`, and `_`. | true | |
| `comment.snippets[].files` | A list of glob expressions. If a file matching any of those expressions is being changed in the PR, this snippet's body will be included in the comment. | true | |
| `comment.snippets[].body` | The text to be included in the PR comment. | true | |
