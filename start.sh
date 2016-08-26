#!/usr/bin/env bash
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$1" == "run" ]; then
  echo 'checking submodules, please wait ...'
  prevVersion1=`git submodule status cpuminer-opt`
  prevVersion2=`git submodule status cpuminer-multi`
  git submodule update --recursive --remote
  currVersion1=`git submodule status cpuminer-opt`
  currVersion2=`git submodule status cpuminer-multi`
  if [ "$prevVersion1" != "$currVersion1" ]; then
    echo 'newer cpuminer-opt version available, building ...'
    sleep 2
    cd cpuminer-opt
    ./build.sh
    mkdir -p ../bin
    cp cpuminer ../bin/
    git reset --hard
    cd ..
  fi
  if [ "$prevVersion2" != "$currVersion2" ]; then
    echo 'newer cpuminer-multi version available, building ...'
    sleep 2
    cd 'cpuminer-multi'
    # ugly fix
    sed -i -- 's/lyra2.h/Lyra2.h/g' lyra2/Lyra2.c
    sed -i -- 's/lyra2.h/Lyra2.h/g' lyra2/Sponge.c
    sed -i -- 's/sponge.h/Sponge.h/g' lyra2/Lyra2.c
    sed -i -- 's/sponge.h/Sponge.h/g' lyra2/Sponge.c
    sed -i -- 's/ -flto//g' build.sh
    ./build.sh
    mkdir -p ../bin
    cp cpuminer ../bin/cpuminer-multi
    git reset --hard
    cd ..
  fi
  npm update
  npm start
else
  echo 'getting latest updates ...'
  git pull
  ./start.sh run 2>&1 | tee -a output.log
fi
