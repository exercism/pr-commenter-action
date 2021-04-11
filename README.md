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
    Thank you for contributing to this repository :tada:.

  footer: |
    ---
    Automated comment created by [PR Commenter](https://github.com/angelikatyborska/pr-commenter-action) :robot:.

  snippets:
    - id: any-markdown-file-changed
      files:
        - '**/*.md'
      body: |
        It looks like you're changing a Markdown file.
        Make sure your changes follow our [language guidelines](some-link) when writing documentation.
```

## Reference

### Workflow inputs

#### `repo-token`

Auth token used to manage issues or pull requests.

**Required**: true

**Default**: `${{ github.token }}`

#### `config-file`

**Required**: true

**Default**: `.github/pr-commenter.yml`

### Configuration file

#### `comment.on-update`

Dictates what should happen if a comment was already created on this PR, but more changes were pushed to the PR and the comment needs to change.

- `recreate` - delete the old comment and create a new one
- `edit` - edit the old comment
- `nothing` - leave the old comment unchanged

**Required**: true

**Default**: `recreate`

#### `comment.header`

An optional text to be included at the beginning of each comment. 

**Required**: false

#### `comment.footer`

An optional text to be included at the end of each comment. 

**Required**: false

#### `comment.snippets`

A list of comment snippet configurations. At least one snippet is required. Note that a PR comment will only be created if at least one of the snippets match, even if `comment.header` and/or `comment.footer` are given.

**Required**: true

#### `comment.snippets[].id`

A string consisting of letters, numbers, `-`, and `_`.

**Required**: true

#### `comment.snippets[].files`

A list of glob expressions. If a file matching any of those expressions is being changed in the PR, this snippet's body will be included in the comment.

**Required**: true

#### `comment.snippets[].body`

The text to be included in the PR comment.

**Required**: true

## Development

### Setup

- Install the required NodeJS version as specified in `.tool-versions`. The recommended way to manage multiple NodeJS versions is to use [asdf](https://asdf-vm.com/#/).
- Install the dependencies with `npm install`.
- Run the tests with `npm run test` and the linter with `npm run lint`.
