import {readFile, readdir, stat} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../build/', import.meta.url));
async function files(directory) { return (await Promise.all((await readdir(directory,{withFileTypes:true})).map(async entry=>entry.isDirectory()?files(join(directory,entry.name)):join(directory,entry.name)))).flat(); }
const all=await files(root); const js=[]; const oversized=[];
for(const file of all){const size=(await stat(file)).size;if(file.endsWith('.js'))js.push({file,size,gzip:gzipSync(await readFile(file)).length});if(/\.(png|jpe?g|gif|svg)$/i.test(file)&&size>3_000_000)oversized.push({file,size});}
const total=js.reduce((sum,item)=>sum+item.gzip,0);const largest=Math.max(0,...js.map(item=>item.gzip));const failures=[];
const sorted=js.map((item)=>item.gzip).sort((a,b)=>a-b);
const p95=sorted[Math.floor((sorted.length-1)*0.95)]??0;
const main=js.find((item)=>/^main\./.test(relative(root,item.file).replaceAll('\\','/'))) ?? js.find((item)=>/[/\\]main\./.test(item.file));
// Total JavaScript grows with the number of code-split documentation routes and
// is not downloaded by one reader. Budget the shared entry, the largest chunk,
// and the route-chunk distribution instead.
if(main && main.gzip>300_000)failures.push(`Shared main bundle ${(main.gzip/1e3).toFixed(0)} KB exceeds 300 KB.`);
if(p95>75_000)failures.push(`95th percentile compressed JavaScript chunk ${(p95/1e3).toFixed(0)} KB exceeds 75 KB.`);
if(largest>900_000)failures.push(`Largest compressed JavaScript asset ${(largest/1e6).toFixed(2)} MB exceeds 0.9 MB.`);
for(const item of oversized)failures.push(`${relative(root,item.file)} is ${(item.size/1e6).toFixed(2)} MB; optimize or lazy-load it.`);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(`Performance budget passed: ${js.length} code-split chunks, main ${((main?.gzip??0)/1e3).toFixed(0)} KB, p95 ${(p95/1e3).toFixed(0)} KB, largest ${(largest/1e3).toFixed(0)} KB compressed (${(total/1e6).toFixed(2)} MB across all routes).`);
