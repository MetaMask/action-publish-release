#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

KEY="${1}"
OUTPUT="${2}"
FILE="${3}"

if [[ -z $KEY ]]; then
  echo "Error: KEY not specified."
  exit 1
fi

if [[ -z $OUTPUT ]]; then
  echo "Error: OUTPUT not specified."
  exit 1
fi

if [[ -z $FILE ]]; then
  FILE="package.json"
fi

echo "::set-output name=$OUTPUT::$(jq --raw-output "$KEY" "$FILE")"
