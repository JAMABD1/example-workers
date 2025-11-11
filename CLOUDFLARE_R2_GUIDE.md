# Cloudflare R2 Implementation Guide & Best Practices

A comprehensive guide for implementing Cloudflare R2 storage in Next.js applications, based on real-world implementation patterns.

## Table of Contents

1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [Implementation](#implementation)
4. [Best Practices](#best-practices)
5. [Security Considerations](#security-considerations)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Code Examples](#code-examples)

---

## Overview

Cloudflare R2 is an S3-compatible object storage service that provides:
- **Zero egress fees** - No charges for data transfer out
- **S3 API compatibility** - Works with existing AWS SDK
- **Global CDN** - Fast access worldwide
- **Durable storage** - 99.999999999% (11 9's) durability

### Key Features Used in This Project

- Direct file uploads from client to R2
- Public URL access for media files
- Video streaming support
- Image and video file handling
- File metadata tracking

---

## Setup & Configuration

### 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** → **Create bucket**
3. Name your bucket (e.g., `bucket-demo`)
4. Choose a location (or leave default)

### 2. Configure Public Access

1. Go to **R2** → Your bucket → **Settings**
2. Enable **Public Access** if you need direct URL access
3. Copy your **Public URL** (format: `https://pub-xxxxx.r2.dev`)

### 3. Create API Token

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions:
   - **Object Read & Write** (for uploads)
   - **Bucket Read & Write** (for management)
4. Save the credentials:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (if needed)

### 4. Environment Variables

Create a `.env` file in your project root:

```env
# R2 Configuration
AWS_S3_API_URL=https://[account-id].r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=bucket-demo

# Public URL (for direct file access)
R2_PUBLIC_URL=https://pub-0015cb6124804646ad7f3c330d4a869e.r2.dev
```

**Important:** Never commit `.env` files to version control. Add `.env` to `.gitignore`.

---

## Implementation

### 1. Install Dependencies

```bash
npm install @aws-sdk/client-s3
```

### 2. Upload API Route

Create `app/api/upload/route.ts`:

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { NextRequest, NextResponse } from "next/server"

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.AWS_S3_API_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Detect file type
    const isVideo = file.type.startsWith("video/")
    const isImage = file.type.startsWith("image/")

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Unsupported file type. Only images and videos are allowed." },
        { status: 400 }
      )
    }

    // Check file size (500MB for videos, 10MB for images)
    const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? "500MB" : "10MB"} limit` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const contentType = file.type || (isVideo ? "video/mp4" : "image/jpeg")

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    // Construct public URL
    const fileUrl = process.env.R2_PUBLIC_URL 
      ? `${process.env.R2_PUBLIC_URL}/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`
      : `${process.env.AWS_S3_API_URL}/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      type: isVideo ? "video" : "image",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
```

### 3. Client-Side Upload Hook

Create `hooks/use-file-upload.ts` for handling file uploads:

```typescript
// Key features:
// - Drag and drop support
// - File validation
// - Progress tracking
// - Error handling
// - Multiple file support
```

### 4. Video Player Component

Use native HTML5 video for better R2 compatibility:

```typescript
// components/video-player.tsx
// - Native HTML5 video element (better R2 compatibility)
// - Custom controls overlay
// - Loading states
// - Error handling
// - Autoplay support (muted)
```

---

## Best Practices

### 1. File Naming Strategy

**✅ Good:**
```typescript
const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
```

**Why:**
- Timestamp prefix ensures uniqueness
- Sanitizes special characters
- Preserves file extension
- Prevents conflicts

**❌ Bad:**
```typescript
const fileName = file.name // Can cause conflicts and security issues
```

### 2. File Size Limits

Always validate file sizes on the server:

```typescript
const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024
if (file.size > maxSize) {
  return NextResponse.json({ error: "File too large" }, { status: 400 })
}
```

**Recommended Limits:**
- Images: 10MB
- Videos: 500MB
- Documents: 5MB

### 3. Content Type Detection

Always set proper Content-Type headers:

```typescript
const contentType = file.type || (isVideo ? "video/mp4" : "image/jpeg")

const command = new PutObjectCommand({
  // ...
  ContentType: contentType,
})
```

### 4. Error Handling

Implement comprehensive error handling:

```typescript
try {
  await s3Client.send(command)
} catch (error) {
  console.error("Upload error:", error)
  return NextResponse.json(
    { error: "Failed to upload file" },
    { status: 500 }
  )
}
```

### 5. Public URL Configuration

Use environment variables for public URLs:

```typescript
const fileUrl = process.env.R2_PUBLIC_URL 
  ? `${process.env.R2_PUBLIC_URL}/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`
  : `${process.env.AWS_S3_API_URL}/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`
```

### 6. File Type Validation

Validate file types on both client and server:

```typescript
// Server-side validation
const isVideo = file.type.startsWith("video/")
const isImage = file.type.startsWith("image/")

if (!isImage && !isVideo) {
  return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
}
```

### 7. Video Streaming

For video files, use native HTML5 video player:

```typescript
<video
  ref={videoRef}
  src={url}
  className="w-full h-full object-contain"
  preload="metadata"
  playsInline
  muted={isMuted}
/>
```

**Why native HTML5:**
- Better R2 URL compatibility
- No CORS issues
- Simpler implementation
- Better performance

### 8. File Metadata Tracking

Store file metadata in localStorage (or database):

```typescript
type UploadedFile = {
  id: string
  url: string
  name: string
  type?: "image" | "video"
}

const STORAGE_KEY = "r2-uploaded-files"
localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
```

**Note:** For production, use a database instead of localStorage.

---

## Security Considerations

### 1. Environment Variables

**✅ Do:**
- Store credentials in `.env` files
- Never commit `.env` to version control
- Use different credentials for dev/prod
- Rotate credentials regularly

**❌ Don't:**
- Hardcode credentials in code
- Commit `.env` files
- Share credentials publicly

### 2. File Validation

Always validate files on the server:

```typescript
// File type validation
const allowedTypes = ["image/jpeg", "image/png", "video/mp4"]
if (!allowedTypes.includes(file.type)) {
  return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
}

// File size validation
if (file.size > maxSize) {
  return NextResponse.json({ error: "File too large" }, { status: 400 })
}
```

### 3. CORS Configuration

If accessing R2 from browser directly, configure CORS:

1. Go to R2 bucket → Settings → CORS
2. Add allowed origins
3. Configure allowed methods (GET, PUT, POST, DELETE)
4. Set allowed headers

### 4. Rate Limiting

Implement rate limiting for upload endpoints:

```typescript
// Use Next.js middleware or a library like rate-limiter-flexible
```

### 5. Access Control

**Public Access:**
- Use for public media (images, videos)
- Enable public URL in R2 settings
- No authentication required

**Private Access:**
- Use signed URLs for private files
- Implement authentication middleware
- Set bucket to private

---

## Common Issues & Solutions

### Issue 1: CORS Errors

**Problem:** Browser blocks requests to R2 due to CORS policy.

**Solution:**
1. Configure CORS in R2 bucket settings
2. Use server-side uploads (recommended)
3. Set proper CORS headers

### Issue 2: Video Not Playing

**Problem:** Video shows black screen or doesn't play.

**Solution:**
- Use native HTML5 video element (not React Player)
- Ensure Content-Type is set correctly
- Check CORS configuration
- Verify public URL is correct

```typescript
// ✅ Good - Native HTML5
<video src={url} />

// ❌ Bad - May have CORS issues
<ReactPlayer url={url} />
```

### Issue 3: File Not Found

**Problem:** File uploaded but URL returns 404.

**Solution:**
- Verify public access is enabled
- Check public URL format: `https://pub-xxxxx.r2.dev/bucket-name/file-name`
- Ensure file name encoding is correct
- Verify bucket name matches

### Issue 4: Large File Uploads

**Problem:** Large files fail to upload.

**Solution:**
- Increase Next.js body size limit in `next.config.ts`:

```typescript
export default {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
}
```

- Consider chunked uploads for very large files
- Use presigned URLs for direct client uploads

### Issue 5: Environment Variables Not Loading

**Problem:** Environment variables are undefined.

**Solution:**
- Ensure `.env` file is in project root
- Restart dev server after changing `.env`
- Use `process.env.VARIABLE_NAME` (not `import.meta.env`)
- Verify variable names match exactly

---

## Code Examples

### Complete Upload Flow

```typescript
// 1. Client-side upload
const formData = new FormData()
formData.append("file", file)

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
})

const data = await response.json()
// { success: true, url: "...", fileName: "...", type: "video" }

// 2. Store metadata
const uploadedFile = {
  id: generateId(),
  url: data.url,
  name: file.name,
  type: data.type,
}

// 3. Display video
<VideoPlayer url={uploadedFile.url} name={uploadedFile.name} />
```

### File Validation Helper

```typescript
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const isVideo = file.type.startsWith("video/")
  const isImage = file.type.startsWith("image/")
  
  if (!isImage && !isVideo) {
    return { valid: false, error: "Unsupported file type" }
  }

  // Check file size
  const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: "File too large" }
  }

  return { valid: true }
}
```

### Error Handling Pattern

```typescript
try {
  const result = await uploadFile(file)
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    // Handle specific error
    console.error("Upload failed:", error.message)
  } else {
    // Handle unknown error
    console.error("Unknown error:", error)
  }
}
```

---

## Performance Optimization

### 1. Image Optimization

- Use Next.js Image component for images
- Implement lazy loading
- Serve WebP format when possible
- Use CDN caching headers

### 2. Video Optimization

- Use appropriate video formats (MP4, WebM)
- Implement video preloading strategies
- Use thumbnail generation
- Consider video transcoding for multiple qualities

### 3. Caching Strategy

```typescript
// Set cache headers in R2
const command = new PutObjectCommand({
  // ...
  CacheControl: "public, max-age=31536000", // 1 year
})
```

### 4. Lazy Loading

```typescript
// Load videos only when visible
import { useInView } from "react-intersection-observer"

const { ref, inView } = useInView()
{inView && <VideoPlayer url={url} />}
```

---

## Monitoring & Analytics

### 1. Upload Tracking

Track upload success/failure rates:

```typescript
// Log upload events
analytics.track("file_uploaded", {
  fileType: data.type,
  fileSize: file.size,
  success: true,
})
```

### 2. Error Monitoring

Use error tracking service (Sentry, LogRocket):

```typescript
try {
  await uploadFile(file)
} catch (error) {
  errorTracking.captureException(error)
  throw error
}
```

### 3. Usage Metrics

Monitor R2 usage in Cloudflare dashboard:
- Storage used
- Requests per second
- Bandwidth usage
- Error rates

---

## Migration Checklist

When migrating to production:

- [ ] Set up production R2 bucket
- [ ] Configure production environment variables
- [ ] Set up CORS properly
- [ ] Implement rate limiting
- [ ] Add error monitoring
- [ ] Set up backup strategy
- [ ] Configure CDN caching
- [ ] Test file upload/download flows
- [ ] Verify public URLs work
- [ ] Set up logging and analytics

---

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK S3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## Support

For issues specific to this implementation, check:
1. Browser console for errors
2. Network tab for failed requests
3. R2 bucket settings
4. Environment variables configuration

---

**Last Updated:** Based on Next.js 16.0.1 and Cloudflare R2 implementation patterns.

