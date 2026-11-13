import { NextRequest, NextResponse } from 'next/server';
import { DocumentAnalyzeRequestSchema } from '@/lib/schemas';
import { analyzeDocumentVision } from '@/lib/gemini';
import { getAdminClient } from '@/lib/supabase';
import { maskAadhaarDeep } from '@/lib/piiMasker';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = DocumentAnalyzeRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid document upload payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, sessionId, documentHint } = parsed.data;

    // Call Gemini Multimodal Vision with the structured JSON schema
    const extractedData = await analyzeDocumentVision(imageBase64, mimeType, documentHint);

    // Enforce defensive PII masking on the result
    const sanitizedExtraction = maskAadhaarDeep(extractedData);

    // Save document record to Supabase database
    try {
      const admin = getAdminClient();
      await admin.from('documents').insert({
        session_id: sessionId,
        document_type: sanitizedExtraction.documentType,
        file_name: `doc_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`,
        extracted_data: sanitizedExtraction,
        confidence_score: sanitizedExtraction.confidenceScore,
        pii_masked: true,
      });
    } catch (dbErr: any) {
      console.warn('Logging document extraction to Supabase failed non-fatally:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      data: sanitizedExtraction,
      piiMasked: true,
    });
  } catch (error: any) {
    console.error('Error in /api/v1/documents/analyze:', error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing document', message: error.message },
      { status: 500 }
    );
  }
}
