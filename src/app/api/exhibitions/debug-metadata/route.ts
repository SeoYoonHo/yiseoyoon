import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function GET() {
  try {
    const metadataKey = 'Exhibitions/metadata.json';

    const getMetadataCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
    });

    const metadataResponse = await s3Client.send(getMetadataCommand);
    const metadataString = await metadataResponse.Body?.transformToString();

    if (!metadataString) {
      return NextResponse.json({ success: false, error: 'No metadata found' });
    }

    const metadata = JSON.parse(metadataString);

    return NextResponse.json({
      success: true,
      metadata,
      message: 'Metadata fetched successfully',
    });

  } catch (error) {
    console.error('Failed to fetch metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
