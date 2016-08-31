#!/usr/bin/env bash
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -d "autoswitch-miner" ]; then
  git clone --branch cloud https://github.com/felixbrucker/autoswitch-miner
  cd autoswitch-miner
  npm install
  ./start.sh
fi
