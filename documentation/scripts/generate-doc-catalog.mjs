import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import matter from 'gray-matter';

const root = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = join(root, 'docs');
async function walk(dir) { return (await Promise.all((await readdir(dir,{withFileTypes:true})).map((entry)=>entry.isDirectory()?walk(join(dir,entry.name)):join(dir,entry.name)))).flat(); }
const files=(await walk(docsRoot)).filter((file)=>/\.mdx?$/.test(file));
const topics={java:'Java',spring:'Spring',development:'Engineering',operations:'Operations',architecture:'Architecture',data:'Data',security:'Security',observability:'Observability',cloud:'Cloud',ai:'AI',reliability:'Reliability',integration:'Integration','data-structures':'Data Structures','case-study':'Shopverse'};
const catalog=[];
for(const file of files){
  const source=await readFile(file,'utf8'); const parsed=matter(source); const data=parsed.data;
  const id=relative(docsRoot,file).split(sep).join('/').replace(/\.mdx?$/,''); const parts=id.split('/');
  const route=String(data.slug??(parts.at(-1)?.toUpperCase()==='README'?`/${parts.slice(0,-1).join('/')}`:`/${id.replace(/(^|\/)\d+-/g,'$1')}`)).replace(/\/$/,'')||'/';
  const technologies=Array.isArray(data.technologies)?data.technologies:Array.isArray(data.tags)?data.tags:[];
  catalog.push({title:String(data.title??parsed.content.match(/^#\s+(.+)$/m)?.[1]??parts.at(-1)),path:route,topic:topics[parts[0]]??parts[0],difficulty:String(data.difficulty??'Not classified'),pageType:String(data.page_type??'Guide'),technologies:technologies.map(String),status:String(data.status??'Unknown'),lastReviewed:String(data.last_reviewed??''),hasInterview:/^## .*Interview|<InterviewPractice/m.test(parsed.content),hasCode:/```(?:java|typescript|javascript|bash|powershell|yaml|sql)/.test(parsed.content),isLab:/\b(lab|hands-on|exercise)\b/i.test(`${data.page_type??''} ${data.title??''} ${id}`),isRunbook:/runbook/i.test(`${data.page_type??''} ${data.title??''} ${id}`),verifiedOfficial:/^## Official References$/m.test(parsed.content)&&/https:\/\/(?:docs\.|developer\.|kubernetes\.io|openjdk\.org|docs\.oracle\.com)/.test(parsed.content)});
}
catalog.sort((a,b)=>a.topic.localeCompare(b.topic)||a.title.localeCompare(b.title));
await writeFile(join(root,'src/data/generatedDocCatalog.json'),`${JSON.stringify(catalog,null,2)}\n`);
console.log(`Generated full documentation catalog: ${catalog.length} pages.`);
