import http from 'node:http';
import {knowledgeQueryHandler} from './routes/knowledge-query.mjs';
const port=Number(process.env.PORT||10000);
const host='0.0.0.0';
function send(res,status,body,headers={}){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8',...headers});
  res.end(JSON.stringify(body));
}
const server=http.createServer(async (req,res)=>{
  try{
    if((req.method==='GET'||req.method==='HEAD') && req.url==='/health') return send(res,200,{ok:true,service:'ai-hub-pro-knowledge-backend',engineVersion:'2.0.0'});
    if((req.method==='GET'||req.method==='HEAD') && req.url==='/e2e-config') return send(res,200,{ok:true,required:['web','youtube','github','official_docs'],engineVersion:'2.0.0'});
    if(req.url!=='/api/knowledge/query') return send(res,404,{error:'Not found'});
    let raw='';
    for await (const chunk of req) raw+=chunk;
    const out=await knowledgeQueryHandler({method:req.method,body:raw});
    return send(res,out.status,out.body);
  }catch(e){return send(res,500,{error:e?.message||'Internal error'});}
});
server.listen(port,host,()=>console.log(`AI HUB Pro Knowledge Backend listening on ${host}:${port}`));
