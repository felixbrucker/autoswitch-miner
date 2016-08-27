# autoswitch-miner

### Prerequisites

Autoswitch-miner requires [Node.js](https://nodejs.org/) v4+ to run.
Additionally cpuminer-opt binary is needed:

https://bitcointalk.org/index.php?topic=1326803.0


### Installation

```sh
$ git clone https://github.com/felixbrucker/autoswitch-miner
$ cd autoswitch-miner
$ git submodule init
$ npm install
```

On Windows you will need to get the miner binaries manually and place them in "bin", Linux users get the required binaries with the "start.sh" script

### Run

on Linux run "start.sh"

on Windows run "npm start"


### Todos

 - Error handling
 - Properly use async Methods
 - Properly send responses to indicate the result to frontend
 - Add Code Comments
 - Write Tests


License
----

GNU GPLv3 (see LICENSE)
