import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = join(root, 'docs');
const reports = join(root, 'reports');
async function walk(dir) { return (await Promise.all((await readdir(dir,{withFileTypes:true})).map((e)=>e.isDirectory()?walk(join(dir,e.name)):join(dir,e.name)))).flat(); }
const files=(await walk(docsRoot)).filter((f)=>['.md','.mdx'].includes(extname(f)));
function strip(c){return c.replace(/^---[\s\S]*?---\s*/m,' ').replace(/```[\s\S]*?```/g,' ').replace(/<[^>]+>/g,' ').replace(/https?:\/\/\S+/g,' ');}
function tokens(c){return strip(c).toLowerCase().match(/[a-z][a-z0-9-]{2,}/g)??[];}
function shingles(ts,n=5){const s=new Set();for(let i=0;i<=ts.length-n;i++)s.add(ts.slice(i,i+n).join(' '));return s;}
function jaccard(a,b){let hit=0;for(const x of a)if(b.has(x))hit++;return hit/(a.size+b.size-hit||1);}
function has(c,re){return re.test(c);}

const pages=[];
for(const file of files){const content=await readFile(file,'utf8');const path=relative(docsRoot,file).replaceAll('\\','/');const t=tokens(content);const pageType=content.match(/^page_type:\s*(.+)$/m)?.[1]?.trim()??'Unclassified';const difficulty=content.match(/^difficulty:\s*(.+)$/m)?.[1]?.trim()??'Unclassified';const criteria={
  mentalModel:t.length>=250,
  internals:has(content,/\binternals?\b|how it works|execution model|lifecycle/i),
  example:has(content,/```|## (?:Example|Lab|Hands-On)/i),
  failureModes:has(content,/failure|common mistake|pitfall|timeout|overload/i),
  performance:has(content,/performance|latency|throughput|capacity|memory|CPU/i),
  security:has(content,/security|authorization|encryption|PII|threat/i),
  operations:has(content,/operations|monitor|metric|alert|backup|recovery|runbook/i),
  lab:has(content,/## .*Lab|hands-on|exercise/i),
  interview:has(content,/interview|question|rubric/i),
  official:has(content,/## Official References/i),
  visual:has(content,/```mermaid|!\[[^\]]*\]\([^)]+\)|^\|.+\|\r?\n\|/m),
};const depthSignals=['internals','example','failureModes','performance','security','operations','lab','interview'].filter((key)=>criteria[key]).length;const score=t.length<80?0:(t.length>=300&&criteria.visual&&criteria.official&&depthSignals>=4)?3:(t.length>=180&&(criteria.visual||criteria.example)&&depthSignals>=2)?2:1;const target=['Tutorial','Decision Guide','Concept','Case Study','Runbook'].includes(pageType)?2:1;pages.push({path,pageType,difficulty,words:t.length,score,target,belowTarget:score<target,criteria,shingles:shingles(t)});}
const pairs=[];for(let i=0;i<pages.length;i++)for(let j=i+1;j<pages.length;j++){if(pages[i].words<300||pages[j].words<300)continue;const similarity=jaccard(pages[i].shingles,pages[j].shingles);if(similarity>=0.42)pairs.push({left:pages[i].path,right:pages[j].path,similarity:Number(similarity.toFixed(3))});}
pairs.sort((a,b)=>b.similarity-a.similarity);
const report={generatedAt:new Date().toISOString(),summary:{pages:pages.length,level0:pages.filter(p=>p.score===0).length,level1:pages.filter(p=>p.score===1).length,level2:pages.filter(p=>p.score===2).length,level3:pages.filter(p=>p.score===3).length,belowTarget:pages.filter(p=>p.belowTarget).length,nearDuplicatePairs:pairs.length},pages:pages.map(({shingles,...p})=>p),nearDuplicates:pairs};
await mkdir(reports,{recursive:true});await writeFile(join(reports,'documentation-depth-and-similarity.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Depth audit: L0=${report.summary.level0}, L1=${report.summary.level1}, L2=${report.summary.level2}, L3=${report.summary.level3}; below page-type target=${report.summary.belowTarget}; semantic near-duplicate pairs=${pairs.length}`);
for(const page of pages.filter(p=>p.belowTarget).slice(0,30))console.log(`- below target: ${page.path} (L${page.score}, target L${page.target})`);
for(const pair of pairs.slice(0,20))console.log(`- ${pair.similarity}: ${pair.left} <> ${pair.right}`);
