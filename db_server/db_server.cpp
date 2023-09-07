#include <iostream>
#include <grpc++/grpc++.h>
#include <sqlite3.h>

#include "files.grpc.pb.h" // Generated from your .proto file

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::Status;

using files::DbService;
using files::FileInfo;
using files::FileInfoRequest;
using files::FileInfoResponse;

class DbServiceImpl final : public DbService::Service {
    sqlite3* db;

public:
    DbServiceImpl() {
        // Initialize SQLite database
        if (sqlite3_open("fileinfo.db", &db)) {
            std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
            exit(1);
        }
        // Create table if not exists
        const char* createTableSql = "CREATE TABLE IF NOT EXISTS files(file_name TEXT, file_size INTEGER, owner TEXT);";
        sqlite3_exec(db, createTableSql, 0, 0, 0);
    }

    Status UploadFileInfo(ServerContext* context, const FileInfo* request, FileInfoResponse* response) override {
        // Insert into database
        sqlite3_stmt* stmt;
        const char* insertSql = "INSERT INTO files (file_name, file_size, owner) VALUES (?, ?, ?);";
        sqlite3_prepare_v2(db, insertSql, -1, &stmt, 0);
        sqlite3_bind_text(stmt, 1, request->file_name().c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_int(stmt, 2, request->file_size());
        sqlite3_bind_text(stmt, 3, request->owner().c_str(), -1, SQLITE_STATIC);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        response->set_file_name(request->file_name());
        response->set_message("File info uploaded successfully.");
        return Status::OK;
    }

    Status DownloadFileInfo(ServerContext* context, const FileInfoRequest* request, FileInfo* response) override {
        // Query from database
        sqlite3_stmt* stmt;
        const char* querySql = "SELECT * FROM files WHERE file_name = ?;";
        sqlite3_prepare_v2(db, querySql, -1, &stmt, 0);
        sqlite3_bind_text(stmt, 1, request->file_name().c_str(), -1, SQLITE_STATIC);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            response->set_file_name((const char*)sqlite3_column_text(stmt, 0));
            response->set_file_size(sqlite3_column_int(stmt, 1));
            response->set_owner((const char*)sqlite3_column_text(stmt, 2));
        } else {
            return Status(grpc::NOT_FOUND, "File not found");
        }
        sqlite3_finalize(stmt);

        return Status::OK;
    }

    Status RemoveFileInfo(ServerContext* context, const FileInfoRequest* request, FileInfoResponse* response) override {
        // Delete from database
        sqlite3_stmt* stmt;
        const char* deleteSql = "DELETE FROM files WHERE file_name = ?;";
        sqlite3_prepare_v2(db, deleteSql, -1, &stmt, 0);
        sqlite3_bind_text(stmt, 1, request->file_name().c_str(), -1, SQLITE_STATIC);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        response->set_file_name(request->file_name());
        response->set_message("File info removed successfully.");
        return Status::OK;
    }
};

int main(int argc, char** argv) {
    std::string server_address("0.0.0.0:50051");
    DbServiceImpl service;

    ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<Server> server(builder.BuildAndStart());
    std::cout << "Server listening on " << server_address << std::endl;

    server->Wait();
    return 0;
}
