import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = join(root, 'docs');
const reports = join(root, 'reports');
async function walk(dir) { return (await Promise.all((await readdir(dir, {withFileTypes:true})).map((entry) => entry.isDirectory() ? walk(join(dir, entry.name)) : join(dir, entry.name)))).flat(); }
function normalized(url) { const value=new URL(url); value.hash=''; value.pathname=value.pathname.replace(/\/$/,''); return value.toString(); }

const files=(await walk(docsRoot)).filter((file)=>['.md','.mdx'].includes(extname(file)));
const owners=new Map();
for(const file of files){
  const content=await readFile(file,'utf8');
  for(const section of content.matchAll(/## Official References\s+([\s\S]*?)(?=\n## |$)/gi)){
    for(const match of section[1].matchAll(/https:\/\/[^)\s]+/g)){
      const url=match[0]; owners.set(url,[...(owners.get(url)??[]),relative(docsRoot,file).replaceAll('\\','/')]);
    }
  }
}

const urls=[...owners.keys()]; let cursor=0; const results=[];
async function worker(){
  while(cursor<urls.length){
    const url=urls[cursor++]; const started=Date.now();
    try{
      const response=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(15000),headers:{'user-agent':'ShopverseDocsLinkCheck/1.0'}});
      const rateLimited=[403,429].includes(response.status);
      results.push({url,finalUrl:response.url,status:response.status,ok:response.ok||rateLimited,rateLimited,redirected:normalized(response.url)!==normalized(url),durationMs:Date.now()-started,pages:owners.get(url)});
      try{await response.body?.cancel();}catch{}
    }catch(error){results.push({url,status:0,ok:false,rateLimited:false,redirected:false,error:String(error),durationMs:Date.now()-started,pages:owners.get(url)});}
  }
}
await Promise.all(Array.from({length:Math.min(8,urls.length)},worker)); results.sort((a,b)=>a.url.localeCompare(b.url));
const summary={links:results.length,ok:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,redirected:results.filter(r=>r.redirected).length,rateLimited:results.filter(r=>r.rateLimited).length};
await mkdir(reports,{recursive:true}); await writeFile(join(reports,'official-link-check.json'),JSON.stringify({generatedAt:new Date().toISOString(),summary,results},null,2)+'\n');
console.log(`Official links: ${summary.links}; ok=${summary.ok}; failed=${summary.failed}; redirected=${summary.redirected}; rate-limited=${summary.rateLimited}`);
for(const result of results.filter(r=>!r.ok||r.redirected))console.log(`- ${result.status} ${result.url}${result.redirected?` -> ${result.finalUrl}`:''}${result.error?` (${result.error})`:''}`);
if(process.argv.includes('--strict')&&results.some(r=>!r.ok))process.exitCode=1;
