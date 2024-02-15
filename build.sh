#!/bin/bash
# Version key/value should be on his own line
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

echo Building Timelapser v$PACKAGE_VERSION
docker build -t mrsleeps/frigate-timelapser .
