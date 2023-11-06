# Drive

## Overview

The `Drive` project aims to provide a basic yet robust file storage system, using gRPC for inter-service communication and built using NodeJS and C++. The project is divided into multiple servers, each running in its own Docker container.

### Components

1. **Node Server (`node_server`)**: Implemented in JavaScript using Node.js and responsible for the user interface and API endpoints. Utilizes the gRPC client to communicate with the File Server.
2. **File Server (`file_server`)**: Built in C++ and acts as the storage layer. It handles the low-level read and write operations for storing files. The server communicates with the Node Server through gRPC.
3. **Database Server (`db_server`)**: The database layer where metadata about the stored files is kept. The File Server communicates with it using gRPC.

## Project Structure

- `README.md`: This file.
- `docker-compose.yml`: Used to define and run multi-container Docker applications.
- `node_server`: Directory containing the NodeJS server code.
- `file_server`: Directory containing the File Server code in C++.
- `db_server`: Directory for the Database Server.
- `sync.sh`: A bash script for data synchronization (if needed).

### Node Server (`node_server`)

#### Technologies and Libraries Used
- Node.js
- gRPC

#### Key Functionality
- Uploads files from the `uploads` folder to the File Server through gRPC.
- Downloads files from the File Server and saves them to the `downloads` folder.
- Deletes files after upload to clean up the `uploads` folder.
- Error handling and logging for various operations.

#### Environment Variables
- `FILE_SERVER_PORT_NUMBER`: The port number on which the File Server runs.

### File Server (`file_server`)

#### Technologies and Libraries Used
- C++
- gRPC via `grpc++`

#### Key Functionality
- Listens on port 50051 by default.
- Creates an "uploads" folder if not existing and writes incoming file data to it.
- Reads files in chunks for download operations.
- Communicates with the `db_server` to update file metadata.
- Error handling for file not found, internal server errors, etc.

### Database Server (`db_server`)

#### Technologies and Libraries Used
- C++
- SQLite3
- gRPC

#### Key Functionality

- Listens on port 50052 by default.
- Uses SQLite3 for storing metadata related to files. The SQLite database is named `fileinfo.db`.
- Responsible for creating the database table if it doesn't already exist.
- Manages the following CRUD operations:
  - `UploadFileInfo`: Inserts metadata (file name, file size, owner) into the database.
  - `DownloadFileInfo`: Retrieves metadata based on the file name and returns it.
  - `RemoveFileInfo`: Deletes metadata from the database based on the file name.

#### Database Schema

The SQLite database (`fileinfo.db`) consists of a table named `files` with the following columns:

- `file_name`: Name of the file (Type: TEXT)
- `file_size`: Size of the file in bytes (Type: INTEGER)
- `owner`: Owner or uploader of the file (Type: TEXT)

#### Environment Variables

- `NODE_SERVER_PORT_NUMBER`: The port number on which the Node Server runs.
- `FILE_SERVER_PORT_NUMBER`: The port number on which the File Server runs.

#### Initialization and Configuration

The database is initialized when the server starts, and the `files` table is created if it doesn't exist. No additional configuration is needed unless you plan to customize the database schema.

#### How the Database Server Works with File Server

The File Server uses gRPC calls to interact with the Database Server for all metadata operations. When a new file is uploaded to the File Server, it sends a `UploadFileInfo` call to store the metadata. Likewise, when a file is requested or deleted, corresponding `DownloadFileInfo` and `RemoveFileInfo` calls are made.

---

## How to Run

1. Build and run the file_server:

```bash
docker build -t file_server . && docker run -it -p 5001:50051 --network=my_custom_network file_server
```

2. Build and run the db_server

```bash
docker build -t db_server . && docker run -it -p 5002:50051 
--network=my_custom_network db_server
```

## Network Configuration

This project uses a custom Docker network (`my_custom_network`) to ensure that containers can communicate with each other by container name. Ensure that you run all containers on this network.

## Troubleshooting

- Make sure that all services are running on the same custom network.
- Ensure the `FILE_SERVER_PORT_NUMBER` is correctly configured in `.env` for the Node Server.
- Look at container logs using `docker logs <container_id>` for any issues during runtime.

## Notes

- Files are uploaded from uploads folder to a server, which stores them under a name that is randomly generated, and sends back that randomly generated name
- Files in uploads folder are deleted after upload. 

## Future Enhancements

- Introduce a front-end layer for better user interaction.
- Implement a caching layer for faster file retrievals.
- Add database migrations and seeders for easier DB management.
  
Feel free to contribute to this project by opening issues or submitting pull requests.

## License

GNU GPLv3

---
