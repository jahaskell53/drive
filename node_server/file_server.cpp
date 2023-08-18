#include <iostream>
#include <fstream>
#include <memory>
#include <string>
#include <grpc++/grpc++.h>
#include "file_service.grpc.pb.h"
#include <sys/stat.h>

using files::DownloadFileRequest;
using files::FileChunk;
using files::FileResponse;
using files::FileService;
using files::UploadFileRequest;
using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::ServerReader;
using grpc::ServerWriter;
using grpc::Status;

class FileServiceImpl final : public FileService::Service
{
  Status UploadFile(ServerContext *context, const UploadFileRequest *request,
                    FileResponse *reply) override
  {

    // Create the "uploads" folder if it doesn't exist
    if (mkdir("uploads", 0777) != 0 && errno != EEXIST)
    {
      std::cout << "Error creating 'uploads' folder." << std::endl;
      return Status(grpc::StatusCode::INTERNAL, "Error creating 'uploads' folder.");
    }
    // Save the uploaded file to a specific location and generate a file ID.
    std::string file_id = "FILE-" + std::to_string(std::rand() % 1000);
    std::ofstream file_stream("uploads/" + file_id);
    file_stream.write(request->file_content().data(), request->file_content().size());
    file_stream.close();
    std::cout << "File with file id " << file_id << " uploaded successfully." << std::endl;
    reply->set_file_id(file_id);
    reply->set_message("File uploaded successfully.");
    return Status::OK;
  }

  Status DownloadFile(ServerContext *context, const DownloadFileRequest *request,
                      ServerWriter<FileChunk> *writer) override
  {
    // Read the file content and send it back to the client in chunks.
    std::ifstream file_stream("uploads/" + request->file_id(), std::ios::binary);
    if (!file_stream)
    {
      std::cout << "File not found." << std::endl;
      return Status(grpc::StatusCode::NOT_FOUND, "File not found.");
    }

    char buffer[4096];
    std::streamsize bytesRead;
    while ((bytesRead = file_stream.readsome(buffer, sizeof(buffer))) > 0)
    {
      std::cout << "Sending file chunk of size " << bytesRead << std::endl;
      FileChunk chunk;
      chunk.set_chunk_data(buffer, bytesRead);
      writer->Write(chunk);
    }

    std::cout << "File with file id " << request->file_id() << " downloaded successfully." << std::endl;

    return Status::OK;
  }
};

void RunServer()
{
  std::string server_address("0.0.0.0:50051");
  FileServiceImpl service;

  ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  std::unique_ptr<Server> server(builder.BuildAndStart());
  std::cout << "Server listening on " << server_address << std::endl;

  server->Wait();
}

int main()
{
  RunServer();
  return 0;
}
