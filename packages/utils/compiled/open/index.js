(function(){var e={246:function(e){"use strict";e.exports=(e,r,t)=>{const define=t=>Object.defineProperty(e,r,{value:t,enumerable:true,writable:true});Object.defineProperty(e,r,{configurable:true,enumerable:true,get(){const e=t();define(e);return e},set(e){define(e)}});return e}},451:function(e,r,t){"use strict";const n=t(147);let o;function hasDockerEnv(){try{n.statSync("/.dockerenv");return true}catch(e){return false}}function hasDockerCGroup(){try{return n.readFileSync("/proc/self/cgroup","utf8").includes("docker")}catch(e){return false}}e.exports=()=>{if(o===undefined){o=hasDockerEnv()||hasDockerCGroup()}return o}},736:function(e,r,t){"use strict";const n=t(37);const o=t(147);const s=t(451);const isWsl=()=>{if(process.platform!=="linux"){return false}if(n.release().toLowerCase().includes("microsoft")){if(s()){return false}return true}try{return o.readFileSync("/proc/version","utf8").toLowerCase().includes("microsoft")?!s():false}catch(e){return false}};if(process.env.__IS_WSL_TEST__){e.exports=isWsl}else{e.exports=isWsl()}},382:function(e,r,t){const n=t(17);const o=t(81);const{promises:s,constants:i}=t(147);const a=t(736);const c=t(451);const u=t(246);const f=t.ab+"xdg-open";const{platform:p,arch:l}=process;const d=(()=>{const e="/mnt/";let r;return async function(){if(r){return r}const t="/etc/wsl.conf";let n=false;try{await s.access(t,i.F_OK);n=true}catch{}if(!n){return e}const o=await s.readFile(t,{encoding:"utf8"});const a=/(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(o);if(!a){return e}r=a.groups.mountPoint.trim();r=r.endsWith("/")?r:`${r}/`;return r}})();const pTryEach=async(e,r)=>{let t;for(const n of e){try{return await r(n)}catch(e){t=e}}throw t};const baseOpen=async e=>{e={wait:false,background:false,newInstance:false,allowNonzeroExitCode:false,...e};if(Array.isArray(e.app)){return pTryEach(e.app,(r=>baseOpen({...e,app:r})))}let{name:r,arguments:n=[]}=e.app||{};n=[...n];if(Array.isArray(r)){return pTryEach(r,(r=>baseOpen({...e,app:{name:r,arguments:n}})))}let u;const l=[];const m={};if(p==="darwin"){u="open";if(e.wait){l.push("--wait-apps")}if(e.background){l.push("--background")}if(e.newInstance){l.push("--new")}if(r){l.push("-a",r)}}else if(p==="win32"||a&&!c()){const t=await d();u=a?`${t}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`:`${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;l.push("-NoProfile","-NonInteractive","–ExecutionPolicy","Bypass","-EncodedCommand");if(!a){m.windowsVerbatimArguments=true}const o=["Start"];if(e.wait){o.push("-Wait")}if(r){o.push(`"\`"${r}\`""`,"-ArgumentList");if(e.target){n.unshift(e.target)}}else if(e.target){o.push(`"${e.target}"`)}if(n.length>0){n=n.map((e=>`"\`"${e}\`""`));o.push(n.join(","))}e.target=Buffer.from(o.join(" "),"utf16le").toString("base64")}else{if(r){u=r}else{const e=!__dirname||__dirname==="/";let r=false;try{await s.access(t.ab+"xdg-open",i.X_OK);r=true}catch{}const n=process.versions.electron||p==="android"||e||!r;u=n?"xdg-open":f}if(n.length>0){l.push(...n)}if(!e.wait){m.stdio="ignore";m.detached=true}}if(e.target){l.push(e.target)}if(p==="darwin"&&n.length>0){l.push("--args",...n)}const w=o.spawn(u,l,m);if(e.wait){return new Promise(((r,t)=>{w.once("error",t);w.once("close",(n=>{if(e.allowNonzeroExitCode&&n>0){t(new Error(`Exited with code ${n}`));return}r(w)}))}))}w.unref();return w};const open=(e,r)=>{if(typeof e!=="string"){throw new TypeError("Expected a `target`")}return baseOpen({...r,target:e})};const openApp=(e,r)=>{if(typeof e!=="string"){throw new TypeError("Expected a `name`")}const{arguments:t=[]}=r||{};if(t!==undefined&&t!==null&&!Array.isArray(t)){throw new TypeError("Expected `appArguments` as Array type")}return baseOpen({...r,app:{name:e,arguments:t}})};function detectArchBinary(e){if(typeof e==="string"||Array.isArray(e)){return e}const{[l]:r}=e;if(!r){throw new Error(`${l} is not supported`)}return r}function detectPlatformBinary({[p]:e},{wsl:r}){if(r&&a){return detectArchBinary(r)}if(!e){throw new Error(`${p} is not supported`)}return detectArchBinary(e)}const m={};u(m,"chrome",(()=>detectPlatformBinary({darwin:"google chrome",win32:"chrome",linux:["google-chrome","google-chrome-stable","chromium"]},{wsl:{ia32:"/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",x64:["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe","/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]}})));u(m,"firefox",(()=>detectPlatformBinary({darwin:"firefox",win32:"C:\\Program Files\\Mozilla Firefox\\firefox.exe",linux:"firefox"},{wsl:"/mnt/c/Program Files/Mozilla Firefox/firefox.exe"})));u(m,"edge",(()=>detectPlatformBinary({darwin:"microsoft edge",win32:"msedge",linux:["microsoft-edge","microsoft-edge-dev"]},{wsl:"/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"})));open.apps=m;open.openApp=openApp;e.exports=open},81:function(e){"use strict";e.exports=require("child_process")},147:function(e){"use strict";e.exports=require("fs")},37:function(e){"use strict";e.exports=require("os")},17:function(e){"use strict";e.exports=require("path")}};var r={};function __nccwpck_require__(t){var n=r[t];if(n!==undefined){return n.exports}var o=r[t]={exports:{}};var s=true;try{e[t](o,o.exports,__nccwpck_require__);s=false}finally{if(s)delete r[t]}return o.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(382);module.exports=t})();