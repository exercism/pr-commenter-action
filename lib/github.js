const github = require('@actions/github');
const core = require('@actions/core');

async function deleteComment(client, comment) {
  return client.issues.deleteComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment_id: comment.id,
  });
}

async function editComment(client, comment, newBody) {
  return client.issues.updateComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment_id: comment.id,
    body: newBody,
  });
}

async function createComment(client, prNumber, body) {
  return client.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    body,
  });
}

async function getChangedFiles(client, prNumber) {
  const listFilesOptions = client.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  const listFilesResponse = await client.paginate(listFilesOptions);
  const changedFiles = listFilesResponse.map((f) => f.filename);

  core.debug('found changed files:');
  for (const file of changedFiles) {
    core.debug(`  ${file}`);
  }

  return changedFiles;
}

async function getFileContent(client, repoPath) {
  const response = await client.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

async function getComments(client, prNumber) {
  const { data: comments } = await client.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
  });

  return comments;
}

module.exports = {
  deleteComment,
  editComment,
  createComment,
  getChangedFiles,
  getFileContent,
  getComments,
};
