package com.quickchat.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

/**
 * Service responsible for managing physical file storage on the server's filesystem.
 * 
 * Specifically handles decoding base64-encoded image payloads (from user profile uploads
 * and chat image attachments), assigning unique UUID-based filenames, writing bytes to disk,
 * and returning public API URLs to access the stored media.
 */
@Service
public class FileStorageService {

    /**
     * Absolute filesystem path to the directory where uploaded files are stored.
     */
    private final Path storageDirectory;

    /**
     * Initializes the file storage service.
     * 
     * Reads the configured upload directory property (`app.upload.dir`), defaulting to `./uploads`,
     * normalizes it to an absolute path, and creates the directory structure if it does not already exist.
     *
     * @param uploadDir the configured directory path from application properties
     */
    public FileStorageService(@Value("${app.upload.dir:./uploads}") String uploadDir) {
        this.storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload storage folder", e);
        }
    }

    /**
     * Decodes and stores a base64-encoded image string or raw data URL onto the local disk.
     * 
     * Workflow:
     * 1. Returns {@code null} if the input is null or blank.
     * 2. If the string is already an external web URL (starts with http/https), returns it as-is.
     * 3. Parses the Data URL prefix (e.g., {@code "data:image/png;base64,..."}) to determine
     *    the appropriate file extension (.png, .jpg, .gif, .webp).
     * 4. Strips whitespace and decodes the base64 payload into raw byte data.
     * 5. Generates a secure, collision-free filename using {@link UUID#randomUUID()}.
     * 6. Writes the byte stream to a file in the uploads directory.
     * 7. Returns the public relative endpoint path (e.g., {@code "/api/files/{uuid}.jpg"})
     *    which can be served by {@code FileController}.
     *
     * @param base64Data the image data URL, base64 string, or existing http URL
     * @return the relative endpoint URL to access the saved file, or null/existing URL
     */
    public String storeBase64Image(String base64Data) {
        if (base64Data == null || base64Data.trim().isEmpty()) {
            return null;
        }

        // If it's already an http/https URL (e.g., Cloudinary or external avatar), keep as is
        if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
            return base64Data;
        }

        try {
            String extension = ".jpg";
            String rawBase64 = base64Data;

            // Extract MIME type prefix if provided as a Data URL (data:image/xxx;base64,...)
            if (base64Data.contains(",")) {
                String[] parts = base64Data.split(",", 2);
                String prefix = parts[0];
                rawBase64 = parts[1];

                if (prefix.contains("image/png")) {
                    extension = ".png";
                } else if (prefix.contains("image/jpeg") || prefix.contains("image/jpg")) {
                    extension = ".jpg";
                } else if (prefix.contains("image/gif")) {
                    extension = ".gif";
                } else if (prefix.contains("image/webp")) {
                    extension = ".webp";
                }
            }

            // Decode base64 bytes, stripping any accidental whitespace or newlines
            byte[] decodedBytes = Base64.getDecoder().decode(rawBase64.replaceAll("\\s+", ""));
            
            // Assign a random UUID filename to prevent collisions and path traversal attacks
            String fileName = UUID.randomUUID() + extension;
            Path targetLocation = this.storageDirectory.resolve(fileName);

            // Write bytes directly to disk
            try (FileOutputStream fos = new FileOutputStream(targetLocation.toFile())) {
                fos.write(decodedBytes);
            }

            // Return the public access endpoint URL path
            return "/api/files/" + fileName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode and store image: " + e.getMessage(), e);
        }
    }

    /**
     * Resolves a filename to its absolute normalized path on the server's filesystem.
     * 
     * Used by {@code FileController} to retrieve the file resource for client download.
     *
     * @param fileName the name of the file to locate
     * @return the normalized {@link Path} referencing the file
     */
    public Path loadFileAsPath(String fileName) {
        return this.storageDirectory.resolve(fileName).normalize();
    }
}
