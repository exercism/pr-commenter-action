# How to make a release

1. Update the version in `CHANGELOG.md`, `package.json`, and in the workflow example in `README.md`.
2. Make a build with `npm run build`. It should produce a new `dist/index.js` file. It needs to be committed in.
3. Commit the above changes and tag the release with `git commit -m 'vX.Y.Z'`, `git tag -a 'vX.Y.Z' -m 'vX.Y.Z'`, `git push --follow-tags`.
