import {fetchWithTimeout} from '../core/http.mjs';

function normalize(items, includeImages=false){
  const out=[]; const seen=new Set();
  for(const r of items||[]){
    const url=r?.url;
    if(!url||seen.has(url)) continue;
    seen.add(url);
    out.push({
      id:url,type:includeImages?'media':'web',title:r.title||url,
      description:r.content||r.description||r.snippet||'',url,
      thumbnail:r.image_url||r.thumbnail_url,source:includeImages?'Image Search':'Web Search',
      sourceType:includeImages?'image':'web',publishedAt:r.published_date||r.publishedAt
    });
  }
  return out.slice(0,30);
}

async function searchTavily({query,allowedDomains=[],maxResults=8,includeImages=false,timeoutMs=12000}){
  const key=process.env.TAVILY_API_KEY;
  if(!key)return{connector:includeImages?'images':'web',status:'disabled',results:[],reason:'TAVILY_API_KEY is not configured'};
  const body={query,search_depth:process.env.TAVILY_SEARCH_DEPTH||'basic',max_results:Math.min(maxResults,20),include_answer:false,include_raw_content:false,include_images:!!includeImages};
  if(allowedDomains.length)body.include_domains=allowedDomains.slice(0,100);
  const r=await fetchWithTimeout('https://api.tavily.com/search',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)},timeoutMs);
  if(!r.ok){
    const text=await r.text().catch(()=> '');
    throw new Error(`Tavily API ${r.status}${text?`: ${text.slice(0,300)}`:''}`);
  }
  const data=await r.json();
  const results=normalize(data.results,includeImages);
  if(includeImages&&Array.isArray(data.images)){
    for(const img of data.images.slice(0,Math.min(maxResults,10))){
      if(!img?.url)continue;
      results.push({id:img.url,type:'media',title:img.description||'Image',description:img.description||'',url:img.url,thumbnail:img.url,source:'Tavily Image Search',sourceType:'image'});
    }
  }
  return{connector:includeImages?'images':'web',status:results.length?'ok':'no_results',results:normalize(results,includeImages),reason:results.length?null:'Tavily returned no results'};
}

export async function searchWeb(args){return searchTavily(args)}
