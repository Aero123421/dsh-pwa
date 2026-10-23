import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'

async function fixture() {
 let exports
 runInNewContext(await readFile(new URL('../client.js',import.meta.url),'utf8'),{queueMicrotask,window:{__ModuleLoader__:{load:e=>{exports=e.factory(()=>({}))}}}})
 const listeners=new Map(), removed=[], added=[]
 const doc={addEventListener(type,fn,capture){listeners.set(type,fn);added.push([type,capture])},removeEventListener(type,fn,capture){if(listeners.get(type)===fn)listeners.delete(type);removed.push([type,capture])},querySelectorAll:()=>[]}
 const mobile=new exports.MobileController({storage:null,matchMedia:()=>({matches:false}),view:{document:doc,InputEvent:class {constructor(type,init){this.type=type;Object.assign(this,init)}}},root:{toggleAttribute(){},removeAttribute(){}},viewport:null})
 mobile.setMode('on')
 const input={isContentEditable:true},target={closest:s=>s==='[data-composer-input]'?input:null}
 function key(patch={}){let stopped=0,prevented=0;const event={key:'Enter',target,stopImmediatePropagation(){stopped++},preventDefault(){prevented++},...patch};listeners.get('keydown')?.(event);return{stopped,prevented}}
 return {mobile,doc,listeners,added,removed,key,input}
}
test('mobile plain/repeated Enter stops keymap only, preserving browser default',async()=>{
 const f=await fixture();assert.deepEqual(f.key(),{stopped:1,prevented:0});assert.deepEqual(f.key({repeat:true}),{stopped:1,prevented:0})
 assert.ok(f.added.some(([type,capture])=>type==='keydown'&&capture===true));f.mobile.dispose()
})
test('IME, modifiers, prevented events, non-editors and candidates retain host behavior',async()=>{
 const f=await fixture()
 for(const patch of [{isComposing:true},{keyCode:229},{shiftKey:true},{ctrlKey:true},{metaKey:true},{altKey:true},{key:'a'},{defaultPrevented:true},{target:{closest:()=>null}}])assert.equal(f.key(patch).stopped,0)
 f.input.isContentEditable=false;assert.equal(f.key().stopped,0);f.input.isContentEditable=true
 for(const selector of ['[data-trigger-menu]','[data-composer-overlay] [role=listbox]','[data-menu-material]']){
 f.doc.querySelectorAll=s=>s.includes(selector)&&s.includes('[aria-selected=true]')?[{closest:()=>null,getClientRects:()=>[{}]}]:[];assert.equal(f.key().stopped,0)
 }
 f.doc.querySelectorAll=()=>[{closest:()=>null,getClientRects:()=>[]}];assert.equal(f.key().stopped,1)
 f.doc.querySelectorAll=()=>[{closest:()=>({}),getClientRects:()=>[{}]}];assert.equal(f.key().stopped,1)
 f.mobile.dispose()
})
test('loading candidates without selected row retain newline guard; active descendant must exist and be visible',async()=>{
 const f=await fixture()
 f.doc.querySelectorAll=s=>s.includes('[aria-selected=true]')?[]:[{closest:()=>null,getClientRects:()=>[{}]}]
 assert.equal(f.key().stopped,1)
 f.input.getAttribute=()=> 'selected-option'
 f.doc.getElementById=()=>null;assert.equal(f.key().stopped,1)
 f.doc.getElementById=()=>({closest:()=>null,getClientRects:()=>[{}]});assert.equal(f.key().stopped,0)
 f.mobile.dispose()
})
test('composition newline preserves committed data and schedules paragraph after finalization',async()=>{
 const f=await fixture(),events=[]
 Object.assign(f.input,{isConnected:true,dispatchEvent:e=>events.push(e)});f.doc.activeElement=f.input
 const event={target:{closest:s=>s==='[data-composer-input]'?f.input:null}}
 Object.defineProperty(event,'data',{get:()=> '確定文字\n',configurable:true})
 f.listeners.get('compositionend')(event)
 assert.equal(event.data,'確定文字');assert.equal(events.length,0)
 await Promise.resolve();assert.equal(events.length,1);assert.equal(events[0].inputType,'insertParagraph')
 for(const data of ['確定文字','',null]){f.listeners.get('compositionend')({...event,data});await Promise.resolve();assert.equal(events.length,1)}
 for(const stop of [()=>f.mobile.setMode('off'),()=>f.mobile.dispose()]){
  f.mobile.setMode('on');f.listeners.get('compositionend')({...event,data:'\n'});stop();await Promise.resolve();assert.equal(events.length,1)
 }
 assert.equal(f.listeners.has('compositionend'),false)
})
test('standard layout and dispose remove capture listener, repeated mode updates do not duplicate',async()=>{
 const f=await fixture(),count=f.added.length;f.mobile.setMode('on');assert.equal(f.added.length,count)
 f.mobile.setMode('off');assert.equal(f.listeners.has('keydown'),false)
 f.mobile.setMode('on');assert.equal(f.listeners.has('keydown'),true);f.mobile.dispose();assert.equal(f.listeners.size,0)
 assert.ok(f.removed.some(([type,capture])=>type==='keydown'&&capture===true))
})
test('touch inputs include portal search and stock iPad fields without restricting viewport zoom',async()=>{
 const source=await readFile(new URL('../client.js',import.meta.url),'utf8')
 assert.ok(source.includes(':is(${M},${T}) input,:is(${M},${T}) textarea,:is(${M},${T}) select,:is(${M},${T}) [contenteditable]:not([contenteditable=false]){font-size:max(16px,1em)!important}'))
 assert.equal(source.includes('maximum-scale=1'),false)
})
