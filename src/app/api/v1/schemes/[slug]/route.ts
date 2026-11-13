import { NextRequest, NextResponse } from 'next/server';
import { getSchemeBySlug } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const scheme = await getSchemeBySlug(slug);

    if (!scheme) {
      return NextResponse.json(
        { error: `Scheme with slug "${slug}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: scheme,
    });
  } catch (error: any) {
    console.error('Error fetching scheme by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
