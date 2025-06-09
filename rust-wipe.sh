#!/bin/bash
cd /home/rust/rust-clean/server/myserver || exit 1
rm -f proceduralmap.*.map
rm -f proceduralmap.*.sav*
rm -f proceduralmap.*.dat
rm -f player.*.db
rm -f player.*.db-wal
