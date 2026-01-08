import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Sending to n8n:', body);

    // n8n webhook URL
    const webhookUrl = 'https://comosense.app.n8n.cloud/webhook/126dc567-f5d0-4a3d-a17b-40593448d57a';

    // Forward the request to n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('n8n response status:', response.status);

    // Get the response text first to see what n8n is returning
    const textResponse = await response.text();
    console.log('n8n raw response:', textResponse);

    // If empty response, n8n might not be configured to respond
    if (!textResponse || textResponse.trim() === '') {
      return NextResponse.json(
        { error: 'n8n returned empty response. Make sure webhook is set to "When Last Node Finishes"' },
        { status: 500 }
      );
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Failed to parse n8n response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON from n8n', rawResponse: textResponse },
        { status: 500 }
      );
    }

    // n8n returns an array with one object, extract it
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    // Return the response to the frontend
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Webhook proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook request', details: error.message },
      { status: 500 }
    );
  }
}
