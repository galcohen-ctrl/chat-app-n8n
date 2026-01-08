import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhook_url, name, question, ai_answer, rating } = body;

    console.log('Submitting rating:', { name, rating });

    // Forward the rating to n8n
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        question,
        ai_answer,
        rating
      }),
    });

    console.log('n8n rating response status:', response.status);

    // Don't wait for n8n response, just return success
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Rating submission error:', error);
    // Return success anyway to not block the user
    return NextResponse.json({ success: true });
  }
}
