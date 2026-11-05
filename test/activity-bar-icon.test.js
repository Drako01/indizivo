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

test('Activity Bar keeps the approved original Indizivo radar silhouette',()=>{
 const svg=fs.readFileSync(path.join(root,'media/indizivo-activity-bar.svg'),'utf8');
 const paths=[...svg.matchAll(/<path\\b[^>]*>/g)].map(m=>m[0]);
 assert.equal(paths.length,3,'Original mark: I and two radar arcs, without added ray');
 assert.match(paths[0],/d="M6 4v16"/);
 assert.match(paths[1],/d="M10 5c5\\.5 0 9 3\\.5 9 8\\.8"/);
 assert.match(paths[2],/d="M10 9c3 0 5 2 5 4\\.8"/);
 assert.match(svg,/<circle cx="19" cy="14" r="2" fill="currentColor" stroke="none"\/>/);
 assert.match(svg,/stroke-linecap="round"/);
});
