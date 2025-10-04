import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('admin-session')?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    
    // 세션 만료 확인 (24시간)
    const loginTime = sessionData.loginTime;
    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    
    if (currentTime - loginTime > maxAge) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // 이메일 재검증
    const allowedEmails = process.env.ADMIN_ALLOWED_EMAILS?.split(',') || [];
    if (!allowedEmails.includes(sessionData.email)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      email: sessionData.email 
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
