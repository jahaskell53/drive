import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
const PROTO_PATH = "../file_server/file_service.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const fileServiceProto = grpc.loadPackageDefinition(packageDefinition).files;

const client = new fileServiceProto.FileService(
  "localhost:5001",
  grpc.credentials.createInsecure()
);

const str = "hello";
const encoder = new TextEncoder();
const bytes = encoder.encode(str);
const fileRequest = { file_name: "file_name_1", file_content: bytes };

async function uploadFile(fileRequest) {
  return new Promise((resolve, reject) => {
    client.UploadFile(fileRequest, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

async function downloadFile(downloadRequest) {
  return new Promise((resolve, reject) => {
    client.DownloadFile(downloadRequest, (error, response) => {
      if (error) {
        reject(error);
      } else {
        console.log("Response:", response);
        resolve(response);
      }
    });
  });
}


    const uploadResponse = await uploadFile(fileRequest);
    console.log("Response:", uploadResponse);
    const downloadRequest = { file_id: uploadResponse.file_id };
    console.log("Attempting to download file with id ", uploadResponse.file_id);
    const downloadResponse = await downloadFile(downloadRequest);
    const decoder = new TextDecoder();
    const downloadedStr = decoder.decode(downloadResponse.file_content);
    console.log("Download Response:", downloadedStr);
    console.log("hi");
