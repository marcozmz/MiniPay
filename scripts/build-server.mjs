import {readdir,readFile,writeFile,cp} from 'node:fs/promises';
// TypeScript emits ESM; add the .js suffix required by Node to relative imports.
async function fix(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
 const path=`${dir}/${entry.name}`;
 if(entry.isDirectory())await fix(path);
 else if(entry.name.endsWith('.js')){
  const source=await readFile(path,'utf8');
  await writeFile(path,source.replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,(_all,before,target,after)=>`${before}${target.endsWith('.js')?target:`${target}.js`}${after}`));
 }
}}
await fix('dist-server');
await cp('server/migrations','dist-server/server/migrations',{recursive:true});
