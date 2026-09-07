import {fetchWithTimeout} from '../core/http.mjs';

const STOPWORDS=new Set('the a an and or for to of in on with show useful explain official tutorial include documentation learning material relevant repositories from how what is are this that using use'.split(' '));
const TECH=new Set(['python','javascript','typescript','java','csharp','c++','go','rust','node','nodejs','react','vue','angular','api','sdk','github','docker','kubernetes','openai','photoshop','android','ios']);

function focusedQuery(input){
  const raw=String(input||'').toLowerCase().replace(/[^a-z0-9+#.\s_-]/g,' ');
  const words=raw.split(/\s+/).filter(Boolean);
  const tech=words.filter(w=>TECH.has(w));
  const useful=words.filter(w=>w.length>=3&&!STOPWORDS.has(w)&&!/^\d+$/.test(w));
  const chosen=[...new Set([...tech,...useful])].slice(0,8);
  return chosen.length?chosen.join(' '):String(input||'').trim().slice(0,120);
}

export async function searchGitHub({query,maxResults=6,timeoutMs=10000}){
  const focused=focusedQuery(query);
  const url=new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q',`${focused} in:name,description,readme`);
  url.searchParams.set('per_page',String(Math.min(Math.max(Number(maxResults)||6,1),30)));
  url.searchParams.set('sort','stars');
  url.searchParams.set('order','desc');
  const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'AI-HUB-Pro-Knowledge-Engine/2.1'};
  if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
  const r=await fetchWithTimeout(url,{headers},timeoutMs);
  if(!r.ok){const text=await r.text().catch(()=> '');throw new Error(`GitHub API ${r.status}${text?`: ${text.slice(0,220)}`:''}`)}
  const data=await r.json();
  const results=(data.items||[]).map(x=>({id:String(x.id),type:'repository',title:x.full_name,description:x.description||'',url:x.html_url,publishedAt:x.created_at,updatedAt:x.updated_at,author:x.owner?.login,source:'GitHub',sourceType:'repository',stars:x.stargazers_count||0}));
  return{connector:'github',status:results.length?'ok':'no_results',results,query:focused,reason:results.length?null:'GitHub returned no matching repositories'};
}
