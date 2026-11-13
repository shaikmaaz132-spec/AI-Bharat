import { NextRequest, NextResponse } from 'next/server';
import { getAllSchemes } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;

    const schemes = await getAllSchemes(category);
    return NextResponse.json({
      success: true,
      count: schemes.length,
      data: schemes,
    });
  } catch (error: any) {
    console.error('Error fetching schemes in GET /api/v1/schemes:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
