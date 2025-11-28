import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { networkId, body } = await req.json();

    if (!body || !networkId) {
      return NextResponse.json({ error: 'Missing body or networkId' }, { status: 400 });
    }

    const API_KEY = process.env.ALCHEMY_API_KEY;

    let subdomain = 'eth-mainnet';
    if (networkId.includes('polygon')) subdomain = 'polygon-mainnet';
    if (networkId.includes('arbitrum')) subdomain = 'arb-mainnet';
    if (networkId.includes('optimism')) subdomain = 'opt-mainnet';
    if (networkId.includes('base')) subdomain = 'base-mainnet';
    if (networkId.includes('sepolia')) subdomain = 'eth-sepolia';

    const url = `https://${subdomain}.g.alchemy.com/v2/${API_KEY}`;

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
