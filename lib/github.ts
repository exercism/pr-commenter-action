import * as github from '@actions/github';
import * as core from '@actions/core';
import { Comment } from './comment';

export type OctokitClient = ReturnType<typeof github.getOctokit>;

type RemoteDefinition = {
  owner: string;
  repo: string;
  path: string;
  ref: string;
}

async function deleteComment(client: OctokitClient, comment: Comment): Promise<void> {
  await client.rest.issues.deleteComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment_id: comment.id,
  });
}

async function editComment(client: OctokitClient, comment: Comment, newBody: string): Promise<void> {
  await client.rest.issues.updateComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment_id: comment.id,
    body: newBody,
  });
}

async function createComment(client: OctokitClient, prNumber: number, body: string): Promise<void> {
  await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    body,
  });
}

async function getChangedFiles(client: OctokitClient, prNumber: number): Promise<string[]> {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  const listFilesResponse = await client.paginate<{filename: string}>(listFilesOptions);
  const changedFiles = listFilesResponse.map((f) => f.filename);

  core.debug('found changed files:');
  for (const file of changedFiles) {
    core.debug(`  ${file}`);
  }

  return changedFiles;
}

async function getFileContent(client: OctokitClient, repoPath: string): Promise<string> {
  let remoteDefn: RemoteDefinition = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha,
  };

  if (repoPath.includes('@')) {
    const regex = /^(.+?)\/(.+?)@(.+?):(.+?)$/;
    const match = repoPath.match(regex);

    if (match) {
      // eslint-disable-next-line no-unused-vars
      const [, org, repo, ref, path] = match;
      remoteDefn = {
        owner: org,
        repo,
        path,
        ref,
      };
    }
  }

  core.info(`Fetching file: ${JSON.stringify({ remoteDefn })}`);

  const response = await client.rest.repos.getContent(remoteDefn);

  if ('content' in response.data && 'encoding' in response.data) {
    return Buffer.from(response.data.content, response.data.encoding as BufferEncoding).toString();
  }

  throw new Error('Unexpected response format from getContent');
}

async function getComments(client: OctokitClient, prNumber: number): Promise<Comment[]> {
  const { data: comments } = await client.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
  });

  return comments;
}

export {
  deleteComment,
  editComment,
  createComment,
  getChangedFiles,
  getFileContent,
  getComments,
};
