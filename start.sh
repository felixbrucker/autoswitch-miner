#!/usr/bin/env bash
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
prevVersion1=`git submodule status cpuminer-opt`
prevVersion2=`git submodule status cpuminer-multi`
git pull
git submodule update --recursive --remote
currVersion1=`git submodule status cpuminer-opt`
currVersion2=`git submodule status cpuminer-multi`
if [ "$prevVersion1" != "$currVersion1" ]; then
  cd cpuminer-opt
  ./build.sh
  mkdir -p ../bin
  cp cpuminer ../bin/
  git reset --hard
  cd ..
fi
if [ "$prevVersion2" != "$currVersion2" ]; then
  cd 'cpuminer-multi'
  # ugly fix
  sed -i -- 's/lyra2.h/Lyra2.h/g' lyra2/Lyra2.c
  sed -i -- 's/lyra2.h/Lyra2.h/g' lyra2/Sponge.c
  sed -i -- 's/sponge.h/Sponge.h/g' lyra2/Lyra2.c
  sed -i -- 's/sponge.h/Sponge.h/g' lyra2/Sponge.c
  ./build.sh
  mkdir -p ../bin
  cp cpuminer ../bin/cpuminer-multi
  git reset --hard
  cd ..
fi
npm update
npm start
