/* Cloudflare Worker — Jeong Oksoon consultation backend
   Deploy separately; never put OPENAI_API_KEY in GitHub Pages.
   Bind D1 as DB; set OPENAI_API_KEY and IP_HASH_SALT as Worker secrets.
*/
const FREE_QUESTIONS=1, MAX_QUESTION=600, MAX_SESSIONS_PER_IP_DAY=3;
const ALLOWED_PILLAR=/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/;
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});}
async function digest(s){const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,"0")).join("");}
function cleanProfile(raw){
 if(!raw||typeof raw!=="object"||!Array.isArray(raw.birthday)||raw.birthday.length!==3)throw Error("생년월일을 확인해줘");
 const birthday=raw.birthday.map(Number);
 if(!birthday.every(Number.isInteger)||birthday[0]<1900||birthday[0]>2027||birthday[1]<1||birthday[1]>12||birthday[2]<1||birthday[2]>31)throw Error("생년월일을 확인해줘");
 const pillars=raw.pillars||{};
 for(const k of ["year","month","day"]){if(!ALLOWED_PILLAR.test(pillars[k]||""))throw Error("만세력을 확인해줘");}
 if(pillars.hour&&!ALLOWED_PILLAR.test(pillars.hour))throw Error("시주 정보를 확인해줘");
 const context=raw.userProvided||{};
 const cleanContext={};
 for(const k of ["work","love","worry"])cleanContext[k]=String(context[k]||"").slice(0,120);
 return {name:String(raw.name||"손님").slice(0,20),birthday,calendar:["양력","음력","음력 윤달"].includes(raw.calendar)?raw.calendar:"양력",unknown:!!raw.unknown,pillars:{year:pillars.year,month:pillars.month,day:pillars.day,hour:!raw.unknown?pillars.hour||null:null},userProvided:cleanContext};
}
const INSTRUCTIONS=[
"너는 가상 인물 '진도 정옥순 할매' 역할을 하는 전통 명리 상징 풀이 상담사다.",
"한국어로 친근하고 노련한 할머니 반말로 답한다. 고객을 '자네'라고 부르고 짧고 자연스러운 문장으로 7~12문장 대화하듯 말한다.",
"질문에 직접 답하고, 태어난 일간·월지·해당 해 기운 등 제공된 기호 중 관련 있는 명리 근거를 1~2개 짚어준다. 모르는 계산이나 정확한 대운·시주·절입 시간은 만들어내지 않는다.",
"사용자가 직접 제공한 사실과 만세력 기호에서 상징적으로 해석한 내용을 명확히 구분한다. 사용자가 알려준 내용을 초능력으로 알아맞힌 척하지 않는다.",
"미래 사건 날짜, 특정 돈이 들어오는 시기, 당첨, 결혼일, 건강 위험 등을 정확히 예언하지 않는다. '돈이 언제 들어오냐'에는 실제 계약·채권·현금흐름 정보가 없다는 점을 밝히고, 운세는 상징적 힌트로만 설명하며 구체적 현실 행동을 권한다.",
"흔한 칭찬/바넘식 단정만 길게 늘어놓지 말고, 실제 제공된 기호와 질문을 잇는 구체적인 이유와 2~3가지 현실적인 선택지를 말한다.",
"건강·재산·법률 상담은 전문가 판단을 대신하지 않고, 취약한 이용자에게 불안·의존을 유발하거나 결제를 압박하지 않는다.",
"너는 실제 무당이 아니다. 영적 능력 또는 전생의 사실 여부를 주장하지 마라.",
"상담 종료에서 업셀링을 강요하지 않는다. 질문이 불명확할 때만 마지막에 짧은 확인 질문 1개를 할 수 있다.",
"주어진 정보에 개인정보가 있어도 불필요하게 반복하지 않는다."
].join("\n");
function extractResponse(data){
 if(typeof data.output_text==="string"&&data.output_text.trim())return data.output_text.trim();
 const parts=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text"&&typeof x.text==="string").map(x=>x.text);
 return parts.join("\n").trim();
}
export default {async fetch(request,env){
 const origin=request.headers.get("Origin")||"";
 const allowed=env.ALLOWED_ORIGIN||"https://nohseongeun.github.io";
 const headers={"access-control-allow-origin":allowed,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"Authorization, Content-Type","vary":"Origin"};
 if(origin!==allowed)return json({error:"허용되지 않은 출처야"},403);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 const u=new URL(request.url);
 if(request.method!=="POST"||!["/api/session","/api/consult"].includes(u.pathname))return json({error:"찾을 수 없는 주소야"},404,headers);
 if(!env.DB||!env.OPENAI_API_KEY||!env.IP_HASH_SALT)return json({error:"상담 서버 설정이 아직 끝나지 않았어"},503,headers);
 const length=Number(request.headers.get("content-length")||0);
 if(length>10000)return json({error:"입력 내용이 너무 길어"},413,headers);
 let body;
 try{body=await request.json();}catch{return json({error:"입력을 확인해줘"},400,headers);}
 const now=Date.now(),ip=request.headers.get("CF-Connecting-IP")||"unknown";
 if(u.pathname==="/api/session"){
  try{
   const profile=cleanProfile(body.profile);
   const date=new Date(now).toISOString().slice(0,10);
   const hash=await digest(env.IP_HASH_SALT+"|"+date+"|"+ip);
   const limit=await env.DB.prepare("INSERT INTO daily_limits(day,ip_hash,starts) VALUES(?,?,1) ON CONFLICT(day,ip_hash) DO UPDATE SET starts=starts+1 WHERE starts<? RETURNING starts").bind(date,hash,MAX_SESSIONS_PER_IP_DAY).first();
   if(!limit)return json({error:"오늘은 무료 상담방을 더 열 수 없어. 잠시 후 다시 찾아와줘",code:"RATE_LIMIT"},429,headers);
   const secret=crypto.getRandomValues(new Uint8Array(32));
   const token=Array.from(secret).map(n=>n.toString(16).padStart(2,"0")).join("");
   const id=await digest(token);
   await env.DB.prepare("INSERT INTO sessions(id,profile_json,used,reserved,created_at) VALUES(?,?,0,0,?)").bind(id,JSON.stringify(profile),now).run();
   return json({token,remaining:FREE_QUESTIONS},201,headers);
  }catch(e){return json({error:e.message||"상담방을 열지 못했어"},400,headers);}
 }
 const auth=request.headers.get("Authorization")||"";
 const token=auth.startsWith("Bearer ")?auth.slice(7):"";
 if(!/^[a-f0-9]{64}$/.test(token))return json({error:"상담방 인증이 필요해"},401,headers);
 const id=await digest(token);
 const record=await env.DB.prepare("SELECT profile_json,used,reserved,created_at FROM sessions WHERE id=?").bind(id).first();
 if(!record||now-record.created_at>604800000)return json({error:"상담 시간이 만료됐어"},401,headers);
 if(record.used>=FREE_QUESTIONS)return json({error:"무료 질문은 1회까지야",code:"LIMIT_REACHED"},403,headers);
 const question=typeof body.question==="string"?body.question.trim():"";
 if(question.length<2||question.length>MAX_QUESTION)return json({error:"질문은 2~600자로 적어줘"},400,headers);
 const reserved=await env.DB.prepare("UPDATE sessions SET reserved=1 WHERE id=? AND used=0 AND reserved=0 RETURNING id").bind(id).first();
 if(!reserved)return json({error:"상담을 처리 중이거나 이미 사용했어",code:"BUSY"},409,headers);
 try{
  const profile=JSON.parse(record.profile_json);
  const input=JSON.stringify({birth_data_from_visitor:profile,question_from_visitor:question,interpretation_note:"출생 정보와 만세력은 방문자가 전달한 값이며 서버는 원본 만세력을 독립 재검산하지 않았다."});
  const resp=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},
   body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-6-luna",instructions:INSTRUCTIONS,input,max_output_tokens:850,store:false})
  });
  if(!resp.ok)throw Error("상담 생성 연결 오류");
  const data=await resp.json(),answer=extractResponse(data);
  if(!answer)throw Error("할매 답변을 준비하지 못했어");
  await env.DB.prepare("UPDATE sessions SET used=1,reserved=0 WHERE id=?").bind(id).run();
  return json({answer,remaining:0},200,headers);
 }catch(e){
  await env.DB.prepare("UPDATE sessions SET reserved=0 WHERE id=? AND used=0").bind(id).run();
  return json({error:"상담이 잠시 끊겼어. 무료 횟수는 차감하지 않았으니 다시 시도해줘"},502,headers);
 }
}};