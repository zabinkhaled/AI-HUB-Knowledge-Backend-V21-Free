import http from 'node:http';
import {knowledgeQueryHandler} from './routes/knowledge-query.mjs';
const port=Number(process.env.PORT||10000),host='0.0.0.0';
function send(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}
async function readBody(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw new Error('Request body too large')}return raw;}
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{ok:true,service:'ai-hub-pro-knowledge-backend',engineVersion:'2.1.0-free'});if(req.method==='GET'&&url.pathname==='/e2e-config')return send(res,200,{ok:true,required:['web','official_docs','youtube','github'],aiProviders:['openrouter','groq'],searchProvider:'tavily',engineVersion:'2.1.0-free'});if(req.method==='POST'&&url.pathname==='/api/knowledge/query'){const out=await knowledgeQueryHandler({method:req.method,body:await readBody(req)});return send(res,out.status,out.body)}return send(res,404,{error:'Not found'})}catch(e){console.error(e);return send(res,500,{error:e.message||'Internal server error'})}});
server.listen(port,host,()=>console.log(`AI HUB Pro Knowledge Backend listening on ${host}:${port}`));
