import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const API_KEY = process.env.ZEROX_API_KEY;

    // --- MONÉTISATION AUTOMATIQUE ---
    // On injecte tes frais dans chaque requête de prix/quote
    searchParams.append('buyTokenPercentageFee', '0.01'); // 1% de frais
    searchParams.append('feeRecipient', '0xeeafb3f49fe1a7156a580877346b347c4709e8e6'); // Ton adresse
    searchParams.append('skipValidation', 'true'); // Évite les erreurs de simulation gas

    const queryString = searchParams.toString();
    const url = `https://api.0x.org/swap/v1/price?${queryString}`;

    const response = await fetch(url, {
      headers: {
        '0x-api-key': API_KEY || '',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

