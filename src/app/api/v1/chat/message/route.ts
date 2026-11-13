import { NextRequest, NextResponse } from 'next/server';
import { ChatRequestSchema, ChatResponseSchema } from '@/lib/schemas';
import { transcribeAudio, generateEmbedding, chatWithGrounding } from '@/lib/gemini';
import { matchSchemesVector, getAdminClient } from '@/lib/supabase';
import { maskAadhaar } from '@/lib/piiMasker';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, audioBase64, audioMimeType, language, sessionId } = parsed.data;

    let finalQueryText = message.trim();

    // If spoken audio was submitted, transcribe it first
    if (audioBase64) {
      const transcription = await transcribeAudio(audioBase64, audioMimeType, language);
      if (transcription) {
        finalQueryText = transcription;
      }
    }

    if (!finalQueryText) {
      return NextResponse.json(
        { error: 'Query text or audio is required to process.' },
        { status: 400 }
      );
    }

    // Mask any PII before processing
    finalQueryText = maskAadhaar(finalQueryText);

    // Step 1: Generate vector embedding for semantic search
    const queryEmbedding = await generateEmbedding(finalQueryText);

    // Step 2: Vector retrieval using match_schemes RPC call in Supabase PostgreSQL
    const matchingSchemes = await matchSchemesVector(queryEmbedding, 0.25, 5);

    // Step 3: Grounded response generation with zero hallucination enforcement
    const groundedResult = await chatWithGrounding(finalQueryText, matchingSchemes, language);

    // Step 4: Record conversation in database asynchronously
    try {
      const admin = getAdminClient();
      const { data: convData } = await admin
        .from('chat_conversations')
        .insert({
          session_id: sessionId,
          language,
          title: finalQueryText.slice(0, 40) + '...',
        })
        .select('id')
        .single();

      if (convData?.id) {
        await admin.from('chat_messages').insert([
          {
            conversation_id: convData.id,
            role: 'user',
            content: finalQueryText,
            language,
          },
          {
            conversation_id: convData.id,
            role: 'assistant',
            content: groundedResult.text,
            language,
            citations: groundedResult.citations,
          },
        ]);
      }
    } catch (dbErr: any) {
      console.warn('Logging conversation to Supabase failed non-fatally:', dbErr.message);
    }

    const responsePayload = {
      response: groundedResult.text,
      language,
      citations: groundedResult.citations,
      grounded: groundedResult.grounded,
      isRedirect: groundedResult.isRedirect,
    };

    const validatedResponse = ChatResponseSchema.parse(responsePayload);
    return NextResponse.json(validatedResponse);
  } catch (error: any) {
    console.error('Error in /api/v1/chat/message:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing chat message', message: error.message },
      { status: 500 }
    );
  }
}
