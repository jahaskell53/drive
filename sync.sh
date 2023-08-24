#!/bin/bash
# to run: bash sync.sh
while true; do
  rsync -av --delete ./file_server/file_service.proto ./node_server/file_service.proto
  sleep 60
done