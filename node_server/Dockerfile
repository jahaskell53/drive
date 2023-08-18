# TO RUN: docker build -t node_server . && docker run -it -p 5001:50051 node_server

# Use grpc/cxx base image
FROM node

# Set the working directory to /app
WORKDIR /app

# # create directory

# RUN mkdir node_server
# RUN mkdir file_server

# Copy the current directory into the container at /app
COPY . /app

# COPY ../file_server/ /app/file_server/

RUN node node_client.js