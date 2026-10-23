import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'

async function fixture(navigator,content='width=device-width, initial-scale=1, maximum-scale=5'){
 let exports
 runInNewContext(await readFile(new URL('../client.js',import.meta.url),'utf8'),{window:{__ModuleLoader__:{load:e=>{exports=e.factory(()=>({}))}}}})
 const nodes=[]
 const make=()=>({attributes:new Map(),parentNode:null,setAttribute(k,v){this.attributes.set(k,v)},getAttribute(k){return this.attributes.get(k)??null},removeAttribute(k){this.attributes.delete(k)},remove(){nodes.splice(nodes.indexOf(this),1);this.parentNode=null}})
 const head={append(node){node.parentNode=this;nodes.push(node)},querySelectorAll(selector){return nodes.filter(node=>{const [,key,val]=selector.match(/\[(\w+)="([^"]+)"\]/);return node.getAttribute(key)===val})},querySelector(selector){return this.querySelectorAll(selector)[0]}}
 const viewport=make();viewport.setAttribute('name','viewport');viewport.setAttribute('content',content);head.append(viewport)
 const dispose=exports.mountPwaHead({head,createElement:make,defaultView:{navigator}})
 return {viewport,nodes,dispose,content}
}
test('iPhone/iPad desktop UA and Android retain their original zoom directives and restore on dispose',async()=>{
 for(const nav of [{userAgent:'iPhone'},{userAgent:'iPad'},{platform:'MacIntel',maxTouchPoints:5},{userAgent:'Android'}]){
 const f=await fixture(nav);assert.equal(f.viewport.getAttribute('content'),f.content+', viewport-fit=cover');f.dispose();assert.equal(f.viewport.getAttribute('content'),f.content);assert.equal(f.nodes.length,1)
 }
})
test('viewport cleanup does not overwrite another owner change',async()=>{
 const f=await fixture({userAgent:'iPhone'});f.viewport.setAttribute('content','width=device-width, initial-scale=2');f.dispose();assert.equal(f.viewport.getAttribute('content'),'width=device-width, initial-scale=2')
})
