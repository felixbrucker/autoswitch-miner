#!/usr/bin/env bash
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$1" == "run" ]; then
  echo 'checking submodules, please wait ...'
  find cpuminer-opt -maxdepth 0 -empty -exec git submodule init \;
  find cpuminer-xzc -maxdepth 0 -empty -exec git clone https://github.com/felixbrucker/cpuminer-xzc \;
  prevVersion1=`git submodule status cpuminer-opt`
  git submodule update --recursive --remote
  currVersion1=`git submodule status cpuminer-opt`
  if [ "$prevVersion1" != "$currVersion1" ]; then
    echo 'newer cpuminer-opt version available, building ...'
    sleep 2
    cd cpuminer-opt
    cp /app/.apt/usr/include/x86_64-linux-gnu/gmp.h .
    minerVer=`git describe --abbrev=0 --tags`
    sed -i -- 's/\[cpuminer-multi\]/\[cpuminer-opt\]/g' configure.ac
    sed -i -- "s/, \[1.2-dev\]/, \[${minerVer}\]/g" configure.ac
    ./build.sh
    mkdir -p ../bin
    cp cpuminer ../bin/
    git reset --hard
    cd ..
  fi
  cd cpuminer-xzc
  cp /app/.apt/usr/include/x86_64-linux-gnu/gmp.h .
  ./build.sh
  mkdir -p ../bin
  cp cpuminer ../bin/cpuminer-xzc
  git reset --hard
  cd ..
  npm update
  pm2 start process.json
  pm2 save
else
  pm2 stop autoswitch-miner --watch autoswitch-miner
  echo 'getting latest updates ...'
  git pull
  ./update.sh run
fi
