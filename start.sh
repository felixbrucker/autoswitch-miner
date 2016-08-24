#!/usr/bin/env bash
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
prevVersion=`git submodule status`
git pull
git submodule update --recursive --remote
currVersion=`git submodule status`
if [ "$prevVersion" != "$currVersion" ]; then
  cd cpuminer-opt
  ./build.sh
  mkdir -p ../bin
  cp cpuminer ../bin/
fi
npm update
npm start
