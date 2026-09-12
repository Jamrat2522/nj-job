import{e as l}from"./chunk-F5ETAYOF.js";function u(o,{page:g,size:c,total:r},$,d={}){let s=Math.max(1,Math.ceil(r/c)),a=Math.min(g,s),e=(t,p,i,n)=>`<button data-p="${p}" ${i?"disabled":""} class="${n?"cur":""}">${t}</button>`;if(d&&d.lp){let t=p=>Number(p).toLocaleString("th-TH");o.innerHTML=`<div class="pgn pgn-lp">
      <div class="pgn-nav">
        ${e("\u23EE",1,a===1)}${e("\u25C0",a-1,a===1)}
        <span class="pgn-pos">\u0E2B\u0E19\u0E49\u0E32 ${t(a)} / ${t(s)}</span>
        ${e("\u25B6",a+1,a===s)}${e("\u23ED",s,a===s)}
      </div>
      <div class="pgn-rpp"><span>\u0E41\u0E2A\u0E14\u0E07</span>
        <select class="sel" data-size>${l.map(p=>`<option ${p===c?"selected":""}>${p} / \u0E2B\u0E19\u0E49\u0E32</option>`).join("")}</select>
      </div>
    </div>`}else{let t="",p=Math.max(1,a-2),i=Math.min(s,a+2);for(let n=p;n<=i;n++)t+=e(n,n,!1,n===a);o.innerHTML=`<div class="pgn">
    <span>\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${r.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</span><span class="sp"></span>
    ${e("\u23EE",1,a===1)}${e("\u25C0",a-1,a===1)}${t}${e("\u25B6",a+1,a===s)}${e("\u23ED",s,a===s)}
    <select class="sel" data-size>${l.map(n=>`<option ${n===c?"selected":""}>${n}</option>`).join("")}</select>
  </div>`}o.querySelectorAll("[data-p]").forEach(t=>t.onclick=()=>$({page:Number(t.dataset.p),size:c})),o.querySelector("[data-size]").onchange=t=>$({page:1,size:parseInt(t.target.value,10)})}export{u as a};
