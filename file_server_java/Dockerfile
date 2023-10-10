FROM grpc/grpc/java-example-hostname
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
RUN protoc --java_out=src/main/java/ --grpc-java_out=src/main/java/ files.proto
RUN protoc --cpp_out=. files.proto
RUN mvn clean package

# expose port 5002
EXPOSE 50051

CMD ["java", "-jar", "target/jar-file.jar"]
