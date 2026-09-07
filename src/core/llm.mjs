import {fetchWithTimeout} from './http.mjs';

const schema={type:'object',additionalProperties:false,properties:{title:{type:'string'},answer:{type:'string'},steps:{type:'array',items:{type:'string'}},caveats:{type:'array',items:{type:'string'}},citations:{type:'array',items:{type:'string'}},teachingPoints:{type:'array',items:{type:'string'}},actions:{type:'array',items:{type:'string'}}},required:['title','answer','steps','caveats','citations','teachingPoints','actions']};

function evidenceText(sources){
  return sources.slice(0,16).map((s,i)=>`SOURCE_ID: ${s.id||`S${i+1}`}\nTITLE: ${s.title||''}\nURL: ${s.url}\nTYPE: ${s.sourceType||''}\nVERIFIED: ${s.verification?.status||'unknown'}\nOFFICIAL: ${s.verification?.official?'yes':'no'}\nDESCRIPTION: ${s.description||''}`).join('\n\n');
}

function instructions(){return `You are AI HUB Pro Knowledge Engine. Use only the supplied evidence. Do not invent citations or facts. Every source-dependent claim must be traceable to one or more SOURCE_ID values. Prefer verified official sources. If evidence is insufficient, say so. Teach clearly, then give practical steps and safe next actions. The citations array must contain only SOURCE_ID values present in the evidence. Return ONLY the requested JSON object.`}

function clean(data,sources){
  const fallback={title:'AI HUB Knowledge Answer',answer:'',steps:[],caveats:[],citations:[],teachingPoints:[],actions:[]};
  data={...fallback,...(data&&typeof data==='object'?data:{})};
  for(const k of ['steps','caveats','citations','teachingPoints','actions'])if(!Array.isArray(data[k]))data[k]=[];
  const allowed=new Set(sources.map(s=>s.id||s.url));
  data.citations=data.citations.filter(x=>allowed.has(x));
  return data;
}

async function openRouter({question,language,mode,sources}){
  const key=process.env.OPENROUTER_API_KEY;if(!key)return null;
  const model=process.env.OPENROUTER_MODEL||'openrouter/free';
  const evidence=evidenceText(sources);
  const body={model,messages:[{role:'system',content:instructions()},{role:'user',content:`Question: ${question}\nLanguage: ${language}\nMode: ${mode}\n\nEvidence:\n${evidence}`}],temperature:0.2,max_tokens:Number(process.env.AI_MAX_OUTPUT_TOKENS||1800),response_format:{type:'json_schema',json_schema:{name:'knowledge_answer',strict:true,schema}}};
  const r=await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':process.env.OPENROUTER_SITE_URL||'https://ai-hub-pro.local','X-Title':'AI HUB Pro Knowledge Engine'},body:JSON.stringify(body)},Number(process.env.AI_PROVIDER_TIMEOUT_MS||30000));
  if(!r.ok){const text=await r.text().catch(()=> '');throw new Error(`OpenRouter API ${r.status}${text?`: ${text.slice(0,240)}`:''}`)}
  const data=await r.json();
  const content=data.choices?.[0]?.message?.content||'';
  let parsed;try{parsed=JSON.parse(content)}catch{return{status:'error',data:null,reason:'OpenRouter structured output parse failed'}}
  return{status:'ok',data:parsed,responseId:data.id||null,provider:'openrouter',model:data.model||model};
}

async function groq({question,language,mode,sources}){
  const key=process.env.GROQ_API_KEY;if(!key)return null;
  const model=process.env.GROQ_MODEL||'openai/gpt-oss-20b';
  const evidence=evidenceText(sources);
  const body={model,messages:[{role:'system',content:instructions()},{role:'user',content:`Question: ${question}\nLanguage: ${language}\nMode: ${mode}\n\nEvidence:\n${evidence}\n\nReturn valid JSON matching this shape exactly: ${JSON.stringify(schema)}`}],temperature:0.2,max_tokens:Number(process.env.AI_MAX_OUTPUT_TOKENS||1800),response_format:{type:'json_object'}};
  const r=await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)},Number(process.env.AI_PROVIDER_TIMEOUT_MS||30000));
  if(!r.ok){const text=await r.text().catch(()=> '');throw new Error(`Groq API ${r.status}${text?`: ${text.slice(0,240)}`:''}`)}
  const data=await r.json(); const content=data.choices?.[0]?.message?.content||''; let parsed;try{parsed=JSON.parse(content)}catch{return{status:'error',data:null,reason:'Groq JSON parse failed'}}
  return{status:'ok',data:parsed,responseId:data.id||null,provider:'groq',model:data.model||model};
}

export async function synthesize({question,language,mode,sources}){
  const providers=(process.env.AI_PROVIDER||'auto').toLowerCase();
  const order=providers==='openrouter'?['openrouter']:providers==='groq'?['groq']:['openrouter','groq'];
  let last=null;
  for(const p of order){try{const result=p==='openrouter'?await openRouter({question,language,mode,sources}):await groq({question,language,mode,sources});if(!result)continue;result.data=clean(result.data,sources);if(result.status==='ok'&&result.data.answer)return result;last=result}catch(e){last={status:'error',data:null,reason:e.message,provider:p}}}
  if(process.env.OPENAI_API_KEY&&providers==='openai')return{status:'disabled',data:null,reason:'Paid OpenAI mode is intentionally opt-in; set AI_PROVIDER=openai only after implementing a funded provider'};
  return last||{status:'disabled',data:null,reason:'No free AI provider is configured. Add OPENROUTER_API_KEY or GROQ_API_KEY.'};
}
