import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface ProjectRoot {path:string;label:string;marker:string}
const GROUPS=['apps','packages','services','modules','projects'] as const;
const MARKERS=['package.json','go.mod','pyproject.toml','composer.json','pom.xml'] as const;
const MAX_GROUP_ITEMS=30;
function under(root:string,other:string):boolean {
 return other===root||other.startsWith(root+path.sep);
}
export async function isInsideWorkspace(candidate:string,workspaceRoots:string[]):Promise<boolean> {
 try {
  const real=await fs.realpath(candidate);
  for(const root of workspaceRoots){
   const base=await fs.realpath(root);
   if(under(base,real))return true;
  }
 }catch{/* missing, inaccessible or a symlink escape is never authorized */}
 return false;
}
/**
 * Explicit bounded discovery, never a recursive scan. Only direct children of
 * conventional monorepo group directories are considered. No symlinks followed.
 */
export async function discoverProjectRoots(root:string,limit=32):Promise<ProjectRoot[]> {
 const max=Math.min(50,Math.max(1,limit));
 const results:ProjectRoot[]=[];
 let base:string;
 try{base=await fs.realpath(root);}catch{return results;}
 for(const group of GROUPS){
  if(results.length>=max)break;
  const groupPath=path.join(root,group);
  let groupStat;
  try{groupStat=await fs.lstat(groupPath);}catch{continue;}
  if(!groupStat.isDirectory()||groupStat.isSymbolicLink())continue;
  let children;
  try{children=await fs.readdir(groupPath,{withFileTypes:true});}catch{continue;}
  const dirs=children.filter(item=>item.isDirectory()&&!item.isSymbolicLink())
    .sort((a,b)=>a.name.localeCompare(b.name)).slice(0,MAX_GROUP_ITEMS);
  for(const child of dirs){
   if(results.length>=max)break;
   const project=path.join(groupPath,child.name);
   try{
    const real=await fs.realpath(project);
    if(!under(base,real))continue;
   }catch{continue;}
   for(const marker of MARKERS){
    try{
     const stat=await fs.lstat(path.join(project,marker));
     if(!stat.isFile()||stat.isSymbolicLink())continue;
     results.push({path:project,label:group+'/'+child.name,marker});
     break;
    }catch{/* marker not present or blocked */}
   }
  }
 }
 return results;
}
