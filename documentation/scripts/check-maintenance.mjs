import {readdir, readFile} from 'node:fs/promises';
import {extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../docs/',import.meta.url));
async function collect(directory){return(await Promise.all((await readdir(directory,{withFileTypes:true})).map(entry=>entry.isDirectory()?collect(join(directory,entry.name)):join(directory,entry.name)))).flat();}
const files=(await collect(root)).filter(file=>['.md','.mdx'].includes(extname(file)));const failures=[];const suggestions=[];
for(const file of files){const content=await readFile(file,'utf8');const path=relative(root,file);const words=(content.match(/\b[\w-]+\b/g)??[]).length;const h2=(content.match(/^## /gm)??[]).length;const completeMetadata=/^difficulty:/m.test(content)&&/^page_type:/m.test(content)&&/^status:/m.test(content)&&/^last_reviewed:/m.test(content);
  if(words>=2000&&!completeMetadata)failures.push(`${path}: ${words} words but missing complete structured metadata.`);
  if(words>3500)failures.push(`${path}: ${words} words exceeds the 3,500-word split threshold.`);
  if(h2>28&&words>2500)failures.push(`${path}: ${h2} top-level sections across ${words} words exceeds the navigation threshold.`);
  const powerShell=(content.match(/```powershell/g)??[]).length;const gradle=(content.match(/```gradle/g)??[]).length;
  if(powerShell>=3&&!content.includes('<CommandTabs')&&!content.includes('command-tabs: powershell-only'))suggestions.push(`${path}: consider consolidating ${powerShell} PowerShell blocks into CommandTabs.`);
  if(gradle>=3&&!content.includes('<DependencyTabs'))suggestions.push(`${path}: consider consolidating ${gradle} Gradle blocks into DependencyTabs.`);
  if(/## .*Interview/i.test(content)&&/\| Question \|/i.test(content)&&!content.includes('<ExpandableAnswer'))suggestions.push(`${path}: consider converting interview tables to ExpandableAnswer.`);
}
console.log(`Maintenance audit checked ${files.length} pages.`);if(suggestions.length){console.log(`Progressive component opportunities (${suggestions.length}):`);suggestions.slice(0,20).forEach(item=>console.log(`- ${item}`));}
if(failures.length){console.error(`Maintenance audit failed (${failures.length}):`);failures.forEach(item=>console.error(`- ${item}`));process.exitCode=1;}else console.log('Long-page and high-value metadata gates passed.');
