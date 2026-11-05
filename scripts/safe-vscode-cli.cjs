'use strict';
// VS Code's Windows CLI is a .cmd shim. Node cannot execute it without cmd.exe.
// Build one explicit, fail-closed command line; never pass an args array with shell:true.
function invocation(executable,args,platform=process.platform,comSpec=process.env.ComSpec||'cmd.exe') {
 if(typeof executable!=='string'||!executable || !Array.isArray(args) ||
    args.some(value=>typeof value!=='string'))
   throw new TypeError('Expected an executable path and string CLI arguments');
 if(platform!=='win32'||!/\.(?:cmd|bat)$/i.test(executable)) {
   return {file:executable,args,windowsVerbatimArguments:false};
 }
 const values=[executable,...args];
 for(const value of values) {
   if(!value||/["%!?^&|<>()\r\n\0]/.test(value))
     throw new Error('Unsafe Windows VS Code CLI path or argument');
 }
 const quoted=values.map(value=>'"'+value+'"').join(' ');
 return {file:comSpec,args:['/d','/s','/c','"'+quoted+'"'],windowsVerbatimArguments:true};
}
module.exports={invocation};
