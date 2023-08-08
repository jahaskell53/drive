"use strict";
exports.__esModule = true;
var file_service_grpc_pb_1 = require("../file_client_ts/src/generated/file_service_grpc_pb");
var file_service_pb_1 = require("../file_client_ts/src/generated/file_service_pb");
var client = new file_service_grpc_pb_1.FileServiceClient(
  "http://localhost:5001",
  null,
  null
);
var fileRequest = new file_service_pb_1.FileRequest();
client.uploadFile(fileRequest, {}, function (error, response) {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Response:", response.getMessage());
  }
});
