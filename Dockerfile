FROM ubuntu:latest
MAINTAINER Felix Brucker

RUN echo 'APT::Install-Recommends "false";' > /etc/apt/apt.conf.d/zz-local-tame

RUN apt-get update && apt-get upgrade -y && apt-get install nodejs nodejs-legacy npm

ADD . ./autoswitch-miner

WORKDIR ./autoswitch-miner

RUN npm install

ENTRYPOINT ["npm start"]