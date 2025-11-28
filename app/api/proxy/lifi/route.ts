import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // LiFi uses endpoint like https://li.quest/v1/quote?...
    // We are proxying requests to /api/proxy/lifi?endpoint=quote&...

    // Actually, let's keep it simple. The client sends the full query.
    // We just assume it's a quote request or we can pass the path as a param if needed.
    // For now, let's assume this is for 'quote'.

    // To be more flexible, let's look for a 'path' param or just forward everything to /quote if not specified?
    // Let's assume the client hits /api/proxy/lifi/quote directly if we used dynamic routes,
    // but here we have a fixed route.ts.

    // Better approach: The client calls /api/proxy/lifi?url=... OR we reconstruct the params.
    // The previous service called: https://li.quest/v1/quote

    const url = `https://li.quest/v1/quote?${queryString}`;
    const API_KEY = process.env.LIFI_API_KEY;

    const response = await fetch(url, {
      headers: {
        'x-lifi-api-key': API_KEY || ''
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
