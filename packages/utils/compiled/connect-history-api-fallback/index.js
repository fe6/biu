(function(){"use strict";var e={639:function(e,r,t){var n=t(310);r=e.exports=function historyApiFallback(e){e=e||{};var r=getLogger(e);return function(t,i,a){var o=t.headers;if(t.method!=="GET"){r("Not rewriting",t.method,t.url,"because the method is not GET.");return a()}else if(!o||typeof o.accept!=="string"){r("Not rewriting",t.method,t.url,"because the client did not send an HTTP accept header.");return a()}else if(o.accept.indexOf("application/json")===0){r("Not rewriting",t.method,t.url,"because the client prefers JSON.");return a()}else if(!acceptsHtml(o.accept,e)){r("Not rewriting",t.method,t.url,"because the client does not accept HTML.");return a()}var u=n.parse(t.url);var c;e.rewrites=e.rewrites||[];for(var l=0;l<e.rewrites.length;l++){var s=e.rewrites[l];var f=u.pathname.match(s.from);if(f!==null){c=evaluateRewriteRule(u,f,s.to,t);if(c.charAt(0)!=="/"){r("We recommend using an absolute path for the rewrite target.","Received a non-absolute rewrite target",c,"for URL",t.url)}r("Rewriting",t.method,t.url,"to",c);t.url=c;return a()}}var d=u.pathname;if(d.lastIndexOf(".")>d.lastIndexOf("/")&&e.disableDotRule!==true){r("Not rewriting",t.method,t.url,"because the path includes a dot (.) character.");return a()}c=e.index||"/index.html";r("Rewriting",t.method,t.url,"to",c);t.url=c;a()}};function evaluateRewriteRule(e,r,t,n){if(typeof t==="string"){return t}else if(typeof t!=="function"){throw new Error("Rewrite rule can only be of type string or function.")}return t({parsedUrl:e,match:r,request:n})}function acceptsHtml(e,r){r.htmlAcceptHeaders=r.htmlAcceptHeaders||["text/html","*/*"];for(var t=0;t<r.htmlAcceptHeaders.length;t++){if(e.indexOf(r.htmlAcceptHeaders[t])!==-1){return true}}return false}function getLogger(e){if(e&&e.logger){return e.logger}else if(e&&e.verbose){return console.log.bind(console)}return function(){}}},310:function(e){e.exports=require("url")}};var r={};function __nccwpck_require__(t){var n=r[t];if(n!==undefined){return n.exports}var i=r[t]={exports:{}};var a=true;try{e[t](i,i.exports,__nccwpck_require__);a=false}finally{if(a)delete r[t]}return i.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(639);module.exports=t})();