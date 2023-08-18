#!/bin/bash

while true; do
  rsync -av --delete ./file_server/file_service.proto ./node_server/file_service.proto
  rsync -av --delete ./file_server/file_server.cpp ./node_server/file_server.cpp
  sleep 60
done