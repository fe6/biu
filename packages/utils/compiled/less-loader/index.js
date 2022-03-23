(function(){var e={942:function(e,t){function set(e,t,r){if(typeof r.value==="object")r.value=klona(r.value);if(!r.enumerable||r.get||r.set||!r.configurable||!r.writable||t==="__proto__"){Object.defineProperty(e,t,r)}else e[t]=r.value}function klona(e){if(typeof e!=="object")return e;var t=0,r,n,s,o=Object.prototype.toString.call(e);if(o==="[object Object]"){s=Object.create(e.__proto__||null)}else if(o==="[object Array]"){s=Array(e.length)}else if(o==="[object Set]"){s=new Set;e.forEach((function(e){s.add(klona(e))}))}else if(o==="[object Map]"){s=new Map;e.forEach((function(e,t){s.set(klona(t),klona(e))}))}else if(o==="[object Date]"){s=new Date(+e)}else if(o==="[object RegExp]"){s=new RegExp(e.source,e.flags)}else if(o==="[object DataView]"){s=new e.constructor(klona(e.buffer))}else if(o==="[object ArrayBuffer]"){s=e.slice(0)}else if(o.slice(-6)==="Array]"){s=new e.constructor(e)}if(s){for(n=Object.getOwnPropertySymbols(e);t<n.length;t++){set(s,n[t],Object.getOwnPropertyDescriptor(e,n[t]))}for(t=0,n=Object.getOwnPropertyNames(e);t<n.length;t++){if(Object.hasOwnProperty.call(s,r=n[t])&&s[r]===e[r])continue;set(s,r,Object.getOwnPropertyDescriptor(e,r))}}return s||e}t.klona=klona},140:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:true});t["default"]=void 0;var n=_interopRequireDefault(r(17));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}class LessError extends Error{constructor(e){super();this.message=["\n",...LessError.getFileExcerptIfPossible(e),e.message.charAt(0).toUpperCase()+e.message.slice(1),e.filename?`      Error in ${n.default.normalize(e.filename)} (line ${e.line}, column ${e.column})`:""].join("\n");this.hideStack=true}static getFileExcerptIfPossible(e){if(typeof e.extract==="undefined"){return[]}const t=e.extract.slice(0,2);const r=Math.max(e.column-1,0);if(typeof t[0]==="undefined"){t.shift()}t.push(`${new Array(r).join(" ")}^`);return t}}var s=LessError;t["default"]=s},507:function(e,t,r){"use strict";e.exports=r(321)["default"]},321:function(e,t,r){"use strict";var n;n={value:true};t["default"]=void 0;var s=_interopRequireDefault(r(17));var o=_interopRequireDefault(r(244));var i=r(251);var a=_interopRequireDefault(r(140));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}async function lessLoader(e){const t=this.getOptions(o.default);const r=this.async();const n=(0,i.getLessImplementation)(this,t.implementation);if(!n){r(new Error(`The Less implementation "${t.implementation}" not found`));return}const l=(0,i.getLessOptions)(this,t,n);const c=typeof t.sourceMap==="boolean"?t.sourceMap:this.sourceMap;if(c){l.sourceMap={outputSourceFiles:true}}let u=e;if(typeof t.additionalData!=="undefined"){u=typeof t.additionalData==="function"?`${await t.additionalData(u,this)}`:`${t.additionalData}\n${u}`}const p=this.getLogger("less-loader");const f={error(e){p.error(e)},warn(e){p.warn(e)},info(e){p.log(e)},debug(e){p.debug(e)}};n.logger.addListener(f);let d;try{d=await n.render(u,l)}catch(e){if(e.filename){this.addDependency(s.default.normalize(e.filename))}r(new a.default(e));return}finally{n.logger.removeListener(f);delete l.pluginManager.webpackLoaderContext;delete l.pluginManager}const{css:m,imports:b}=d;b.forEach((e=>{if((0,i.isUnsupportedUrl)(e)){return}const t=s.default.normalize(e);if(s.default.isAbsolute(t)){this.addDependency(t)}}));let g=typeof d.map==="string"?JSON.parse(d.map):d.map;if(g&&c){g=(0,i.normalizeSourceMap)(g,this.rootContext)}r(null,m,g)}var l=lessLoader;t["default"]=l},251:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:true});t.getLessImplementation=getLessImplementation;t.getLessOptions=getLessOptions;t.isUnsupportedUrl=isUnsupportedUrl;t.normalizeSourceMap=normalizeSourceMap;var n=_interopRequireDefault(r(17));var s=r(942);function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}const o=/[/\\]$/;const i=/^~[^/]+$/;const a=/^[a-z]:[/\\]|^\\\\/i;const l=/^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;const c=/^[^?]*~/;function createWebpackLessPlugin(e,t){const r=e.getResolve({dependencyType:"less",conditionNames:["less","style"],mainFields:["less","style","main","..."],mainFiles:["index","..."],extensions:[".less",".css"],preferRelative:true});class WebpackFileManager extends t.FileManager{supports(e){if(e[0]==="/"||a.test(e)){return true}if(this.isPathAbsolute(e)){return false}return true}supportsSync(){return false}async resolveFilename(e,t){const r=t.replace(o,"");let n=e;if(c.test(e)){n=n.replace(c,"")}if(l.test(e)){n=n[n.length-1]==="/"?n:`${n}/`}return this.resolveRequests(r,[...new Set([n,e])])}async resolveRequests(e,t){if(t.length===0){return Promise.reject()}let n;try{n=await r(e,t[0])}catch(r){const[,...s]=t;if(s.length===0){throw r}n=await this.resolveRequests(e,s)}return n}async loadFile(t,...r){let s;try{if(i.test(t)){const e=new Error;e.type="Next";throw e}s=await super.loadFile(t,...r)}catch(n){if(n.type!=="File"&&n.type!=="Next"){return Promise.reject(n)}try{s=await this.resolveFilename(t,...r)}catch(e){n.message=`Less resolver error:\n${n.message}\n\n`+`Webpack resolver error details:\n${e.details}\n\n`+`Webpack resolver error missing:\n${e.missing}\n\n`;return Promise.reject(n)}e.addDependency(s);return super.loadFile(s,...r)}e.addDependency(n.default.normalize(s.filename));return s}}return{install(e,t){t.addFileManager(new WebpackFileManager)},minVersion:[3,0,0]}}function getLessOptions(e,t,r){const n=(0,s.klona)(typeof t.lessOptions==="function"?t.lessOptions(e)||{}:t.lessOptions||{});const o={plugins:[],relativeUrls:true,filename:e.resourcePath,...n};const i=typeof t.webpackImporter==="boolean"?t.webpackImporter:true;if(i){o.plugins.unshift(createWebpackLessPlugin(e,r))}o.plugins.unshift({install(t,r){r.webpackLoaderContext=e;o.pluginManager=r}});return o}function isUnsupportedUrl(e){if(a.test(e)){return false}return/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e)}function normalizeSourceMap(e){const t=e;delete t.file;t.sourceRoot="";t.sources=t.sources.map((e=>n.default.normalize(e)));return t}function getLessImplementation(e,t){let r=t;if(!t||typeof t==="string"){const n=t||"less";try{r=require(n)}catch(t){e.emitError(t);return}}return r}},17:function(e){"use strict";e.exports=require("path")},244:function(e){"use strict";e.exports=JSON.parse('{"title":"Less Loader options","type":"object","properties":{"lessOptions":{"description":"Options to pass through to `Less`.","link":"https://github.com/webpack-contrib/less-loader#lessoptions","anyOf":[{"type":"object","additionalProperties":true},{"instanceof":"Function"}]},"additionalData":{"description":"Prepends/Appends `Less` code to the actual entry file.","link":"https://github.com/webpack-contrib/less-loader#additionalData","anyOf":[{"type":"string"},{"instanceof":"Function"}]},"sourceMap":{"description":"Enables/Disables generation of source maps.","link":"https://github.com/webpack-contrib/less-loader#sourcemap","type":"boolean"},"webpackImporter":{"description":"Enables/Disables default `webpack` importer.","link":"https://github.com/webpack-contrib/less-loader#webpackimporter","type":"boolean"},"implementation":{"description":"The implementation of the `Less` to be used.","link":"https://github.com/webpack-contrib/less-loader#implementation","anyOf":[{"type":"string"},{"type":"object"}]}},"additionalProperties":false}')}};var t={};function __nccwpck_require__(r){var n=t[r];if(n!==undefined){return n.exports}var s=t[r]={exports:{}};var o=true;try{e[r](s,s.exports,__nccwpck_require__);o=false}finally{if(o)delete t[r]}return s.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(507);module.exports=r})();