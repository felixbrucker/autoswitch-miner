# autoswitch-miner

CURRENTLY NOT MAINTAINED!

auto profit switching monitoring software for cpu and gpu mining (nvidia)

uses nicehash and zpool api via https://github.com/felixbrucker/profitability-service (soon to be integrated as git submodule)


### Prerequisites

Autoswitch-miner requires nodejs, npm and optionally pm2 to run.
Additionally cpuminer-opt and ccminer binary are needed for cpu and gpu mining:

cpuminer opt: https://bitcointalk.org/index.php?topic=1326803.0
ccminer: https://github.com/tpruvot/ccminer

### Installation

```sh
git clone https://github.com/felixbrucker/autoswitch-miner
cd autoswitch-miner
git submodule init
npm install
npm install pm2 -g
```

On Windows and Linux you get the required binaries with the "startTemplate.bat" and the "update.sh" script (currently only cpuminer-opt)

### Run

```sh
pm2 start process.json
```

or

```sh
npm start
```

to startup on boot:

```sh
pm2 save
pm2 startup
```

note: windows users need the following instead for pm2:

```sh
npm install pm2-windows-startup -g
pm2-startup install
pm2 save
```

or just modify startTemplate.bat file to match your preferred compile and save as start.bat to not interfere with git updates

### Update software (and miners on linux)

on Linux run ``` update.sh ```

on Windows run ``` git pull ```


### Todos

 - Error handling
 - Properly use async Methods
 - Properly send responses to indicate the result to frontend
 - Add Code Comments
 - Write Tests


License
----

GNU GPLv3 (see LICENSE)
