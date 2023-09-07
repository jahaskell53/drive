#include <iostream>
#include <fstream>
#include <memory>
#include <string>
#include <grpc++/grpc++.h>
#include "file_service.grpc.pb.h"
#include <sys/stat.h>
#include "files.grpc.pb.h"

using files::DbService; // Assume the DB service's name
// using files::DownloadFileInfo;
using files::DownloadFileRequest;
using files::FileChunk;
using files::FileResponse;
using files::FileService;
using files::DbFileInfo;
using files::DbFileInfoResponse;


// using files::RemoveFileInfoRequest;
// using files::UploadFileInfoRequest;
using files::UploadFileRequest;
using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::ServerReader;
using grpc::ServerWriter;
using grpc::Status;
using grpc::ClientContext;
using namespace std;

class FileServiceImpl final : public FileService::Service
{

  // Assuming a DbService client is part of the FileServiceImpl
  unique_ptr<DbService::Stub> db_stub_;

public:
  FileServiceImpl() : db_stub_(DbService::NewStub(
                          grpc::CreateChannel("localhost:5002", grpc::InsecureChannelCredentials()))) {}

  Status UploadFile(ServerContext *context, const UploadFileRequest *request,
                    FileResponse *reply) override
  {

    // Create the "uploads" folder if it doesn't exist
    if (mkdir("uploads", 0777) != 0 && errno != EEXIST)
    {
      cout << "Error creating 'uploads' folder." << endl;
      return Status(grpc::StatusCode::INTERNAL, "Error creating 'uploads' folder.");
    }
    // if file name ends with an extension, extract extension
    string file_ext = "";
    request->file_name();
    for (int i = request->file_name().length() - 1; i >= 0; i--)
    {
      if (request->file_name()[i] == '.')
      {
        file_ext = request->file_name().substr(i);
        break;
      }
    }
    // Save the uploaded file to a specific location and generate a file ID.
    string file_name = "FILE-" + to_string(rand() % 10000000000000) + file_ext;
    ofstream file_stream("uploads/" + file_name);
    file_stream.write(request->file_content().data(), request->file_content().size());
    file_stream.close();
    cout << "File with file id " << file_name << " uploaded successfully." << endl;
    reply->set_file_name(file_name);
    reply->set_message("File uploaded successfully.");

    // Log to DB
    DbFileInfo db_file_info;
    DbFileInfoResponse db_file_info_response;
    ClientContext db_context;

    // Populate the DbFileInfo message
    db_file_info.set_file_name(file_name);
    db_file_info.set_file_size(request->file_content().size()); // Assuming this is the file size
    db_file_info.set_owner("some_owner");                       // Replace with the actual owner if you have that information

    // Make the gRPC call to the DbService
    Status db_status = db_stub_->UploadFileInfo(&db_context, db_file_info, &db_file_info_response);

    // Check the status of the gRPC call
    if (db_status.ok())
    {
      cout << "Uploaded file info to DB: " << db_file_info_response.file_name() << endl;
      cout << "DB message: " << db_file_info_response.message() << endl;
    }
    else
    {
      cout << "Failed to upload file info to DB: " << db_status.error_message() << endl;
      // Handle error accordingly, perhaps by modifying the 'reply' object or returning an error Status.
    }

    return Status::OK;
  }

  Status DownloadFile(ServerContext *context, const DownloadFileRequest *request,
                      ServerWriter<FileChunk> *writer) override
  {
    // Read the file content and send it back to the client in chunks.
    ifstream file_stream("uploads/" + request->file_name(), ios::binary);
    if (!file_stream)
    {
      cout << "File not found." << endl;
      return Status(grpc::StatusCode::NOT_FOUND, "File not found.");
    }

    char buffer[4096];
    streamsize bytesRead;
    while ((bytesRead = file_stream.readsome(buffer, sizeof(buffer))) > 0)
    {
      cout << "Sending file chunk of size " << bytesRead << endl;
      FileChunk chunk;
      chunk.set_chunk_data(buffer, bytesRead);
      writer->Write(chunk);
    }

    cout << "File with file id " << request->file_name() << " downloaded successfully." << endl;

    return Status::OK;
  }

  // TODO: remove  and replace with using namespace std;

  // remove file
  Status RemoveFile(ServerContext *context, const DownloadFileRequest *request,
                    FileResponse *reply) override
  {
    string file_name = request->file_name();
    string file_path = "uploads/" + file_name;
    if (remove(file_path.c_str()) != 0)
    {
      cout << "Error deleting file." << endl;
      return Status(grpc::StatusCode::INTERNAL, "Error deleting file.");
    }
    cout << "File with file id " << file_name << " deleted successfully." << endl;
    reply->set_message("File deleted successfully.");
    return Status::OK;
  }
};

void RunServer()
{
  string server_address("0.0.0.0:50051");
  FileServiceImpl service;

  ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  unique_ptr<Server> server(builder.BuildAndStart());
  cout << "Server listening on " << server_address << endl;

  server->Wait();
}

int main()
{
  RunServer();
  return 0;
}
