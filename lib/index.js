import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";
import { validateCommentConfig } from "./config";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const configPath = core.getInput("config-file", { required: true });

    const prNumber = getPrNumber();
    if (!prNumber) {
      console.log("Could not get pull request number from context, exiting");
      return;
    }

    const client = new github.getOctokit(token);

    const { data: pullRequest } = await client.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber
    });

    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles = await getChangedFiles(client, prNumber);
    const commentConfig = await getCommentConfig(client, configPath);

    // TODO: fetch previously added comment if exists
    // check snippet ids included in the comment

    const snippetIds = commentConfig.get('snippets').reduce(function (acc, snippet) {
      core.debug(`processing snippet ${snippet.get('id')}`);
      core.debug(`  snippet patterns: ${snippet.get('files')}`)

      if (checkGlobs(changedFiles, snippet.get('files'))) {
        return [...acc, snippet.get('id')]
      } else {
        return acc
      }
    }, [])

    core.debug(`matched snippet ids: ${snippetIds}`)

    //
    // if (labels.length > 0) {
    //   await addLabels(client, prNumber, labels);
    // }
    //
    // if (syncLabels && labelsToRemove.length) {
    //   await removeLabels(client, prNumber, labelsToRemove);
    // }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getPrNumber(){
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

async function getChangedFiles(client, prNumber) {
  const listFilesOptions = client.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });

  const listFilesResponse = await client.paginate(listFilesOptions);
  const changedFiles = listFilesResponse.map(f => f.filename);

  core.debug("found changed files:");
  for (const file of changedFiles) {
    core.debug("  " + file);
  }

  return changedFiles;
}

async function getCommentConfig(client, configurationPath) {
  const configurationContent = await fetchContent(client, configurationPath);
  const configObject = yaml.load(configurationContent);

  // transform object to a map or throw if yaml is malformed:
  return validateCommentConfig(configObject);
}

async function fetchContent(client, repoPath) {
  const response = await client.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

function toMatchConfig(config) {
  if (typeof config === "string") {
    return {
      any: [config]
    };
  }

  return config;
}

function printPattern(matcher) {
  return (matcher.negate ? "!" : "") + matcher.pattern;
}

function checkGlobs(changedFiles, globs) {
  for (const glob of globs) {
    core.debug(` checking pattern ${JSON.stringify(glob)}`);
    const matchConfig = toMatchConfig(glob);
    if (checkMatch(changedFiles, matchConfig)) {
      return true;
    }
  }
  return false;
}

function isMatch(changedFile, matchers) {
  core.debug(`    matching patterns against file ${changedFile}`);
  for (const matcher of matchers) {
    core.debug(`   - ${printPattern(matcher)}`);
    if (!matcher.match(changedFile)) {
      core.debug(`   ${printPattern(matcher)} did not match`);
      return false;
    }
  }

  core.debug(`   all patterns matched`);
  return true;
}

// equivalent to "Array.some()" but expanded for debugging and clarity
function checkAny(changedFiles, globs) {
  const matchers = globs.map(g => new Minimatch(g));
  core.debug(`  checking "any" patterns`);
  for (const changedFile of changedFiles) {
    if (isMatch(changedFile, matchers)) {
      core.debug(`  "any" patterns matched against ${changedFile}`);
      return true;
    }
  }

  core.debug(`  "any" patterns did not match any files`);
  return false;
}

// equivalent to "Array.every()" but expanded for debugging and clarity
function checkAll(changedFiles, globs) {
  const matchers = globs.map(g => new Minimatch(g));
  core.debug(` checking "all" patterns`);
  for (const changedFile of changedFiles) {
    if (!isMatch(changedFile, matchers)) {
      core.debug(`  "all" patterns did not match against ${changedFile}`);
      return false;
    }
  }

  core.debug(`  "all" patterns matched all files`);
  return true;
}

function checkMatch(changedFiles, matchConfig) {
  if (matchConfig.all !== undefined) {
    if (!checkAll(changedFiles, matchConfig.all)) {
      return false;
    }
  }

  if (matchConfig.any !== undefined) {
    if (!checkAny(changedFiles, matchConfig.any)) {
      return false;
    }
  }

  return true;
}
//
// async function addLabels(client, prNumber, labels) {
//   await client.issues.addLabels({
//     owner: github.context.repo.owner,
//     repo: github.context.repo.repo,
//     issue_number: prNumber,
//     labels: labels
//   });
// }
//
// async function removeLabels(client, prNumber, labels) {
//   await Promise.all(
//     labels.map(label =>
//       client.issues.removeLabel({
//         owner: github.context.repo.owner,
//         repo: github.context.repo.repo,
//         issue_number: prNumber,
//         name: label
//       })
//     )
//   );
// }

run();

