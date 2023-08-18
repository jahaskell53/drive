# TO RUN: 
# docker build -t file_server . && docker run -it -p 5001:50051 file_server

# Use grpc/cxx base image
FROM grpc/cxx

# Set the working directory to /app
WORKDIR /app

# Copy the current directory into the container at /app
COPY . /app

# Add the current directory to the proto_path
ENV PROTOBUF_IMPORT_PATH=/app

RUN echo "deb http://archive.debian.org/debian stretch main" > /etc/apt/sources.list

RUN apt-get update

RUN apt-get install protobuf-compiler -y

RUN protoc -I=/app --cpp_out=/app /app/file_service.proto

# Run protoc command to generate grpc code
RUN protoc -I /app --grpc_out=. --plugin=protoc-gen-grpc=`which grpc_cpp_plugin` file_service.proto

RUN g++ -std=c++11 -I/usr/local/include -pthread file_server.cpp file_service.pb.cc file_service.grpc.pb.cc -L/usr/local/lib `pkg-config --libs grpc++ grpc` -Wl,--no-as-needed -lgrpc++_reflection -Wl,--as-needed -lprotobuf -ldl -o file_server

# RUN /app/file_server 

EXPOSE 50051