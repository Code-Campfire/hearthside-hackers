import pkg from '@google-cloud/vision';
const { ImageAnnotatorClient } = pkg;
import sharp from 'sharp';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Lazy initialization to avoid crash on missing credentials at startup
let visionClient: InstanceType<typeof ImageAnnotatorClient> | null = null;
let credentialsChecked = false;
let credentialsAvailable = false;

function checkCredentials(): boolean {
  if (credentialsChecked) return credentialsAvailable;

  credentialsChecked = true;

  // Check if credentials file exists
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && existsSync(credPath)) {
    credentialsAvailable = true;
    return true;
  }

  // Check for default locations
  const defaultPaths = [
    '/app/config/google-vision-key.json',
    './config/google-vision-key.json',
  ];

  for (const path of defaultPaths) {
    if (existsSync(path)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
      credentialsAvailable = true;
      return true;
    }
  }

  credentialsAvailable = false;
  return false;
}

function getVisionClient(): InstanceType<typeof ImageAnnotatorClient> {
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

export interface OcrResult {
  fullText: string;
  confidence: number;
  lines: string[];
  rawResponse: any;
}

export async function extractTextFromImage(imagePath: string): Promise<OcrResult> {
  // Check credentials before attempting to use Vision API
  if (!checkCredentials()) {
    throw new Error(
      'Google Cloud Vision credentials not configured. ' +
      'Please place your service account JSON at backend/config/google-vision-key.json ' +
      'or set GOOGLE_APPLICATION_CREDENTIALS environment variable.'
    );
  }

  try {
    // Optimize image before sending to API
    const optimizedBuffer = await optimizeImage(imagePath);

    // Call Vision API
    const client = getVisionClient();
    const [result] = await client.textDetection(optimizedBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }

    // First annotation contains full text
    const fullText = detections[0].description || '';

    // Calculate confidence (average of all word confidences)
    const confidence = calculateConfidence(result);

    // Split into lines
    const lines = fullText.split('\n').filter(line => line.trim().length > 0);

    return {
      fullText,
      confidence,
      lines,
      rawResponse: result
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function optimizeImage(imagePath: string): Promise<Buffer> {
  try {
    // Resize to max 1600px, compress to 85% quality
    return await sharp(imagePath)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (error) {
    // If optimization fails, use original
    return await fs.readFile(imagePath);
  }
}

function calculateConfidence(result: any): number {
  // Vision API doesn't always return confidence scores
  // Simplified: return 85 if text found, lower if sparse
  const pages = result.fullTextAnnotation?.pages || [];
  if (pages.length === 0) return 0;

  const words = pages[0]?.blocks?.flatMap((b: any) =>
    b.paragraphs?.flatMap((p: any) => p.words || []) || []
  ) || [];

  if (words.length < 5) return 40; // Very little text
  if (words.length < 15) return 60; // Sparse text
  return 85; // Normal receipt
}
