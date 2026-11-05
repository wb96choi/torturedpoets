const authorizeUrl='https://kauth.kakao.com/oauth/authorize';
const tokenUrl='https://kauth.kakao.com/oauth/token';
const userUrl='https://kapi.kakao.com/v2/user/me';

export function kakaoAuthorizeUrl({restApiKey,redirectUri,state}){
 const url=new URL(authorizeUrl);
 url.search=new URLSearchParams({response_type:'code',client_id:restApiKey,redirect_uri:redirectUri,state}).toString();
 return url.toString();
}

export async function kakaoUserId({restApiKey,clientSecret,redirectUri,code,fetchImpl=fetch}){
 const body=new URLSearchParams({grant_type:'authorization_code',client_id:restApiKey,redirect_uri:redirectUri,code});
 if(clientSecret)body.set('client_secret',clientSecret);
 const tokenResponse=await fetchImpl(tokenUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=utf-8'},body,signal:AbortSignal.timeout(10000)});
 if(!tokenResponse.ok)throw Error('카카오 인증 코드를 확인하지 못했어요.');
 const token=await tokenResponse.json();
 if(typeof token.access_token!=='string'||!token.access_token)throw Error('카카오 토큰을 받지 못했어요.');
 const userResponse=await fetchImpl(userUrl,{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(10000)});
 if(!userResponse.ok)throw Error('카카오 사용자 정보를 확인하지 못했어요.');
 const user=await userResponse.json();
 if(!/^\d+$/.test(String(user.id??'')))throw Error('카카오 사용자 ID를 확인하지 못했어요.');
 return String(user.id);
}
