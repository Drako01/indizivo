export interface Version {major:number;minor:number;patch:number;precision:1|2|3}
export type VersionVerdict={status:'compatible'|'incompatible'|'inconclusive';detail:string}
export function parseVersion(value:unknown):Version|null {
  if(typeof value!=='string')return null;
  const match=/^(?:v|go)?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/.exec(value.trim());
  if(!match)return null;
  return {major:Number(match[1]),minor:Number(match[2]||0),patch:Number(match[3]||0),
    precision:match[3]!==undefined?3:match[2]!==undefined?2:1};
}
export function compare(a:Version,b:Version):number {
  for(const key of ['major','minor','patch'] as const)
    if(a[key]!==b[key])return Math.sign(a[key]-b[key]);
  return 0;
}
export function evaluateVersion(installed:string,expression:string,ecosystem:string):VersionVerdict {
  const parsed=parseVersion(installed);
  if(!parsed)return {status:'inconclusive',detail:'Installed version not recognized.'};
  if(!expression||!String(expression).trim())return {status:'inconclusive',detail:'No required version declared.'};
  const required=String(expression).trim();
  if(ecosystem==='go'){
    const min=parseVersion(required);
    return min?
      {status:compare(parsed,min)>=0?'compatible':'incompatible',
       detail:'Go module minimum '+required+'; installed '+installed+'.'}:
      {status:'inconclusive',detail:'Unsupported Go requirement '+required+'.'};
  }
  if(required.includes('||')||required.includes('*')||
     /[A-Za-z]/.test(required.replace(/[vxX]/g,'')))
    return {status:'inconclusive',detail:'Unsupported Node.js version expression '+required+'.'};
  const tokens=required.replace(/,/g,' ').match(/(?:>=|<=|>|<|=|\^|~)?\s*v?\d+(?:\.(?:\d+|[xX])){0,2}/g);
  if(!tokens?.length||tokens.join('').replace(/\s/g,'')!==required.replace(/\s/g,''))
    return {status:'inconclusive',detail:'Unsupported Node.js version expression '+required+'.'};
  for(const token of tokens){
    const match=/^(>=|<=|>|<|=|\^|~)?\s*(.+)$/.exec(token.trim());
    if(!match)return {status:'inconclusive',detail:'Unsupported Node.js range.'};
    const op=match[1]||'=', raw=match[2]||'';
    const value=parseVersion(raw.replace(/\.x$/i,''));
    if(!value)return {status:'inconclusive',detail:'Unsupported Node.js version expression '+required+'.'};
    const c=compare(parsed,value);
    const prefix=parsed.major===value.major&&(value.precision<2||parsed.minor===value.minor);
    let ok:boolean;
    switch(op){
      case '>=':ok=c>=0;break;
      case '>':ok=c>0;break;
      case '<=':ok=c<=0;break;
      case '<':ok=c<0;break;
      case '=':ok=value.precision===3?c===0:prefix;break;
      case '~':ok=c>=0&&parsed.major===value.major&&parsed.minor===value.minor;break;
      case '^':ok=c>=0&&parsed.major===value.major&&
        (value.major!==0||(value.minor===0?
         parsed.minor===0&&parsed.patch===value.patch:parsed.minor===value.minor));break;
      default:return {status:'inconclusive',detail:'Unsupported operator.'};
    }
    if(!ok)return {status:'incompatible',detail:'Installed Node.js '+installed+' does not satisfy '+required+'.'};
  }
  return {status:'compatible',detail:'Installed Node.js '+installed+' satisfies '+required+'.'};
}
