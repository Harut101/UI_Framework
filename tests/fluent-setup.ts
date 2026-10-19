// jsdom lacks browser observers used by Fluent positioning and motion.
if(typeof window!=='undefined'){
  Object.defineProperty(window,'matchMedia',{configurable:true,writable:true,value:(query:string)=>({matches:false,media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return true;}})});
  class ResizeObserverStub {observe(){}unobserve(){}disconnect(){}}
  Object.defineProperty(globalThis,'ResizeObserver',{configurable:true,writable:true,value:ResizeObserverStub});
  if(!HTMLElement.prototype.scrollIntoView)HTMLElement.prototype.scrollIntoView=()=>{};
  if(!HTMLElement.prototype.setPointerCapture)HTMLElement.prototype.setPointerCapture=()=>{};
  if(!HTMLElement.prototype.releasePointerCapture)HTMLElement.prototype.releasePointerCapture=()=>{};
}
