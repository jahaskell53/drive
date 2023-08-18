import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
const PROTO_PATH = "./file_service.proto";

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

// TODO: add service
// client.addService(fileServiceProto.FileService.service, {});

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
    const call = client.DownloadFile(downloadRequest);
    let fileContent = [];

    call.on("data", (chunk) => {
      console.log("Received file data chunk");
      fileContent.push(Buffer.from(chunk.chunk_data));
    });


    call.on("end", () => {
      console.log("File downloaded successfully")
      resolve(Buffer.concat(fileContent));
    });

    call.on("error", (error) => {
      reject(error);
    });
  });
}
const uploadResponse = await uploadFile(fileRequest);
console.log("Response:", uploadResponse);
const downloadRequest = { file_id: uploadResponse.file_id };
console.log("Attempting to download file with id ", uploadResponse.file_id);
const downloadResponse = await downloadFile(downloadRequest);
console.log("Download Response (Binary):", downloadResponse.toString('binary'));

console.log("Download Response Length:", downloadResponse.length);
console.log("Download Response Content:", downloadResponse.toString()); // Print the buffer content as a string

for (let i = 0; i < downloadResponse.length; i++) {
  console.log(`Byte ${i}:`, downloadResponse[i]);
}


const decoder = new TextDecoder();
const downloadedStr = decoder.decode(downloadResponse.file_content); // Decode the file content
console.log("Download Response:", downloadedStr);
console.log("Buffer", Buffer.from(downloadResponse).toString()); // Print the raw buffer