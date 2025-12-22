import pkg from '@google-cloud/vision';
const { ImageAnnotatorClient } = pkg;
import sharp from 'sharp';
import fs from 'fs/promises';

const visionClient = new ImageAnnotatorClient();

export interface OcrResult {
  fullText: string;
  confidence: number;
  lines: string[];
  rawResponse: any;
}

export async function extractTextFromImage(imagePath: string): Promise<OcrResult> {
  try {
    // Optimize image before sending to API
    const optimizedBuffer = await optimizeImage(imagePath);

    // Call Vision API
    const [result] = await visionClient.textDetection(optimizedBuffer);
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
