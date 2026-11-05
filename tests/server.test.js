import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';

test('실제 서버: 익명 권한 차단 / 관리자 저장 / 충돌 / 파일 공개 범위',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'aftertrack-test-'));
 const proc=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:'',NODE_ENV:'development',PUBLIC_ORIGIN:'',KAKAO_REST_API_KEY:'',KAKAO_CLIENT_SECRET:'',KAKAO_REDIRECT_URI:'',KAKAO_ADMIN_IDS:'',DATA_DIR:join(temp,'data'),UPLOAD_DIR:join(temp,'uploads')},stdio:['ignore','pipe','pipe']});
 let output='';let base;try{
 base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('서버 시작 시간 초과')),10000);proc.stdout.on('data',b=>{output+=b;const m=/http:\/\/127\.0\.0\.1:\d+/.exec(output);if(m){clearTimeout(timeout);resolve(m[0])}});proc.on('error',reject);proc.on('exit',c=>reject(Error('서버 조기 종료: '+c)))});
 const call=(path,method='GET',body,auth='',origin=base)=>fetch(base+path,{method,headers:{...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{}),...(auth?{Cookie:auth}:{})},body:body?JSON.stringify(body):undefined});
 assert.equal((await call('/')).status,200);
 assert.equal((await call('/admin/')).status,200);
 assert.equal((await call('/assets/css/site.css')).status,200);
 assert.equal((await call('/api/admin/catalog')).status,403);
 assert.equal((await call('/api/auth/login','POST',{},'','https://other.example')).status,403);
 const login=await call('/api/auth/login','POST',{});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 let saved=await(await call('/api/admin/catalog','GET',null,cookie)).json();
 const image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pZkAAAAASUVORK5CYII=';
 assert.equal((await call('/api/admin/upload','POST',{base64:Buffer.from('%PDF-1.4 test').toString('base64')},cookie)).status,400);
 const upload=await call('/api/admin/upload','POST',{base64:image},cookie);assert.equal(upload.status,200);const {url}=await upload.json();
 const artUpload=await call('/api/admin/upload','POST',{base64:image},cookie);assert.equal(artUpload.status,200);const {url:artUrl}=await artUpload.json();
 assert.equal((await call(url)).status,404);assert.equal((await call(url,'GET',null,cookie)).status,200);
 assert.equal((await call(artUrl)).status,404);
 saved.data.editions[0].artImage=artUrl;saved.data.editions[0].artCaption='작은 문장';saved.data.editions[1].images.push(url);saved.data.editions[2].published=false;
 const result=await call('/api/admin/catalog','PUT',saved,cookie);assert.equal(result.status,200);
 assert.equal((await call('/api/admin/catalog','PUT',saved,cookie)).status,409);
 assert.equal((await call(url)).status,200);
 assert.equal((await call(artUrl)).status,200);
 const publicData=await(await call('/api/catalog')).json();assert.equal(publicData.editions.length,2);assert.equal(publicData.editions.some(e=>e.id==='2026-09'),false);
 assert.equal(publicData.editions[0].artCaption,'작은 문장');
 assert.equal('pdf' in publicData.editions[0],false);
 const invalid=await(await call('/api/admin/catalog','GET',null,cookie)).json();invalid.data.editions[0].songUrl='javascript:alert(1)';assert.equal((await call('/api/admin/catalog','PUT',invalid,cookie)).status,400);
 assert.equal((await call('/api/auth/logout','POST',{},cookie)).status,200);assert.equal((await call('/api/admin/catalog','GET',null,cookie)).status,403);
 }finally{proc.kill();await once(proc,'exit').catch(()=>{});await rm(temp,{recursive:true,force:true})}
});
