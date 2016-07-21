# autoswitch-miner

### Prerequisites

Autoswitch-miner requires [Node.js](https://nodejs.org/) v4+ to run.
Additionally cpuminer-opt binary is needed:

 - Windows: included
 - Linux: included, you might need to install dependencies with:

```sh
$ sudo apt-get install libjansson-dev libssl-dev libcurl4-openssl-dev
```

or build it yourself:

```sh
$ sudo apt-get install build-essential libssl-dev libcurl4-openssl-dev libjansson-dev libgmp-dev automake
$ cd cpuminer-opt-3.3.7
$ ./build.sh
$ cp cpuminer ../autoswitch-miner/bin/
```

### Installation

```sh
$ git clone https://github.com/felixbrucker/autoswitch-miner
$ cd autoswitch-miner
$ npm install
```

### Run

```sh
$ npm start
```

### Todos

 - Error handling
 - Properly use async Methods
 - Properly send responses to indicate the result to frontend
 - Add Code Comments
 - Write Tests


License
----

GNU GPLv3 (see LICENSE)
