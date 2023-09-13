FROM grpc/cxx
# docker build -t db_server . && docker run -it -p 5002:50051 db_server
# Use grpc/cxx base image

# Set the working directory to /app
WORKDIR /app

# Copy the current directory into the container at /app
COPY . /app

# Add the current directory to the proto_path
ENV PROTOBUF_IMPORT_PATH=/app

RUN echo "deb http://archive.debian.org/debian stretch main" > /etc/apt/sources.list

RUN apt-get update

RUN apt-get install protobuf-compiler -y
RUN apt-get install libsqlite3-dev -y
RUN protoc --grpc_out=. --plugin=protoc-gen-grpc=`which grpc_cpp_plugin` files.proto 
RUN protoc --cpp_out=. files.proto
RUN g++ db_server.cpp files.pb.cc files.grpc.pb.cc -o db_server `pkg-config --cflags --libs protobuf grpc++` -lsqlite3

CMD ["./db_server"]
