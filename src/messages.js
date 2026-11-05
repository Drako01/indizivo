'use strict';

const SIMPLE=new Set([
  'ready','selectProject','openHome','diagnose','cancel',
  'prepareServices','confirmServices','declineServices','clearHistory'
]);
function validateUiMessage(input) {
  if(!input || typeof input!=='object' || Array.isArray(input))return null;
  const type=input.type;
  if(typeof type!=='string' || type.length>40 || Object.keys(input).length>4)return null;
  if(SIMPLE.has(type))return {type};
  switch(type) {
    case 'addService':
      if(typeof input.name!=='string' || !input.name.trim() ||
        input.name.length>50 || typeof input.url!=='string' ||
        input.url.length>600)return null;
      return {type,name:input.name,url:input.url};
    case 'removeService':
      if(typeof input.url!=='string' || input.url.length>600)return null;
      return {type,url:input.url};
    case 'copyEvidence':
      if(typeof input.id!=='string' || !/^[a-z0-9-]{1,90}$/i.test(input.id))return null;
      return {type,id:input.id};
    case 'saveTimeout':
      if(!Number.isInteger(input.value) || input.value<400 || input.value>10000)return null;
      return {type,value:input.value};
    case 'export':
      if(!['md','json'].includes(input.format))return null;
      return {type,format:input.format};
    default:
      return null;
  }
}
module.exports={validateUiMessage};
