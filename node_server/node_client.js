import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
const PROTO_PATH = "./file_service.proto";
import fs from "fs";

// import .env variables from parent directory
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const fileServiceProto = grpc.loadPackageDefinition(packageDefinition).files;
const FILE_SERVER_PORT_NUMBER = process.env.FILE_SERVER_PORT_NUMBER; // get port number from .env file
if (!FILE_SERVER_PORT_NUMBER) {
  throw new Error("FILE_SERVER_PORT_NUMBER not set");
}
const client = new fileServiceProto.FileService( `localhost:${FILE_SERVER_PORT_NUMBER}`,
grpc.credentials.createInsecure()
);


// upload all files from uploads folder
const files = fs.readdirSync("./uploads");
console.log("Files:", files);
for (let i = 0; i < files.length; i++) {
  const fileName = files[i];
  const fileContent = fs.readFileSync(`./uploads/${fileName}`);
  const fileRequest = {
    file_name: fileName,
    file_content: fileContent,
  };
  console.log("Uploading file:", fileName);
  const uploadResponse = await uploadFile(fileRequest);
  console.log("Response:", uploadResponse);
  const downloadRequest = { file_name: uploadResponse.file_name };
  console.log("Attempting to download file with id ", uploadResponse.file_name);
  const downloadResponse = await downloadFile(downloadRequest);
  // console.log(
  //   "Download Response (Binary):",
  //   downloadResponse.toString("binary")
  // );

  // console.log("Download Response Length:", downloadResponse.length);
  // console.log("Download Response Content:", downloadResponse.toString()); // Print the buffer content as a string

  // for (let i = 0; i < downloadResponse.length; i++) {
  //   console.log(`Byte ${i}:`, downloadResponse[i]);
  // }

  const decoder = new TextDecoder();
  const downloadedStr = decoder.decode(downloadResponse.file_content); // Decode the file content

  // console.log("Buffer: ", Buffer.from(downloadResponse).toString()); // Print the raw buffer

  // also download the file to a folder for downloads on client side
  // console.log("Download Response:", downloadedStr);
  // console.log("download: ", downloadedStr);
  fs.writeFileSync(
    `./downloads/${uploadResponse.file_name}`,
    Buffer.from(downloadResponse)
  );
}

// remove all files in uploads
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  fs.unlinkSync(`./uploads/${file}`);
}

// // remove some files
// removeFile({ file_name: "FILE-1804289383.png" });

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
