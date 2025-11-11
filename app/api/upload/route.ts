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

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const contentType = file.type || (isVideo ? "video/mp4" : "image/jpeg")

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    // Use R2_PUBLIC_URL if available, format: https://pub-xxxxx.r2.dev/bucket-name/file-name
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

