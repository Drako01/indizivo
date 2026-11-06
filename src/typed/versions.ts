import type {Descriptor} from './i18n';

export interface Version {major:number;minor:number;patch:number;precision:1|2|3}
export type VersionVerdict={status:'compatible'|'incompatible'|'inconclusive';detail:string;translation?:Descriptor}
type Match='yes'|'no'|'unknown';

export function parseVersion(value:unknown):Version|null {
  if(typeof value!=='string')return null;
  const match=/^(?:v|go)?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/.exec(value.trim());
  if(!match)return null;
  const major=Number(match[1]),minor=Number(match[2]||0),patch=Number(match[3]||0);
  if(![major,minor,patch].every(Number.isSafeInteger))return null;
  return {major,minor,patch,
    precision:match[3]!==undefined?3:match[2]!==undefined?2:1};
}
export function compare(a:Version,b:Version):number {
  for(const key of ['major','minor','patch'] as const)
    if(a[key]!==b[key])return Math.sign(a[key]-b[key]);
  return 0;
}
function at(major:number,minor=0,patch=0):Version {
  return {major,minor,patch,precision:3};
}
function upperBound(op:'^'|'~',base:Version):Version {
  if(op==='~')return base.precision===1?at(base.major+1):at(base.major,base.minor+1);
  if(base.major>0 || base.precision===1)return at(base.major+1);
  if(base.minor>0 || base.precision===2)return at(0,base.minor+1);
  return at(0,0,base.patch+1);
}
function requirement(raw:string):{version:Version;wildcard:boolean}|null {
  const clean=raw.replace(/^v/,'').replace(/\.X/g,'.x');
  const match=/^(\d+)(?:\.(\d+|x))?(?:\.(\d+|x))?$/.exec(clean);
  if(!match)return null;
  const parts=match.slice(1);
  if(parts[1]==='x' && parts[2]!==undefined)return null;
  const precision:1|2|3=parts[2]!==undefined?3:parts[1]!==undefined?2:1;
  const major=Number(parts[0]),minor=parts[1] && parts[1]!=='x'?Number(parts[1]):0;
  const patch=parts[2] && parts[2]!=='x'?Number(parts[2]):0;
  if(![major,minor,patch].every(Number.isSafeInteger))return null;
  return {version:{major,minor,patch,precision:parts.includes('x')?parts[1]==='x'?1:2:precision},
    wildcard:parts.includes('x')};
}
function satisfiesToken(installed:Version,token:string):Match {
  if(/^(?:\*|x|X)$/.test(token))return 'yes';
  const match=/^(>=|<=|>|<|=|\^|~)?(v?\d+(?:\.(?:\d+|x|X)){0,2})$/.exec(token);
  if(!match)return 'unknown';
  const op=match[1]||'=',spec=requirement(match[2]||'');
  if(!spec)return 'unknown';
  const base=spec.version,order=compare(installed,base);
  if(spec.wildcard && !['='].includes(op))return 'unknown';
  if(op==='^'||op==='~')return order>=0 && compare(installed,upperBound(op,base))<0?'yes':'no';
  if(op==='>=')return order>=0?'yes':'no';
  // Partial comparator bounds differ from exact versions in npm semantics:
  // >20 is >=21.0.0, <=20.4 is <20.5.0.
  const next=base.precision===1?at(base.major+1):at(base.major,base.minor+1);
  if(op==='>')return (base.precision===3?order>0:compare(installed,next)>=0)?'yes':'no';
  if(op==='<=')return (base.precision===3?order<=0:compare(installed,next)<0)?'yes':'no';
  if(op==='<')return order<0?'yes':'no';
  if(op==='='){
    if(installed.major!==base.major)return 'no';
    if(base.precision>=2 && installed.minor!==base.minor)return 'no';
    if(base.precision===3 && installed.patch!==base.patch)return 'no';
    return 'yes';
  }
  return 'unknown';
}
/**
 * Strict, intentionally bounded npm range subset. Incomplete or prerelease
 * semantics fail closed as INCONCLUSIVE, never as incompatible/compatible.
 * Support: comparator sets, ^/~, x/* and OR. Never run package scripts.
 */
function satisfiesNode(installed:Version,range:string):Match {
  if(range.length>200 || /[-+]/.test(range))return 'unknown';
  const alternatives=range.split(/\s*\|\|\s*/);
  if(alternatives.some(group=>!group.trim()))return 'unknown';
  let unknown=false;
  for(const alternative of alternatives){
    const tokens=alternative.replace(/,/g,' ').trim().replace(/(>=|<=|>|<|=|\^|~)\s+(?=v?\d)/g,'$1').split(/\s+/);
    if(!tokens.length || tokens.some(x=>!x))return 'unknown';
    let all=true;
    for(const token of tokens){
      const result=satisfiesToken(installed,token);
      if(result==='unknown'){unknown=true;all=false;}
      if(result==='no')all=false;
    }
    if(all)return 'yes';
  }
  return unknown?'unknown':'no';
}
export function evaluateVersion(installed:string,expression:string,ecosystem:string):VersionVerdict {
  const parsed=parseVersion(installed);
  if(!parsed || /[-+]/.test(installed))return {status:'inconclusive',detail:'Installed version not recognized or is a prerelease.',translation:{key:'diag.versionInvalid'}};
  if(!expression||!String(expression).trim())return {status:'inconclusive',detail:'No required version declared.',translation:{key:'diag.versionNoReq'}};
  const required=String(expression).trim();
  if(ecosystem==='go'){
    const min=parseVersion(required);
    return min && !/[-+]/.test(required)?
      {status:compare(parsed,min)>=0?'compatible':'incompatible',
       detail:'Go module minimum '+required+'; installed '+installed+'.',translation:{key:'diag.goMin',values:{required,installed}}}:
      {status:'inconclusive',detail:'Unsupported Go requirement '+required+'.',translation:{key:'diag.goUnsupported',values:{required}}};
  }
  if(ecosystem!=='node')return {status:'inconclusive',detail:'Unsupported ecosystem.'};
  const verdict=satisfiesNode(parsed,required);
  if(verdict==='unknown')
    return {status:'inconclusive',detail:'Unsupported Node.js version expression '+required+'.',
      translation:{key:'diag.nodeUnsupported',values:{required}}};
  return verdict==='yes'?
    {status:'compatible',detail:'Installed Node.js '+installed+' satisfies '+required+'.',
      translation:{key:'diag.nodeCompatible',values:{installed,required}}}:
    {status:'incompatible',detail:'Installed Node.js '+installed+' does not satisfy '+required+'.',
      translation:{key:'diag.nodeNotCompatible',values:{installed,required}}};
}
