import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    // GoPlus requires chain_id and address usually for token security
    // e.g. /api/v1/token_security/{chain_id}?contract_addresses={addresses}

    // For simplicity, let's assume we are proxying a specific check like token security
    // The client should provide 'chainId' and 'address' in params.

    const chainId = searchParams.get('chainId');
    const contractAddress = searchParams.get('contractAddress');

    if (!chainId || !contractAddress) {
        return NextResponse.json({ error: 'Missing chainId or contractAddress' }, { status: 400 });
    }

    // GoPlus public API for Token Security
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${contractAddress}`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
