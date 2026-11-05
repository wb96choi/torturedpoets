import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';

test('카카오 로그인: state 검증, 관리자 ID 허용목록, 비밀번호 로그인 차단',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'aftertrack-kakao-test-'));
 const proc=spawn(process.execPath,['--import','./tests/kakao-fetch-stub.js','server/index.js'],{env:{...process.env,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:'this-password-must-not-work',NODE_ENV:'development',PUBLIC_ORIGIN:'',KAKAO_REST_API_KEY:'test-key',KAKAO_CLIENT_SECRET:'test-secret',KAKAO_REDIRECT_URI:'http://127.0.0.1:3000/api/auth/kakao/callback',KAKAO_ADMIN_IDS:'12345',DATA_DIR:join(temp,'data'),UPLOAD_DIR:join(temp,'uploads')},stdio:['ignore','pipe','pipe']});
 let output='',base;
 try{
  base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('서버 시작 시간 초과')),10000);proc.stdout.on('data',b=>{output+=b;const match=/http:\/\/127\.0\.0\.1:\d+/.exec(output);if(match){clearTimeout(timeout);resolve(match[0])}});proc.on('error',reject);proc.on('exit',code=>reject(Error('서버 조기 종료: '+code)))});
  const session=await(await fetch(base+'/api/auth/session')).json();assert.equal(session.mode,'kakao');assert.equal(session.admin,false);
  const password=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password:'this-password-must-not-work'})});assert.equal(password.status,403);
  async function start(){const response=await fetch(base+'/api/auth/kakao/start',{redirect:'manual'});assert.equal(response.status,302);const url=new URL(response.headers.get('location'));assert.equal(url.origin,'https://kauth.kakao.com');assert.equal(url.searchParams.get('client_id'),'test-key');const state=url.searchParams.get('state');assert.match(state,/^[a-f0-9]{64}$/);const cookie=response.headers.get('set-cookie').split(';')[0];assert.match(response.headers.get('set-cookie'),/SameSite=Lax/);return {state,cookie}}
  const first=await start();
  const bad=await fetch(base+'/api/auth/kakao/callback?code=good&state='+'0'.repeat(64),{headers:{Cookie:first.cookie},redirect:'manual'});assert.equal(bad.headers.get('location'),'/admin/?auth=state');
  assert.equal((await fetch(base+'/api/admin/catalog')).status,403);
  const second=await start();
  const denied=await fetch(base+`/api/auth/kakao/callback?code=other&state=${second.state}`,{headers:{Cookie:second.cookie},redirect:'manual'});assert.equal(denied.headers.get('location'),'/admin/?auth=not-allowed&id=999');
  const third=await start();
  const allowed=await fetch(base+`/api/auth/kakao/callback?code=good&state=${third.state}`,{headers:{Cookie:third.cookie},redirect:'manual'});assert.equal(allowed.headers.get('location'),'/admin/');
  const authCookie=/aftertrack_session=[a-f0-9]{64}/.exec(allowed.headers.get('set-cookie'))?.[0];assert.ok(authCookie);
  assert.equal((await fetch(base+'/api/admin/catalog',{headers:{Cookie:authCookie}})).status,200);
 }finally{proc.kill();await once(proc,'exit').catch(()=>{});await rm(temp,{recursive:true,force:true})}
});
