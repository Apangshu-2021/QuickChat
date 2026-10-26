package com.quickchat.controller;

import com.quickchat.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * REST controller for serving stored user media files and chat attachments.
 * 
 * Provides an HTTP GET endpoint mapped to {@code /api/files/**} that streams
 * locally stored images back to clients (such as browser {@code <img>} tags and chat feeds).
 * 
 * Configured as {@code .permitAll()} in {@code SecurityConfig} so browsers can
 * load media resources without sending Authorization Bearer headers.
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /**
     * Retrieves and streams an image or file resource by its unique filename.
     * 
     * Regex path mapping explanation:
     * {@code /{fileName:.+}} uses the {@code :.+} regular expression to ensure that Spring MVC
     * does not truncate the filename at the dot (.) extension (e.g., ensuring "sample.jpg"
     * is parsed entirely instead of truncating to "sample").
     * 
     * Workflow:
     * 1. Resolves the requested filename to an absolute filesystem {@link Path}.
     * 2. Wraps the path in a Spring {@link UrlResource}.
     * 3. Checks if the resource exists and is readable; returns 404 (Not Found) if absent.
     * 4. Dynamically probes the file's MIME Content-Type (e.g., image/jpeg, image/png).
     * 5. Sets {@code Content-Disposition: inline} so the browser displays the image directly
     *    in the UI rather than triggering a file download popup.
     *
     * @param fileName the unique filename including extension (e.g., "b8761234-abcd.jpg")
     * @return {@link ResponseEntity} containing the binary {@link Resource} stream and headers
     */
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        try {
            // Locate the file within the server's uploads folder
            Path filePath = fileStorageService.loadFileAsPath(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            // Return 404 Not Found if file doesn't exist on disk or cannot be read
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Detect MIME content type dynamically from file contents/extension
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                // Fallback binary stream if MIME type cannot be determined
                contentType = "application/octet-stream";
            }

            // Return file stream with inline disposition for direct browser rendering
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
