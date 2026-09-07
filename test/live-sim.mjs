import assert from 'node:assert/strict';
process.env.TAVILY_API_KEY='test'; process.env.OPENROUTER_API_KEY='test'; process.env.OPENROUTER_MODEL='openrouter/free'; process.env.YOUTUBE_API_KEY='test'; process.env.GITHUB_TOKEN=''; process.env.KNOWLEDGE_CACHE_SECONDS='0';
const oldFetch=global.fetch;
global.fetch=async(input,opts={})=>{
 const u=String(input);
 if(u.includes('api.tavily.com/search')) return new Response(JSON.stringify({results:[{title:'Python Tutorial',url:'https://docs.python.org/3/tutorial/',content:'Official Python tutorial'},{title:'Python',url:'https://www.python.org/',content:'Python official website'}]}),{status:200,headers:{'content-type':'application/json'}});
 if(u.includes('openrouter.ai/api/v1/chat/completions')) return new Response(JSON.stringify({id:'or_test',model:'test-free',choices:[{message:{content:JSON.stringify({title:'Python Tutorial',answer:'Use the official Python tutorial first.',steps:['Read the tutorial'],caveats:[],citations:['https://docs.python.org/3/tutorial/'],teachingPoints:['Start with the official tutorial.'],actions:['Practice a small script']})}}]}),{status:200,headers:{'content-type':'application/json'}});
 if(u.includes('googleapis.com/youtube')) return new Response(JSON.stringify({items:[{id:{videoId:'yt123'},snippet:{title:'Python Video',description:'Learn Python',publishedAt:'2026-09-01T00:00:00Z',channelTitle:'Python Channel',thumbnails:{high:{url:'https://i.ytimg.com/vi/yt123/hqdefault.jpg'}}}}]}),{status:200,headers:{'content-type':'application/json'}});
 if(u.includes('api.github.com/search/repositories')) return new Response(JSON.stringify({items:[{id:42,full_name:'python/cpython',description:'Python source',html_url:'https://github.com/python/cpython',created_at:'2020-01-01T00:00:00Z',updated_at:'2026-09-01T00:00:00Z',owner:{login:'python'}}]}),{status:200,headers:{'content-type':'application/json'}});
 return new Response('ok',{status:200,headers:{'content-type':'text/html'}});
};
const {runKnowledgeQuery}=await import('../src/core/orchestrator.mjs');
const r=await runKnowledgeQuery({question:'How do I learn Python?',sources:['web','official_docs','youtube','github']});
assert.equal(r.ok,true); assert.equal(r.aiStatus,'ok'); assert.equal(r.aiProvider,'openrouter'); assert(r.sources.length>=2); assert(r.verification.verified>=2); assert(r.verification.official>=1); assert.equal(r.citations.length,1); assert.equal(r.citations[0].official,true); assert.equal(r.citations[0].verified,true); console.log('PASS free-provider orchestration simulation');
global.fetch=oldFetch;
