import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'

async function fixture(){
 const flags=new Set(),mutations=[],resizes=[],frames=new Map(),events=new Map();let nextFrame=0,queries=0,exports
 const root={matches:()=>((flags.has('data-dsh-touch')||flags.has('data-dsh-mobile'))&&(flags.has('data-dsh-mobile-keyboard')||flags.has('data-dsh-pwa-compact'))),hasAttribute:name=>flags.has(name)}
 const makeSeat=(y=200)=>{
  const values=new Map(),overlay={style:{getPropertyValue:key=>values.get(key)??'',setProperty:(key,value)=>values.set(key,value),removeProperty:key=>values.delete(key)},getBoundingClientRect:()=>({top:y})},card={}
  const seat={isConnected:true,closest:()=>({querySelector:()=>({getBoundingClientRect:()=>({bottom:flags.has('data-dsh-pwa-compact')?44:64})})}),querySelectorAll:selector=>selector==='[data-composer-overlay]'?[overlay]:[card]}
  return {seat,card,overlay,values}
 }
 let current=[makeSeat()]
 const document={documentElement:root,querySelectorAll:selector=>{assert.equal(selector,'[data-composer-seat]');queries++;return current.map(x=>x.seat)}}
 Object.defineProperty(document,'body',{get(){throw Error('body must not be observed or queried')}})
 class MutationObserver{constructor(callback){this.callback=callback;this.observed=new Map();mutations.push(this)}observe(target,options){this.observed.set(target,options)}disconnect(){this.observed.clear()}}
 class ResizeObserver{constructor(callback){this.callback=callback;this.observed=new Set();resizes.push(this)}observe(target){this.observed.add(target)}disconnect(){this.observed.clear()}}
 const visualViewport={offsetTop:0,height:568,addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:(type,fn)=>{if(events.get(type)===fn)events.delete(type)}}
 runInNewContext(await readFile(new URL('../client.js',import.meta.url),'utf8'),{document,visualViewport,MutationObserver,ResizeObserver,requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),window:{__ModuleLoader__:{load:e=>{exports=e.factory(()=>({}))}}}})
 const dispose=exports.mountComposerMenuBounds()
 const tick=()=>{const jobs=[...frames.values()];frames.clear();for(const fn of jobs)fn()}
 const rootWatch=mutations.find(w=>w.observed.has(root)),change=()=>{rootWatch.callback([]);tick()}
 return {flags,mutations,resizes,frames,events,root,viewport:visualViewport,current:()=>current,replace:value=>{current=[value]},makeSeat,queries:()=>queries,dispose,tick,change}
}

test('menu bounds do not discover or observe composer/body subtrees outside constrained mode',async()=>{
 const f=await fixture();assert.equal(f.queries(),0);assert.equal(f.frames.size,0)
 assert.equal(f.mutations.reduce((n,w)=>n+w.observed.size,0),1)
 const rootWatch=f.mutations.find(w=>w.observed.has(f.root));assert.equal(rootWatch.observed.get(f.root).subtree,undefined)
 f.events.get('resize')();f.events.get('scroll')();f.tick();assert.equal(f.queries(),0)
 f.flags.add('data-dsh-touch');f.change();assert.equal(f.queries(),0)
 f.dispose();assert.equal(f.events.size,0);assert.ok(f.mutations.every(w=>w.observed.size===0))
})

test('constrained menu bounds observe only seats/cards, cap actual room, and detach on exit',async()=>{
 const f=await fixture(),s=f.current()[0];f.flags.add('data-dsh-touch');f.flags.add('data-dsh-mobile-keyboard');f.change()
 assert.equal(f.queries(),1);assert.equal(s.values.get('--dsh-pwa-menu-room'),'128px')
 const seatWatch=f.mutations.find(w=>w.observed.has(s.seat));assert.equal(seatWatch.observed.size,1);assert.equal(seatWatch.observed.get(s.seat).subtree,true)
 assert.ok(f.resizes[0].observed.has(s.card));assert.ok(f.resizes[0].observed.has(s.seat))
 f.flags.add('data-dsh-pwa-compact');f.change();assert.equal(s.values.get('--dsh-pwa-menu-room'),'148px');assert.equal(s.values.get('--dsh-pwa-menu-shift'),'0px')
 f.flags.delete('data-dsh-mobile-keyboard');f.flags.delete('data-dsh-pwa-compact');f.change()
 assert.equal(s.values.size,0);assert.equal(seatWatch.observed.size,0);assert.equal(f.resizes[0].observed.size,0)
 const before=f.queries();seatWatch.callback([]);f.tick();assert.equal(f.queries(),before)
 f.dispose();assert.equal(f.frames.size,0);assert.equal(f.events.size,0)
})

test('viewport events rediscover replaced composer seats and disposal cancels pending work',async()=>{
 const f=await fixture(),old=f.current()[0];f.flags.add('data-dsh-mobile');f.flags.add('data-dsh-mobile-keyboard');f.change()
 old.seat.isConnected=false;const next=f.makeSeat(260);f.replace(next);f.events.get('resize')();f.tick()
 assert.equal(old.values.size,0);assert.equal(next.values.get('--dsh-pwa-menu-room'),'188px')
 assert.ok(f.mutations.some(w=>w.observed.has(next.seat)));assert.ok(!f.mutations.some(w=>w.observed.has(old.seat)))
 f.events.get('scroll')();assert.equal(f.frames.size,1);f.dispose();assert.equal(f.frames.size,0)
 f.change();assert.equal(f.frames.size,0);assert.equal(next.values.size,0)
})

test('tiny compact menus may overlap the composer but never hide search behind the header',async()=>{
 const f=await fixture(),s=f.makeSeat(100);f.replace(s);f.viewport.height=153
 f.flags.add('data-dsh-touch');f.flags.add('data-dsh-pwa-compact');f.change()
 assert.equal(s.values.get('--dsh-pwa-menu-room'),'101px');assert.equal(s.values.get('--dsh-pwa-menu-shift'),'53px')
 // Native bottom is 96px: translated bottom=149, top=48, below the 44px header.
 assert.equal(96+53-101,48);assert.equal(96+53,149)
 f.dispose();assert.equal(s.values.size,0)
})
