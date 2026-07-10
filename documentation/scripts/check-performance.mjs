import {readFile, readdir, stat} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../build/', import.meta.url));
async function files(directory) { return (await Promise.all((await readdir(directory,{withFileTypes:true})).map(async entry=>entry.isDirectory()?files(join(directory,entry.name)):join(directory,entry.name)))).flat(); }
const all=await files(root); const js=[]; const oversized=[];
for(const file of all){const size=(await stat(file)).size;if(file.endsWith('.js'))js.push({file,size,gzip:gzipSync(await readFile(file)).length});if(/\.(png|jpe?g|gif|svg)$/i.test(file)&&size>3_000_000)oversized.push({file,size});}
const total=js.reduce((sum,item)=>sum+item.gzip,0);const largest=Math.max(0,...js.map(item=>item.gzip));const failures=[];
if(total>3_500_000)failures.push(`Total compressed JavaScript ${(total/1e6).toFixed(2)} MB exceeds 3.5 MB.`);
if(largest>900_000)failures.push(`Largest compressed JavaScript asset ${(largest/1e6).toFixed(2)} MB exceeds 0.9 MB.`);
for(const item of oversized)failures.push(`${relative(root,item.file)} is ${(item.size/1e6).toFixed(2)} MB; optimize or lazy-load it.`);
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(`Performance budget passed: ${(total/1e6).toFixed(2)} MB compressed JavaScript, largest asset ${(largest/1e6).toFixed(2)} MB.`);
