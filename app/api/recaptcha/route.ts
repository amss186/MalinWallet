
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  const { token } = await request.json();
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );

    const { success, score } = response.data;

    if (success && score > 0.5) {
      return NextResponse.json({ success: true, score });
    } else {
      return NextResponse.json({ success: false, error: 'Bot detected' }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
