#!/usr/bin/env bash

set -x
set -e
set -o pipefail

yarn setup
yarn build
