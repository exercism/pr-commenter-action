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
      - uses: exercism/pr-commenter-action@v1.3.0
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
    Automated comment created by [PR Commenter](https://github.com/exercism/pr-commenter-action) :robot:.

  snippets:
    - id: any-markdown-file-changed
      files:
        - '*.md'
        - '**/*.md'
      body: |
        It looks like you're changing a Markdown file.
        Make sure your changes follow our [language guidelines](some-link) when writing documentation.
```

## Reference

### Workflow inputs

#### `github-token`

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

A string consisting of letters, numbers, `-`, and `_` or a Mustache template that evaluates to such a string.

_Snippet ids are used to check whether a comment's content changed. If you're using a template variable in the snippets's body and you want to recreate the whole comment when that variable changes value, use it in the snippet's id too._ 

**Required**: true

#### `comment.snippets[].body`

The text to be included in the PR comment.

**Required**: true

##### Templates

Comment snippet bodies (as well as `comment.header` and `comment.footer`) are [Mustache](https://mustache.github.io/mustache.5.html) templates.

Variables for the template can be provided via the `template-variables` input which should be a string containing a valid JSON.

You can use the [context and expression syntax](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions) to assemble the JSON and [set-output](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-an-output-parameter) to calculate data for the template in separate steps.

###### Example 1

```yaml
name: "PR Commenter"
on:
  - pull_request_target

jobs:
  pr-comment:
    runs-on: ubuntu-latest
    steps:
      - name: Calculate some template variables
        id: vars
        run: |
          echo ::set-output name=today::"$(date +%d-%m-%Y)"

      - uses: exercism/pr-commenter-action@v1.3.0
        with:
          template-variables: |
            {
              "today": "${{ steps.vars.outputs.today }}",
              "prAuthor": "${{ github.event.pull_request.user.login }}",
              "branchNamePrefix": ${{ startsWith(github.event.pull_request.head.ref, 'ref-') }}
            }
```
```yaml
comment:
  header: |
    Hi {{ prAuthor }}! Thank you for your contribution.

    {{^branchNamePrefix}}Your branch name doesn't start with the required prefix 'ref-'.{{/branchNamePrefix}}
```

Note that values such as the PR's title, body, or branch name should be considered [unsafe user input](https://docs.github.com/en/actions/learn-github-actions/security-hardening-for-github-actions#understanding-the-risk-of-script-injections).

###### Example 2

Here's a more complex example of using template variables. Let's say you have a multiline file that changes often, and you want to always include the newest content of the file in the snippet.

To ensure the comment will be recreated when the file changes, use the file's hash in the snippet's id.

To ensure that newline characters are handled correctly, use environment variables instead of job outputs and `toJSON`.

```yaml
name: "PR Commenter"
on:
  - pull_request_target

jobs:
  pr-comment:
    runs-on: ubuntu-latest
    steps:
      - name: Set environment variables
        run: |
          IMPORTANT_FILE_CONTENT=$(cat important_file)
          echo "IMPORTANT_FILE_CONTENT<<EOF" >> $GITHUB_ENV
          echo "$IMPORTANT_FILE_CONTENT" >> $GITHUB_ENV
          echo "EOF" >> $GITHUB_ENV

      - uses: exercism/pr-commenter-action@v1.3.0
        with:
          template-variables: |
            {
              "importantFileContent": ${{ toJSON(env.IMPORTANT_FILE_CONTENT) }},
              "importnatFileHash": ${{ toJSON(hashFiles('important_file.txt')) }}
            }
```
```yaml
comment:
  snippets:
    - id: snippet_{{ importnatFileHash }}}
    - files:
      - 'important_file.txt'
    - body: |
        This is very important:
        {{ importantFileContent }}
```

#### `comment.snippets[].files`

A list of globs (strings) and/or match objects. If at least one file changed in the PR matches at least one of the globs or match objects, this snippet's body will be included in the comment.

##### Globs

Example:

```yaml
# any markdown file changed in any directory
comment:
  snippets:
    - id: any-markdown-file-changed
      files:
        - '*.md'
        - '**/*.md'
```

##### Match objects

A match object contains the keys `any` and/or `all` with a list of globs.

- `all` - **every file** changed in this PR must match every glob in this list
- `any` - **at least one file** changed in this PR must match every glob in this list

Example:

```yaml
# at least one root-level markdown file changed
# and none of the changed files is the README.md
comment:
  snippets:
    - id: any-markdown-file-changed-but-readme
      files:
        - any: ['*.md']
          all: ['!README.md']
```

**Required**: true

#### `comment.glob-options`

This GitHub action uses the [minimatch](https://github.com/isaacs/minimatch) library for glob matching. A object with options can be provided under `comment.glob-options` to modify the behavior of this library. See [the list of minimatch options](https://github.com/isaacs/minimatch#options) for the list of supported options.

Example:

```yaml
# Make all globs also match hidden files and directories
comment:
  glob-options:
    dot: true
```

## Development

### Setup

- Install the required NodeJS version as specified in `.tool-versions`. The recommended way to manage multiple NodeJS versions is to use [asdf](https://asdf-vm.com/#/).
- Install the dependencies with `npm install`.
- Run the tests with `npm run test` and the linter with `npm run lint`.

## Authors

This library was originally created by [@angelikatyborska](https://github.com/angelikatyborska/). It is maintained by [@angelikatyborska](https://github.com/angelikatyborska/) and the Exercism team. See the [GitHub contributors graph](https://github.com/exercism/pr-commenter-action/graphs/contributors) for a full list of contributors.
