import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
const PROTO_PATH = "./file_service.proto";
import fs from "fs";

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

// const str = "what are you doing enock";
// const encoder = new TextEncoder();
// const bytes = encoder.encode(str);

// upload all files from uploads folder
const files = fs.readdirSync("./uploads");
console.log("Files:", files);
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const fileContent = fs.readFileSync(`./uploads/${file}`);
  const fileRequest = {
    file_name: file,
    file_content: fileContent,
  };
  console.log("Uploading file:", file);
  const uploadResponse = await uploadFile(fileRequest);
  console.log("Response:", uploadResponse);
  const downloadRequest = { file_id: uploadResponse.file_id };
  console.log("Attempting to download file with id ", uploadResponse.file_id);
  const downloadResponse = await downloadFile(downloadRequest);
  console.log(
    "Download Response (Binary):",
    downloadResponse.toString("binary")
  );

  console.log("Download Response Length:", downloadResponse.length);
  console.log("Download Response Content:", downloadResponse.toString()); // Print the buffer content as a string

  for (let i = 0; i < downloadResponse.length; i++) {
    console.log(`Byte ${i}:`, downloadResponse[i]);
  }

  const decoder = new TextDecoder();
  const downloadedStr = decoder.decode(downloadResponse.file_content); // Decode the file content

  console.log("Buffer: ", Buffer.from(downloadResponse).toString()); // Print the raw buffer

  // also download the file to a folder for downloads on client side
  console.log("Download Response:", downloadedStr);
  console.log("download: ", downloadedStr);
  fs.writeFileSync(
    `./downloads/${uploadResponse.file_id}`,
    Buffer.from(downloadResponse)
  );
}

// remove all files in uploads
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  fs.unlinkSync(`./uploads/${file}`);
}

// // remove some files
removeFile({ file_id: "FILE-1804289383.png" });

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

    call.on("data", chunk => {
      console.log("Received file data chunk");
      fileContent.push(Buffer.from(chunk.chunk_data));
    });

    call.on("end", () => {
      console.log("File downloaded successfully");
      resolve(Buffer.concat(fileContent));
    });

    call.on("error", error => {
      reject(error);
    });
  });
}

async function removeFile(fileRequest) {
  return new Promise((resolve, reject) => {
    client.RemoveFile(fileRequest, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}
