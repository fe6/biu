(function(){"use strict";var e={178:function(e,t,n){e=n.nmd(e);Object.defineProperty(t,"__esModule",{value:true});t.addHook=addHook;var r=_interopRequireDefault(n(188));var o=_interopRequireDefault(n(17));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}const i=/^(?:.*[\\/])?node_modules(?:[\\/].*)?$/;const s=e.constructor.length>1?e.constructor:r.default;const u="[Pirates] A hook returned a non-string, or nothing at all! This is a"+" violation of intergalactic law!\n"+"--------------------\n"+"If you have no idea what this means or what Pirates is, let me explain: "+"Pirates is a module that makes is easy to implement require hooks. One of"+" the require hooks you're using uses it. One of these require hooks"+" didn't return anything from it's handler, so we don't know what to"+" do. You might want to debug this.";function shouldCompile(e,t,n,r){if(typeof e!=="string"){return false}if(t.indexOf(o.default.extname(e))===-1){return false}const s=o.default.resolve(e);if(r&&i.test(s)){return false}if(n&&typeof n==="function"){return!!n(s)}return true}function addHook(e,t={}){let n=false;const r=[];const o=[];let i;const a=s._extensions[".js"];const f=t.matcher||null;const l=t.ignoreNodeModules!==false;i=t.extensions||t.exts||t.extension||t.ext||[".js"];if(!Array.isArray(i)){i=[i]}i.forEach((t=>{if(typeof t!=="string"){throw new TypeError(`Invalid Extension: ${t}`)}const _=s._extensions[t]||a;o[t]=s._extensions[t];r[t]=s._extensions[t]=function newLoader(t,r){let o;if(!n){if(shouldCompile(r,i,f,l)){o=t._compile;t._compile=function _compile(n){t._compile=o;const i=e(n,r);if(typeof i!=="string"){throw new Error(u)}return t._compile(i,r)}}}_(t,r)}}));return function revert(){if(n)return;n=true;i.forEach((e=>{if(s._extensions[e]===r[e]){if(!o[e]){delete s._extensions[e]}else{s._extensions[e]=o[e]}}}))}}},188:function(e){e.exports=require("module")},17:function(e){e.exports=require("path")}};var t={};function __nccwpck_require__(n){var r=t[n];if(r!==undefined){return r.exports}var o=t[n]={id:n,loaded:false,exports:{}};var i=true;try{e[n](o,o.exports,__nccwpck_require__);i=false}finally{if(i)delete t[n]}o.loaded=true;return o.exports}!function(){__nccwpck_require__.nmd=function(e){e.paths=[];if(!e.children)e.children=[];return e}}();if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var n=__nccwpck_require__(178);module.exports=n})();