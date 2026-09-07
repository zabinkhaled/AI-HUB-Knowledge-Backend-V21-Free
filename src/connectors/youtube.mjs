import {fetchWithTimeout} from '../core/http.mjs';

export async function searchYouTube({query,language='en',maxResults=6,timeoutMs=12000}){
  const key=process.env.YOUTUBE_API_KEY;
  if(!key)return{connector:'youtube',status:'disabled',results:[],reason:'YOUTUBE_API_KEY is not configured'};
  const url=new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part','snippet');
  url.searchParams.set('q',query);
  url.searchParams.set('type','video');
  url.searchParams.set('maxResults',String(Math.min(Math.max(Number(maxResults)||6,1),50)));
  if(language&&language!=='auto')url.searchParams.set('relevanceLanguage',language);
  url.searchParams.set('safeSearch','moderate');
  url.searchParams.set('key',key);
  const r=await fetchWithTimeout(url,{headers:{Accept:'application/json'}},timeoutMs);
  if(!r.ok){
    const text=await r.text().catch(()=> '');
    let detail='';
    try{const j=JSON.parse(text);detail=j?.error?.errors?.[0]?.reason||j?.error?.message||''}catch{}
    throw new Error(`YouTube API ${r.status}${detail?`: ${detail}`:''}${text&&!detail?`: ${text.slice(0,220)}`:''}`);
  }
  const data=await r.json();
  const results=(data.items||[]).filter(x=>x?.id?.videoId).map(x=>({
    id:x.id.videoId,type:'video',title:x.snippet?.title||'',description:x.snippet?.description||'',
    url:`https://www.youtube.com/watch?v=${x.id.videoId}`,
    embedUrl:`https://www.youtube.com/embed/${x.id.videoId}`,
    thumbnail:x.snippet?.thumbnails?.high?.url||x.snippet?.thumbnails?.default?.url,
    publishedAt:x.snippet?.publishedAt,author:x.snippet?.channelTitle,source:'YouTube',sourceType:'video'
  }));
  return{connector:'youtube',status:results.length?'ok':'no_results',results,reason:results.length?null:'YouTube returned no matching videos'};
}
