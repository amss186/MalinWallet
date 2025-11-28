import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    // Construct the query string from the incoming request
    const queryString = searchParams.toString();

    const API_KEY = process.env.ZEROX_API_KEY;

    const url = `https://api.0x.org/swap/v1/price?${queryString}`;

    const response = await fetch(url, {
      headers: {
        '0x-api-key': API_KEY || '',
      },
    });

    const data = await response.json();

    // Forward the status code
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
