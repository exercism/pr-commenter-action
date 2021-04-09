// const core = require('@actions/core');
// const github = require('@actions/github');
//
// try {
//   console.log(`Hello, World!`);
//   const payload = JSON.stringify(github.context.payload, undefined, 2)
//   console.log(`The event payload: ${payload}`);
// } catch (error) {
//   core.setFailed(error.message);
// }

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as yaml from "js-yaml";
import { Minimatch } from "minimatch";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const configPath = core.getInput("config-file", { required: true });

    const prNumber = getPrNumber();
    if (!prNumber) {
      console.log("Could not get pull request number from context, exiting");
      return;
    }

    const client = new github.GitHub(token);

    const { data: pullRequest } = await client.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber
    });

    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles = await getChangedFiles(client, prNumber);
    // const labelGlobs = await getLabelGlobs(
    //   client,
    //   configPath
    // );
    //
    // const labels = [];
    // const labelsToRemove = [];
    // for (const [label, globs] of labelGlobs.entries()) {
    //   core.debug(`processing ${label}`);
    //   if (checkGlobs(changedFiles, globs)) {
    //     labels.push(label);
    //   } else if (pullRequest.labels.find(l => l.name === label)) {
    //     labelsToRemove.push(label);
    //   }
    // }
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

// async function getLabelGlobs(client, configurationPath) {
//   const configurationContent = await fetchContent(
//     client,
//     configurationPath
//   );
//
//   // loads (hopefully) a `{[label:string]: string | StringOrMatchConfig[]}`, but is `any`:
//   const configObject = yaml.safeLoad(configurationContent);
//
//   // transform `any` => `Map<string,StringOrMatchConfig[]>` or throw if yaml is malformed:
//   return getLabelGlobMapFromObject(configObject);
// }

// async function fetchContent(client, repoPath) {
//   const response = await client.repos.getContents({
//     owner: github.context.repo.owner,
//     repo: github.context.repo.repo,
//     path: repoPath,
//     ref: github.context.sha
//   });
//
//   return Buffer.from(response.data.content, response.data.encoding).toString();
// }
//
// function getLabelGlobMapFromObject(configObject) {
//   const labelGlobs = new Map();
//   for (const label in configObject) {
//     if (typeof configObject[label] === "string") {
//       labelGlobs.set(label, [configObject[label]]);
//     } else if (configObject[label] instanceof Array) {
//       labelGlobs.set(label, configObject[label]);
//     } else {
//       throw Error(
//         `found unexpected type for label ${label} (should be string or array of globs)`
//       );
//     }
//   }
//
//   return labelGlobs;
// }

// function toMatchConfig(config) {
//   if (typeof config === "string") {
//     return {
//       any: [config]
//     };
//   }
//
//   return config;
// }

// function printPattern(matcher) {
//   return (matcher.negate ? "!" : "") + matcher.pattern;
// }
//
// function checkGlobs(changedFiles, globs) {
//   for (const glob of globs) {
//     core.debug(` checking pattern ${JSON.stringify(glob)}`);
//     const matchConfig = toMatchConfig(glob);
//     if (checkMatch(changedFiles, matchConfig)) {
//       return true;
//     }
//   }
//   return false;
// }

// function isMatch(changedFile, matchers) {
//   core.debug(`    matching patterns against file ${changedFile}`);
//   for (const matcher of matchers) {
//     core.debug(`   - ${printPattern(matcher)}`);
//     if (!matcher.match(changedFile)) {
//       core.debug(`   ${printPattern(matcher)} did not match`);
//       return false;
//     }
//   }
//
//   core.debug(`   all patterns matched`);
//   return true;
// }

// // equivalent to "Array.some()" but expanded for debugging and clarity
// function checkAny(changedFiles, globs) {
//   const matchers = globs.map(g => new Minimatch(g));
//   core.debug(`  checking "any" patterns`);
//   for (const changedFile of changedFiles) {
//     if (isMatch(changedFile, matchers)) {
//       core.debug(`  "any" patterns matched against ${changedFile}`);
//       return true;
//     }
//   }
//
//   core.debug(`  "any" patterns did not match any files`);
//   return false;
// }

// // equivalent to "Array.every()" but expanded for debugging and clarity
// function checkAll(changedFiles, globs) {
//   const matchers = globs.map(g => new Minimatch(g));
//   core.debug(` checking "all" patterns`);
//   for (const changedFile of changedFiles) {
//     if (!isMatch(changedFile, matchers)) {
//       core.debug(`  "all" patterns did not match against ${changedFile}`);
//       return false;
//     }
//   }
//
//   core.debug(`  "all" patterns matched all files`);
//   return true;
// }

// function checkMatch(changedFiles, matchConfig) {
//   if (matchConfig.all !== undefined) {
//     if (!checkAll(changedFiles, matchConfig.all)) {
//       return false;
//     }
//   }
//
//   if (matchConfig.any !== undefined) {
//     if (!checkAny(changedFiles, matchConfig.any)) {
//       return false;
//     }
//   }
//
//   return true;
// }
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

