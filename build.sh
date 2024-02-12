#!/bin/bash
docker build -t mrsleeps/frigate-timelapser .
echo "What is the version number?"
read versionNumber
docker images | grep frigate-timelapser
echo "What is the docker hash?"
read dockerHash
dockerString="docker tag ${dockerHash} mrsleeps/frigate-timelapser:${versionNumber}"
dockerPushOne="docker push mrsleeps/frigate-timelapser:${versionNumber}"
dockerPushTwo="docker push mrsleeps/frigate-timelapser:latest"
eval $dockerString
eval $dockerPushOne
eval $dockerPushTwo
