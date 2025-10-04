import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
  }

  try {
    console.log('=== Kakao Login API Called ===');
    console.log('Authorization code:', code);
    console.log('Client ID:', process.env.KAKAO_CLIENT_ID);
    console.log('Client Secret:', process.env.KAKAO_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', process.env.KAKAO_REDIRECT_URI);
    console.log('Allowed emails:', process.env.ADMIN_ALLOWED_EMAILS);
    
    // 카카오 액세스 토큰 요청
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('=== Kakao Token Response ===');
    console.log('Status:', tokenResponse.status);
    console.log('Response:', JSON.stringify(tokenData, null, 2));
    
    if (!tokenResponse.ok) {
      console.error('=== Token Exchange Failed ===');
      console.error('Status:', tokenResponse.status);
      console.error('Error:', tokenData);
      console.error('=== Returning error response, no session will be created ===');
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }

    // 카카오 사용자 정보 요청
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    console.log('=== Kakao User Info Response ===');
    console.log('Status:', userResponse.status);
    console.log('User data:', JSON.stringify(userData, null, 2));
    
    if (!userResponse.ok) {
      console.error('=== User Info Failed ===');
      console.error('Status:', userResponse.status);
      console.error('Error:', userData);
      console.error('=== Returning error response, no session will be created ===');
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 });
    }

    // 이메일 확인
    const email = userData.kakao_account?.email;
    console.log('=== Email Verification ===');
    console.log('User email:', email);
    
    if (!email) {
      console.error('Email not provided by Kakao');
      console.error('=== Returning error response, no session will be created ===');
      return NextResponse.json({ error: 'Email not provided by Kakao' }, { status: 400 });
    }

    // 관리자 이메일 리스트 확인
    const allowedEmails = process.env.ADMIN_ALLOWED_EMAILS?.split(',') || [];
    console.log('Allowed emails:', allowedEmails);
    console.log('Email check:', allowedEmails.includes(email));
    
    if (!allowedEmails.includes(email)) {
      console.error('Access denied for email:', email);
      console.error('=== Returning error response, no session will be created ===');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 세션 생성 (간단한 토큰 기반)
    const sessionToken = Buffer.from(JSON.stringify({
      email,
      loginTime: Date.now(),
    })).toString('base64');

    // 성공 응답
    const response = NextResponse.json({ 
      success: true, 
      email,
      message: 'Login successful' 
    });

    // 쿠키에 세션 토큰 설정
    console.log('=== Session Token Created ===');
    console.log('Session token:', sessionToken);
    
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24시간 (초 단위)
      path: '/', // 모든 경로에서 접근 가능
    });

    console.log('=== Login Success ===');
    return response;

  } catch (error) {
    console.error('Kakao login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
