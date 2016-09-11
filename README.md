# autoswitch-miner

### Prerequisites

Autoswitch-miner requires [Node.js](https://nodejs.org/) v4+, npm and pm2 to run.
Additionally cpuminer-opt binary is needed:

https://bitcointalk.org/index.php?topic=1326803.0


### Installation

```sh
git clone https://github.com/felixbrucker/autoswitch-miner
cd autoswitch-miner
git submodule init
npm install
npm install pm2 -g
```

On Windows you will need to get the miner binaries manually and place them in "bin", Linux users get the required binaries with the "update.sh" script

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

note: windows users need the following instead:

```sh
npm install pm2-windows-startup -g
pm2-startup install
pm2 save
```

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
