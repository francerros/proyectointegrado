#!/bin/bash
cd /home/rust/steamcmd || exit 1
./steamcmd.sh +login anonymous +force_install_dir /home/rust/rust-clean +app_update 258550 validate +quit
