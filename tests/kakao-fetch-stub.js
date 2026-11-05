globalThis.fetch=async(url,options={})=>{
 if(url==='https://kauth.kakao.com/oauth/token'){
  const body=new URLSearchParams(options.body);
  if(body.get('grant_type')!=='authorization_code'||body.get('client_id')!=='test-key'||body.get('client_secret')!=='test-secret')return new Response('{}',{status:400});
  return Response.json({access_token:body.get('code')==='other'?'other-token':'good-token'});
 }
 if(url==='https://kapi.kakao.com/v2/user/me')return Response.json({id:options.headers.Authorization==='Bearer other-token'?999:12345});
 throw Error('예상하지 않은 외부 요청: '+url);
};
