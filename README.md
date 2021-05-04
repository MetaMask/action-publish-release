# MetaMask/action-publish-release

This repository can be used on its own but is better used along with: https://github.com/MetaMask/action-create-release-pr


Add the following Workflow File to your repository in the path `.github/workflows/publish-release.yml`


```
name: Publish Release

on:
  pull_request:
    types: [closed]

jobs:
  releases_merge:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{github.event.pull_request.head.ref}}
      - name: Get Node.js version
        id: nvm
        run: echo ::set-output name=NODE_VERSION::$(cat .nvmrc)
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ steps.nvm.outputs.NODE_VERSION }}
      - uses: MetaMask/action-publish-release@v0.0.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```
