import assert from 'node:assert/strict';
const base=process.env.KNOWLEDGE_API_URL||'http://127.0.0.1:10000';
const q='Explain the official Python tutorial and show a useful Python example; include official documentation, YouTube learning material, and relevant GitHub repositories.';
const health=await fetch(`${base}/health`).then(r=>r.json());assert.equal(health.ok,true);
const r=await fetch(`${base}/api/knowledge/query`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:q,language:'en',mode:'text',sources:['web','official_docs','youtube','github']})});
const d=await r.json();
const required=['web','official_docs','youtube','github'];
for(const c of required){const x=d.connectorStatus?.find(v=>v.connector===c);assert(x,`missing connector ${c}`);assert.equal(x.status,'ok',`${c} not ok: ${x.reason||''}`);assert(x.resultCount>0,`${c} returned no results`)}
assert.equal(d.verification.checked>0,true);assert.equal(d.verification.verified,d.verification.checked);assert.equal(d.aiStatus,'ok',`AI status ${d.aiStatus}: ${d.answer||''}`);assert(d.answer);assert(d.citations.length>0);for(const c of d.citations){assert(c.verified);assert(d.sources.some(s=>(s.id||s.url)===c.id));assert(/^https?:\/\//.test(c.url))}
console.log(JSON.stringify({ok:true,engineVersion:d.engineVersion,connectors:d.connectorStatus,verification:d.verification,aiStatus:d.aiStatus,provider:d.aiProvider||null,citations:d.citations.length},null,2));
