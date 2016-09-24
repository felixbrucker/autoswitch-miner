cd ..
if not exist "cpuminer-opt-binary" git clone https://github.com/felixbrucker/cpuminer-opt-binary
cd cpuminer-opt-binary
git pull
if not exist "..\autoswitch-miner\bin" mkdir ..\autoswitch-miner\bin
copy /Y cpuminer-core-avx-i.exe ..\autoswitch-miner\bin\cpuminer.exe
copy /Y *.dll ..\autoswitch-miner\bin\
cd ..\autoswitch-miner
git pull
call npm update
call npm start