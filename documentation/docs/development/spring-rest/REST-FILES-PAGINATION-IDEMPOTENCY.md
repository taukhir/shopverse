---
title: Spring REST Files Pagination And Idempotency
---

# Spring REST Files Pagination And Idempotency

Multipart uploads, downloads, pagination, conditional requests, idempotent commands, and OpenAPI docs.

Back to [Spring REST APIs](../SPRING-REST-APIS.md).

## Multipart File Upload

Spring MVC supports multipart requests through `MultipartFile`. Use it when a
client sends a file as part of an API request.

### Controller

```java
@PostMapping(
        path = "/documents",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<DocumentResponse> upload(
        @RequestPart("metadata") @Valid DocumentMetadata metadata,
        @RequestPart("file") MultipartFile file
) {
    DocumentResponse created = documentService.store(metadata, file);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

Example request:

```bash
curl -X POST http://localhost:8080/api/v1/documents \
  -H "Authorization: Bearer <token>" \
  -F 'metadata={"category":"INVOICE"};type=application/json' \
  -F "file=@invoice.pdf;type=application/pdf"
```

### Production File-Upload Rules

- enforce request and file size limits;
- allow-list media types and inspect file signatures, not only extensions;
- generate server-side storage names;
- prevent path traversal;
- scan untrusted files for malware;
- store large files in object storage rather than application memory or a
  relational BLOB by default;
- stream large content and avoid `file.getBytes()`;
- authorize both upload and later download;
- return an opaque document ID instead of a filesystem path;
- apply retention and deletion policies.

Configuration example:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 12MB
```

## Reading Uploaded Files In Controller

When a client sends a file in an API request, the controller receives it as a
`MultipartFile`.

Basic upload:

```java
public record FileUploadResponse(
        String fileName,
        String contentType,
        long size
) {
}
```

```java
@PostMapping(
        path = "/files",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<FileUploadResponse> upload(
        @RequestPart("file") MultipartFile file
) throws IOException {
    String originalFileName = file.getOriginalFilename();
    String contentType = file.getContentType();
    long size = file.getSize();

    try (InputStream inputStream = file.getInputStream()) {
        // Process the stream here.
        // Example: scan, parse, upload to object storage, or save safely.
    }

    return ResponseEntity.ok(new FileUploadResponse(
            originalFileName,
            contentType,
            size
    ));
}
```

Example request:

```bash
curl -X POST http://localhost:8080/api/v1/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@invoice.pdf;type=application/pdf"
```

### Reading File Metadata

```java
String originalFileName = file.getOriginalFilename();
String contentType = file.getContentType();
long size = file.getSize();
boolean empty = file.isEmpty();
```

Important: treat this metadata as untrusted input. A client can fake file name
and content type.

### Reading File As Bytes

```java
byte[] content = file.getBytes();
```

Use this only for small files. It loads the full file into memory.

### Reading File As Stream

```java
try (InputStream inputStream = file.getInputStream()) {
    storageService.store(inputStream);
}
```

Prefer streaming for larger files. It avoids loading the entire file into
application memory.

### Saving File Safely

Do not directly use `originalFilename` as a filesystem path.

Unsafe:

```java
Path target = Path.of(uploadDir, file.getOriginalFilename());
file.transferTo(target);
```

Safer:

```java
String storageName = UUID.randomUUID() + ".pdf";
Path uploadRoot = Path.of("/var/app/uploads").toAbsolutePath().normalize();
Path target = uploadRoot.resolve(storageName).normalize();

if (!target.startsWith(uploadRoot)) {
    throw new InvalidFileException("Invalid file path");
}

file.transferTo(target);
```

In production, object storage such as S3, Azure Blob Storage, or MinIO is
usually better than writing files to the application container filesystem.

### Multiple File Upload

```java
@PostMapping(
        path = "/files/bulk",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<List<FileUploadResponse>> uploadMany(
        @RequestPart("files") List<MultipartFile> files
) {
    List<FileUploadResponse> responses = files.stream()
            .map(file -> new FileUploadResponse(
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize()
            ))
            .toList();

    return ResponseEntity.ok(responses);
}
```

Example request:

```bash
curl -X POST http://localhost:8080/api/v1/files/bulk \
  -H "Authorization: Bearer <token>" \
  -F "files=@invoice-1.pdf;type=application/pdf" \
  -F "files=@invoice-2.pdf;type=application/pdf"
```

### Upload With JSON Metadata

```java
public record DocumentMetadata(
        @NotBlank String category,
        @NotBlank String owner
) {
}
```

