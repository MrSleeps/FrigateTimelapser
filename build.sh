#!/bin/bash
# Version key/value should be on his own line
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

echo Building Timelapser v$PACKAGE_VERSION
docker build -t mrsleeps/frigate-timelapser .
#echo "What is the version number?"
#read versionNumber
docker images | grep frigate-timelapser
echo "What is the docker hash?"
read dockerHash
dockerString="docker tag ${dockerHash} mrsleeps/frigate-timelapser:${PACKAGE_VERSION}"
dockerPushOne="docker push mrsleeps/frigate-timelapser:${PACKAGE_VERSION}"
dockerPushTwo="docker push mrsleeps/frigate-timelapser:latest"
eval $dockerString
eval $dockerPushOne
eval $dockerPushTwo
