/** 의존성 없는 개발용/단일 인스턴스 Node 서버. UI와 서버는 명확히 분리합니다. */
import http from 'node:http';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID,timingSafeEqual,createHash} from 'node:crypto';
import {validateCatalog} from './validation.js';
import {kakaoAuthorizeUrl,kakaoUserId} from './kakao.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=resolve(process.env.DATA_DIR||resolve(root,'data')),uploads=resolve(process.env.UPLOAD_DIR||resolve(root,'uploads')),publicDir=resolve(root,'public');
const password=process.env.ADMIN_PASSWORD||'',production=process.env.NODE_ENV==='production';
const kakaoKey=process.env.KAKAO_REST_API_KEY||'',kakaoSecret=process.env.KAKAO_CLIENT_SECRET||'',kakaoRedirect=process.env.KAKAO_REDIRECT_URI||'';
const kakao=Boolean(kakaoKey&&kakaoRedirect),kakaoAdminIds=new Set((process.env.KAKAO_ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(x=>/^\d+$/.test(x)));
if(kakaoKey&&!kakaoRedirect)throw Error('KAKAO_REST_API_KEY와 KAKAO_REDIRECT_URI를 함께 설정해주세요.');
if(kakao){const callback=new URL(kakaoRedirect);if(callback.pathname!=='/api/auth/kakao/callback'||callback.search||callback.hash||!(callback.protocol==='https:'||(callback.protocol==='http:'&&callback.hostname==='127.0.0.1')))throw Error('KAKAO_REDIRECT_URI는 HTTPS 또는 127.0.0.1 콜백 주소여야 해요.');if(process.env.PUBLIC_ORIGIN&&callback.origin!==process.env.PUBLIC_ORIGIN)throw Error('KAKAO_REDIRECT_URI와 PUBLIC_ORIGIN의 주소가 달라요.');}
const dev=!kakao&&!password&&!production;
if(production&&!kakao&&password.length<16)throw Error('운영 모드에서는 카카오 로그인 또는 16자 이상의 ADMIN_PASSWORD를 설정해주세요.');
const host=dev?'127.0.0.1':(process.env.HOST||'127.0.0.1'),port=Number(process.env.PORT||3000);
await mkdir(dataDir,{recursive:true});await mkdir(uploads,{recursive:true});
const catalogFile=resolve(dataDir,'catalog.json');
try{await readFile(catalogFile)}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(catalogFile,await readFile(resolve(root,'data/catalog.example.json')))}
const sessions=new Map(),attempts=new Map();let writes=Promise.resolve();
const digest=body=>createHash('sha256').update(body).digest('hex');
async function state(){const text=await readFile(catalogFile,'utf8');return {data:JSON.parse(text),version:digest(text)}}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))}
function cookie(req){return /(?:^|;\s*)aftertrack_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1]}
function admin(req){const token=cookie(req),s=sessions.get(token);if(!s||s<Date.now()){sessions.delete(token);return false}return true}
function originOK(req){return req.headers.origin===(process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`)}
async function body(req,max=300000){let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>max)throw Error('요청 크기가 너무 커요.');chunks.push(c)}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}
function sessionCookie(value,age){return `aftertrack_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${production?'; Secure':''}`}
function stateCookie(value,age){return `aftertrack_kakao_state=${value}; Path=/api/auth/kakao/callback; HttpOnly; SameSite=Lax; Max-Age=${age}${production?'; Secure':''}`}
function redirect(res,location,cookies){res.writeHead(302,{Location:location,'Cache-Control':'no-store',...(cookies?{'Set-Cookie':cookies}:{})});res.end()}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
async function file(res,path){try{const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'});res.end(bytes)}catch(e){if(e.code!=='ENOENT')throw e;json(res,404,{error:'파일을 찾을 수 없어요.'})}}
const server=http.createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path.startsWith('/api/')&&req.method!=='GET'&&!originOK(req))return json(res,403,{error:'요청 출처를 확인할 수 없어요.'});
 if(path==='/api/auth/session'&&req.method==='GET')return json(res,200,{admin:admin(req),mode:kakao?'kakao':dev?'development':'password'});
 if(path==='/api/auth/kakao/start'&&req.method==='GET'){
  if(!kakao)return json(res,404,{error:'카카오 로그인이 설정되지 않았어요.'});
  const state=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',stateCookie(state,600));return redirect(res,kakaoAuthorizeUrl({restApiKey:kakaoKey,redirectUri:kakaoRedirect,state}));
 }
 if(path==='/api/auth/kakao/callback'&&req.method==='GET'){
  if(!kakao)return json(res,404,{error:'카카오 로그인이 설정되지 않았어요.'});
  const clear=stateCookie('',0),url=new URL(req.url,'http://localhost');
  const saved=/(?:^|;\s*)aftertrack_kakao_state=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1],returned=url.searchParams.get('state');
  if(!saved||!returned||!/^[a-f0-9]{64}$/.test(returned)||!timingSafeEqual(Buffer.from(saved),Buffer.from(returned)))return redirect(res,'/admin/?auth=state',clear);
  if(url.searchParams.has('error'))return redirect(res,'/admin/?auth=cancelled',clear);
  const code=url.searchParams.get('code');if(!code||code.length>2048)return redirect(res,'/admin/?auth=failed',clear);
  try{
   const id=await kakaoUserId({restApiKey:kakaoKey,clientSecret:kakaoSecret,redirectUri:kakaoRedirect,code});
   if(!kakaoAdminIds.has(id))return redirect(res,'/admin/?auth=not-allowed&id='+encodeURIComponent(id),clear);
   const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600000);
   return redirect(res,'/admin/',[clear,sessionCookie(token,28800)]);
  }catch{return redirect(res,'/admin/?auth=failed',clear)}
 }
 if(path==='/api/auth/login'&&req.method==='POST'){
  if(kakao)return json(res,403,{error:'카카오 로그인을 이용해주세요.'});
  const key=req.socket.remoteAddress,record=attempts.get(key)||{count:0,start:Date.now()};if(Date.now()-record.start>300000){record.count=0;record.start=Date.now()}if(record.count>=10)return json(res,429,{error:'잠시 후 다시 시도해주세요.'});const input=await body(req,4000);
  if(!dev&&!timingSafeEqual(Buffer.from(digest(String(input.password||''))),Buffer.from(digest(password)))){record.count++;attempts.set(key,record);return json(res,401,{error:'비밀번호를 확인해주세요.'})}
  attempts.delete(key);const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600000);res.setHeader('Set-Cookie',sessionCookie(token,28800));return json(res,200,{ok:true});
 }
 if(path==='/api/auth/logout'&&req.method==='POST'){sessions.delete(cookie(req));res.setHeader('Set-Cookie',sessionCookie('',0));return json(res,200,{ok:true})}
 if(path==='/api/catalog'&&req.method==='GET'){const {data}=await state();return json(res,200,{...data,editions:data.editions.filter(e=>e.published)})}
 if(path.startsWith('/api/admin/')&&!admin(req))return json(res,403,{error:'관리자 로그인이 필요해요.'});
 if(path==='/api/admin/catalog'&&req.method==='GET')return json(res,200,await state());
 if(path==='/api/admin/catalog'&&req.method==='PUT'){
  const input=await body(req);const data=validateCatalog(input.data);
  const task=writes.then(async()=>{const old=await state();if(old.version!==input.version)return json(res,409,{error:'다른 창에서 먼저 수정했어요. 새로고침 후 다시 저장해주세요.'});const text=JSON.stringify(data,null,2),tmp=catalogFile+'.tmp';await writeFile(tmp,text);await rename(tmp,catalogFile);json(res,200,{data,version:digest(text)})});writes=task.catch(()=>{});await task;return;
 }
 if(path==='/api/admin/upload'&&req.method==='POST'){
  const input=await body(req,29*1024*1024);if(typeof input.base64!=='string'||input.base64.length>28*1024*1024||! /^[A-Za-z0-9+/]*={0,2}$/.test(input.base64))return json(res,400,{error:'파일 인코딩을 확인해주세요.'});const bytes=Buffer.from(input.base64,'base64');if(!bytes.length||bytes.length>20*1024*1024)return json(res,400,{error:'파일은 1바이트 이상 20MB 이하로 선택해주세요.'});
  const ext=bytes[0]===137&&bytes.subarray(1,4).toString()==='PNG'?'png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'webp':null;
  if(!ext)return json(res,400,{error:'PNG, JPG, WebP 이미지만 지원해요.'});const id=randomUUID()+'.'+ext;await writeFile(resolve(uploads,id),bytes,{flag:'wx'});return json(res,200,{url:'/media/'+id});
 }
 if(path.startsWith('/api/'))return json(res,404,{error:'지원하지 않는 API예요.'});
 if(path.startsWith('/media/')){if(!/^\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(path))return json(res,404,{error:'파일을 찾을 수 없어요.'});const {data}=await state();if(!admin(req)&&!data.editions.some(e=>e.published&&(e.artImage===path||e.images.includes(path))))return json(res,404,{error:'파일을 찾을 수 없어요.'});return file(res,resolve(uploads,path.slice(7)))}
 if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'허용되지 않는 요청이에요.'});
 const relative=path==='/'?'index.html':path==='/admin'||path==='/admin/'?'admin/index.html':decodeURIComponent(path).replace(/^\/+/,''),target=resolve(publicDir,relative);
 if(!target.startsWith(publicDir+sep)||relative.split('/').some(p=>p.startsWith('.')))return json(res,404,{error:'페이지를 찾을 수 없어요.'});await file(res,target);
 }catch(error){if(!res.headersSent)json(res,400,{error:error.message||'처리하지 못했어요.'});else res.end()}});
server.listen(port,host,()=>console.log(`여운: http://${host}:${server.address().port}\n관리자: http://${host}:${server.address().port}/admin/\n${kakao?'카카오 관리자 로그인 활성화':dev?'로컬 개발 모드 — 외부 접속 불가':'관리자 비밀번호 인증 활성화'}`));
setInterval(()=>{const now=Date.now();for(const [k,v]of sessions)if(v<now)sessions.delete(k);for(const [k,v]of attempts)if(now-v.start>300000)attempts.delete(k)},60000).unref();
