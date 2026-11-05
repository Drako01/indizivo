'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('Activity Bar uses a dedicated monochrome glyph, not the colored Marketplace icon',()=>{
 const icon=pkg.contributes.viewsContainers.activitybar[0].icon;
 assert.equal(icon,'media/indizivo-activity-bar.svg');
 assert.notEqual(icon,pkg.icon);
 const svg=fs.readFileSync(path.join(root,icon),'utf8');
 assert.match(svg,/<svg\b[^>]*viewBox="0 0 24 24"/);
 assert.match(svg,/currentColor/);
 assert.match(svg,/fill="none"/);
 assert.doesNotMatch(svg,/#(?:[0-9a-f]{3,8})\b|<\s*(?:image|text|filter|linearGradient|radialGradient|foreignObject)\b/i);
 assert.doesNotMatch(svg,/\b(?:href|style|opacity)=/i);
});

test('The 24px glyph uses sufficiently strong radar strokes and one filled evidence point',()=>{
 const svg=fs.readFileSync(path.join(root,'media/indizivo-activity-bar.svg'),'utf8');
 const paths=[...svg.matchAll(/<path\b[^>]*>/g)].map(match=>match[0]);
 assert.equal(paths.length,4,'I, two radar arcs and an evidence ray are expected');
 for(const element of paths){
   assert.match(element,/stroke="currentColor"/);
   assert.match(element,/stroke-linecap="round"/);
   const width=Number(/stroke-width="([\d.]+)"/.exec(element)?.[1]);
   assert.ok(width>=2.5 && width<=3.5,'Small glyph strokes must remain legible');
 }
 assert.match(svg,/<circle\b[^>]*r="2.5"[^>]*fill="currentColor"/);
});
