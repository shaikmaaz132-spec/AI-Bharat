import { NextRequest, NextResponse } from 'next/server';
import { GrievanceDraftRequestSchema, GrievanceDraftResponseSchema } from '@/lib/schemas';
import { generateGrievancePetitionDraft } from '@/lib/gemini';
import { getAdminClient } from '@/lib/supabase';
import { maskAadhaar } from '@/lib/piiMasker';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = GrievanceDraftRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid grievance drafting request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Mask citizen narrative for any inadvertent Aadhaar mentions
    data.complaintNarration = maskAadhaar(data.complaintNarration);

    // Call Gemini legal drafting engine
    const drafts = await generateGrievancePetitionDraft({
      citizenName: data.citizenName,
      phone: data.phone,
      address: data.address,
      department: data.department,
      targetAuthority: data.targetAuthority,
      subject: data.subject,
      complaintNarration: data.complaintNarration,
      petitionType: data.petitionType,
      incidentDate: data.incidentDate,
      citizenLanguage: data.citizenLanguage,
    });

    let grievanceId = `GRV-${Date.now().toString(36).toUpperCase()}`;

    // Save petition draft into Supabase database
    try {
      const admin = getAdminClient();
      const { data: dbRecord } = await admin
        .from('grievances')
        .insert({
          session_id: data.sessionId,
          petition_type: data.petitionType,
          department: data.department,
          target_authority: data.targetAuthority,
          subject: data.subject,
          incident_date: data.incidentDate || null,
          vernacular_draft: drafts.vernacularDraft,
          english_draft: drafts.englishDraft,
          statutory_reference: drafts.statutoryReference,
          citizen_language: data.citizenLanguage,
          status: 'draft',
        })
        .select('id')
        .single();

      if (dbRecord?.id) {
        grievanceId = dbRecord.id;
      }
    } catch (dbErr: any) {
      console.warn('Saving grievance draft to Supabase failed non-fatally:', dbErr.message);
    }

    const responsePayload = {
      grievanceId,
      petitionType: data.petitionType,
      department: data.department,
      targetAuthority: data.targetAuthority,
      subject: data.subject,
      statutoryReference: drafts.statutoryReference,
      englishDraft: drafts.englishDraft,
      vernacularDraft: drafts.vernacularDraft,
      citizenLanguage: data.citizenLanguage,
      dateFormatted: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    const validatedResponse = GrievanceDraftResponseSchema.parse(responsePayload);
    return NextResponse.json(validatedResponse);
  } catch (error: any) {
    console.error('Error in /api/v1/grievance/generate-draft:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating petition draft', message: error.message },
      { status: 500 }
    );
  }
}