```java
@PostMapping(
        path = "/documents",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<DocumentResponse> uploadDocument(
        @RequestPart("metadata") @Valid DocumentMetadata metadata,
        @RequestPart("file") MultipartFile file
) {
    DocumentResponse response = documentService.store(metadata, file);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

Request:

```bash
curl -X POST http://localhost:8080/api/v1/documents \
  -H "Authorization: Bearer <token>" \
  -F 'metadata={"category":"INVOICE","owner":"admin"};type=application/json' \
  -F "file=@invoice.pdf;type=application/pdf"
```

### File Upload Validation

Validate at least:

- file is not empty;
- file size is within limit;
- content type is allowed;
- extension is allowed only as a secondary check;
- file signature/magic bytes match expected type;
- authenticated user is allowed to upload;
- generated storage path stays under the allowed root.

Example:

```java
private static final Set<String> ALLOWED_TYPES =
        Set.of("application/pdf", "image/png", "image/jpeg");

void validateFile(MultipartFile file) {
    if (file.isEmpty()) {
        throw new InvalidFileException("File is required");
    }

    if (file.getSize() > 5 * 1024 * 1024) {
        throw new InvalidFileException("File exceeds 5 MB");
    }

    if (!ALLOWED_TYPES.contains(file.getContentType())) {
        throw new InvalidFileException("Unsupported file type");
    }
}
```

Content type alone is not enough for hostile input. For sensitive systems,
inspect the actual file signature and scan user-supplied files.

### Multipart Configuration

```yaml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 5MB
      max-request-size: 20MB
      file-size-threshold: 2MB
```

| Property | Meaning |
|---|---|
| `enabled` | enables multipart handling |
| `max-file-size` | maximum size for one uploaded file |
| `max-request-size` | maximum total multipart request size |
| `file-size-threshold` | size after which file content may be written to disk |

### File Upload Do And Do Not

Do:

- authenticate upload APIs unless explicitly public;
- validate size and type;
- generate server-side file names;
- store metadata in the database;
- stream large files;
- log metadata, not file contents;
- scan untrusted files;
- return an opaque file/document ID;
- apply retention and deletion policies.

Do not:

- trust `originalFilename`;
- trust `contentType` blindly;
- store user files inside the source code directory;
- expose filesystem paths in API responses;
- load large files with `getBytes()`;
- allow arbitrary file extensions;
- serve uploaded files directly without authorization checks;
- keep files forever without lifecycle policy.


## File Download

```java
@GetMapping("/documents/{id}/content")
ResponseEntity<Resource> download(@PathVariable UUID id) {
    StoredDocument document = documentService.loadAuthorized(id);
    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(document.contentType()))
            .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment()
                            .filename(document.originalFileName())
                            .build()
                            .toString()
            )
            .body(document.resource());
}
```

Never construct a path directly from untrusted input.


## Pagination, Sorting, And Filtering

Spring Data can bind a `Pageable`, but production APIs should cap page size and
allow-list sorting:

```java
@GetMapping
Page<ProductResponse> search(
        @RequestParam(required = false) String query,
        @PageableDefault(size = 20, sort = "createdAt")
        Pageable pageable
) {
    return productService.search(query, bounded(pageable));
}
```

Offset pagination is simple but can become slow or inconsistent for deep,
frequently changing result sets. Use cursor or keyset pagination when the
dataset and access pattern require it.


## Conditional Requests And Optimistic Concurrency

Expose a resource version through an ETag:

```http
GET /api/v1/products/42
ETag: "7"
```

Require that version for updates:

```http
PUT /api/v1/products/42
If-Match: "7"
```

Return `412 Precondition Failed` when the representation changed. Keep a
database `@Version` column as the final protection against lost updates.


## Idempotent Commands

For checkout, payment, and similar commands:

```java
@PostMapping("/checkout")
ResponseEntity<OrderResponse> checkout(
        @RequestHeader("Idempotency-Key")
        @NotBlank @Size(max = 100) String key,
        @Valid @RequestBody CheckoutRequest request
) {
    OrderResponse result = orderService.checkout(key, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(result);
}
```

Persist the key with the business result and enforce a unique database
constraint. Concurrent duplicate requests must resolve to the original result
or a deliberate `409`, not create duplicate side effects.


## OpenAPI Documentation

Document authentication, response codes, examples, validation, and errors:

```java
@Operation(summary = "Creates an idempotent checkout")
@ApiResponses({
        @ApiResponse(responseCode = "201", description = "Order created"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "409", description = "Request conflict")
})
@PostMapping("/checkout")
ResponseEntity<OrderResponse> checkout(...) {
    // ...
}
```

Generated documentation does not replace API design review or contract tests.










