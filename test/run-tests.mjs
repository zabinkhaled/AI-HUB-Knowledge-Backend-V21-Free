import assert from 'node:assert/strict';
import {chooseSources,normalizeSources} from '../src/core/source-policy.mjs';
import {rankAndDeduplicate} from '../src/core/rank.mjs';
import {safeUrl} from '../src/core/http.mjs';
import {verifySources} from '../src/core/verify.mjs';
import {knowledgeQueryHandler} from '../src/routes/knowledge-query.mjs';

let n=0; const pass=(name)=>{n++;console.log(`PASS ${name}`)};
assert.deepEqual(normalizeSources(['meta','docs','image']),['facebook','official_docs','images']);pass('source aliases');
assert(chooseSources('How do I repair an Android phone?',[]).includes('youtube'));pass('source routing repair');
assert(chooseSources('How do I use Python API?',[]).includes('github'));pass('source routing coding');
const ranked=rankAndDeduplicate([{results:[{id:'1',url:'https://x.test/a',title:'A',source:'Web Search'},{id:'1b',url:'https://x.test/a',title:'A2'}]}]);assert.equal(ranked.length,1);pass('dedupe');
assert.throws(()=>safeUrl('http://127.0.0.1:8080/x'));pass('SSRF localhost blocked');
const oldFetch=global.fetch;
global.fetch=async()=>new Response('ok',{status:200,headers:{'content-type':'text/html'}});
const v=await verifySources([{id:'s1',title:'Python',url:'https://docs.python.org/3/',source:'Official Documentation'}],{limit:1});assert.equal(v[0].verification.status,'verified');assert.equal(v[0].verification.official,true);pass('source verification');
global.fetch=oldFetch;
process.env.OPENAI_API_KEY='';
let r=await knowledgeQueryHandler({method:'GET'});assert.equal(r.status,405);pass('method guard');
r=await knowledgeQueryHandler({method:'POST',body:JSON.stringify({question:''})});assert.equal(r.status,400);pass('empty question');
r=await knowledgeQueryHandler({method:'POST',body:'{bad json'});assert.equal(r.status,400);pass('invalid JSON rejected');
r=await knowledgeQueryHandler({method:'POST',body:JSON.stringify({question:'x',sources:['bogus']})});assert.equal(r.status,400);pass('invalid source rejected');
// Integration with mocked network + OpenAI connector by replacing the module's SDK is not possible without a loader; validate disabled-provider behavior end-to-end.
r=await knowledgeQueryHandler({method:'POST',body:JSON.stringify({question:'How do I learn Python?',sources:['youtube','github','web','official_docs','images']})});assert.equal(r.status,200);assert.equal(r.body.ok,true);assert.equal(r.body.engineVersion,'2.1.1-free');assert(r.body.connectorStatus.length>=5);assert.equal(r.body.aiStatus,'disabled');pass('orchestrator disabled-provider integration');
console.log(`ALL ${n} TESTS PASSED`);
