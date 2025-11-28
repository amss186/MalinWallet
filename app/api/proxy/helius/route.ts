import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const API_KEY = process.env.HELIUS_API_KEY;

    // Default to mainnet, but allow devnet override if needed (not implemented yet)
    // Helius standard RPC URL
    const url = `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
