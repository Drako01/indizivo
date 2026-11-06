/** Explicit, local-only best-effort redaction for exported/copyable evidence.
 * Indizivo must never claim that regex redaction guarantees confidentiality.
 * The primary control remains not reading or persisting secret values.
 */
export function redactSensitiveText(value:string):string {
 return value
  .replace(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi,
    '[REDACTED PRIVATE KEY]')
  .replace(/(Authorization\s*:\s*(?:Bearer|Basic)\s+)[A-Za-z0-9._~+\/=\-]{8,}/gi,'$1[REDACTED]')
  .replace(/((?:Set-Cookie|Cookie)\s*:\s*)[^\r\n]{1,2048}/gi,'$1[REDACTED]')
  .replace(/([a-z][a-z0-9+.-]*:\/\/)[^@\s/]{1,512}@/gi,'$1[REDACTED]@')
  .replace(/\b(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16})\b/g,
    '[REDACTED TOKEN]')
  .replace(/((?:api[-_]?key|access[-_]?token|refresh[-_]?token|client[-_]?secret|password|secret|credential|token)\s*[:=]\s*)["']?[^\s,;"']{3,}["']?/gi,
    '$1[REDACTED]')
  .replace(/\beyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    '[REDACTED JWT]');
}
/** Sanitize known JSON-shaped report values without mutating in-memory findings. */
export function redactReport<T>(value:T,depth=0):T {
 if(depth>24)return '[REDACTED EXCESSIVE DEPTH]' as T;
 if(typeof value==='string')return redactSensitiveText(value) as T;
 if(Array.isArray(value))return value.map(part=>redactReport(part,depth+1)) as T;
 if(value!==null && typeof value==='object'){
  const source=value as Record<string,unknown>;
  const result:Record<string,unknown>={};
  for(const [key,item] of Object.entries(source))
   result[key]=redactReport(item,depth+1);
  return result as T;
 }
 return value;
}
