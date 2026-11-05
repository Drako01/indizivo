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

test('Activity Bar renders the complete approved radar silhouette with every signal arc and sweep',()=>{
 const svg=fs.readFileSync(path.join(root,'media/indizivo-activity-bar.svg'),'utf8');
 const paths=[...svg.matchAll(/<path\b[^>]*>/g)].map(m=>m[0]);
 assert.equal(paths.length,5,'Full mark requires vertical bar, three arcs and diagonal sweep');
 assert.match(paths[0],/d="M4\.9 2\.88V21\.6"/);
 assert.match(paths[1],/d="M9\.94 3\.74C16\.7 3\.74 21\.17 8\.21 21\.17 14\.83"/);
 assert.match(paths[2],/d="M9\.94 8\.64C13\.68 8\.64 16\.42 11\.23 16\.42 14\.83"/);
 assert.match(paths[3],/d="M9\.94 13\.39C11\.38 13\.39 12\.24 14\.11 12\.38 15\.26"/);
 assert.match(paths[4],/d="M8\.35 20\.02L20\.02 14\.83"/);
 assert.match(svg,/<circle cx="21\.17" cy="14\.83" r="1\.73" fill="currentColor" stroke="none"\/>/);
 assert.match(svg,/stroke-linecap="round"/);
 assert.doesNotMatch(svg,/<rect\b|<image\b/i,'No background tile or embedded raster in Activity Bar');
});
test('Marketplace remains full color while only Activity Bar uses the new monochrome SVG',()=>{
 const activity=pkg.contributes.viewsContainers.activitybar[0].icon;
 assert.equal(activity,'media/indizivo-activity-bar.svg');
 assert.equal(pkg.icon,'media/indizivo-icon-128.png');
 const brand=fs.readFileSync(path.join(root,'media/indizivo-icon.svg'),'utf8');
 assert.match(brand,/<linearGradient\b/);
 assert.match(brand,/#35C2B1/);
 const sidebar=fs.readFileSync(path.join(root,activity),'utf8');
 assert.doesNotMatch(sidebar,/#35C2B1|#F6BA65|<rect\b/i);
});
