FROM ubuntu:latest
MAINTAINER Felix Brucker

RUN echo 'APT::Install-Recommends "false";' > /etc/apt/apt.conf.d/zz-local-tame

RUN apt-get update && apt-get upgrade -y && apt-get install -y git-core nodejs nodejs-legacy npm libjansson-dev libcurl4-gnutls-dev

RUN git clone https://github.com/felixbrucker/autoswitch-miner

WORKDIR /autoswitch-miner

RUN npm install

CMD ["start.sh"]