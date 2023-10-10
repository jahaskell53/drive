import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class FileServer {

    public static class DbServiceImpl extends DbServiceGrpc.DbServiceImplBase {
        private Connection conn;

        public DbServiceImpl() {
            try {
                conn = DriverManager.getConnection("jdbc:sqlite:fileinfo.db");
                conn.createStatement().execute("CREATE TABLE IF NOT EXISTS files(file_name TEXT, file_size INTEGER, owner TEXT);");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @Override
        public void uploadFileInfo(FileInfo request, StreamObserver<FileInfoResponse> responseObserver) {
            try {
                PreparedStatement stmt = conn.prepareStatement("INSERT INTO files (file_name, file_size, owner) VALUES (?, ?, ?);");
                stmt.setString(1, request.getFileName());
                stmt.setInt(2, request.getFileSize());
                stmt.setString(3, request.getOwner());
                stmt.executeUpdate();

                FileInfoResponse response = FileInfoResponse.newBuilder()
                        .setFileName(request.getFileName())
                        .setMessage("File info uploaded successfully.")
                        .build();

                responseObserver.onNext(response);
                responseObserver.onCompleted();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @Override
        public void downloadFileInfo(FileInfoRequest request, StreamObserver<FileInfo> responseObserver) {
            try {
                PreparedStatement stmt = conn.prepareStatement("SELECT * FROM files WHERE file_name = ?;");
                stmt.setString(1, request.getFileName());
                ResultSet rs = stmt.executeQuery();

                if (rs.next()) {
                    FileInfo response = FileInfo.newBuilder()
                            .setFileName(rs.getString("file_name"))
                            .setFileSize(rs.getInt("file_size"))
                            .setOwner(rs.getString("owner"))
                            .build();

                    responseObserver.onNext(response);
                    responseObserver.onCompleted();
                } else {
                    // Handle file not found
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) throws Exception {
        int port = 50051;
        final Server server = ServerBuilder.forPort(port)
                .addService(new DbServiceImpl())
                .build()
                .start();

        System.out.println("Server started, listening on " + port);

        server.awaitTermination();
    }
}
