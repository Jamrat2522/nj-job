import{a as St}from"./chunk-QTAG4IVE.js";import{a as Ot,b as Re,d as Fe,e as Be,f as Pt,g as De,h as $t,i as At,j as Nt,k as Lt,l as Ve,m as me,n as Se,p as qt,q as It,r as Mt,t as Rt,u as Ft,v as Bt,w as Vt,XF619,XV619,FC620}from"./chunk-VWRH4JCR.js";import{a as xe,b as Tt,c as we,d as Ce}from"./chunk-NG45Y6KB.js";import{b as qe,c as gt,k as X,l as oe,m as Y,w as Et}from"./chunk-L5Z2NDJ3.js";import{a as ROLE546,g as vt,k as de,l as Ne,f as MA575,j as CAN575}from"./chunk-2B2FLIKC.js";import{b as he,e as _t,f as jt,g as GN568}from"./chunk-4ATLROGD.js";import{a as xt,b as Me,d as wt,e as Ct,f as Dt}from"./chunk-VS5POHCJ.js";import{c as mt,d as bt}from"./chunk-Q7FMECGI.js";import{a as I}from"./chunk-EVZDPOX3.js";import{b as ge,c as q,d as fe,e as Ee,g as ke}from"./chunk-IOOV4VJU.js";import{e as pe,f as Ie}from"./chunk-OPGKUGLK.js";import{a as J}from"./chunk-YM5GFE6V.js";import{a as ce}from"./chunk-GDT6F23K.js";import{a as P}from"./chunk-OFOOXWUM.js";import{a as Le,b as le,c as yt,d as ht}from"./chunk-LNP7HEMP.js";import{a as V551,c as ue,d as ee,e as g}from"./chunk-NQOCXXA2.js";import{F as kt,z as CJ614}from"./chunk-6NADHKLT.js";import{a as ie,m as RPC546}from"./chunk-SGWIBJH6.js";function Zt(e,t=2){let n=[];return[...e].sort((o,l)=>l.y-o.y).forEach(o=>{let l=n.find(a=>Math.abs(a.y-o.y)<=t);l?l.items.push(o):n.push({y:o.y,items:[o]})}),n.map(o=>{let l=o.items.slice().sort((a,s)=>a.x-s.x);return{y:o.y,items:l,text:l.map(a=>a.str).join(" ").replace(/\s+/g," ").trim()}})}function Ze(e){let t=String(e||"").trim(),n=/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);if(!n){let s=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);return s?s[0]:""}let o=Number(n[1]),l=Number(n[2]),a=Number(n[3]);return a>=2400&&(a-=543),o<1||o>31||l<1||l>12||a<1990||a>2100?"":`${a}-${String(l).padStart(2,"0")}-${String(o).padStart(2,"0")}`}var Pn=new Set([..."\u0E08\u0E09\u0E0A\u0E10\u0E1B\u0E1C\u0E1D\u0E1F\u0E25\u0E2E\u0E27\u0E2D\u0E28\u0E29\u0E0B\u0E07"]);function z(e){let t="";for(let n of String(e||"")){if(/[A-Za-z0-9]/.test(n)){t+=n.toUpperCase();continue}/[ก-ฮ]/.test(n)&&!Pn.has(n)&&(t+=n)}return t}var Kt=e=>e.map((t,n)=>({page:n+1,lines:Zt(t)}));function $n(e,t){if(t.startsWith(e))return!0;let n=e.length;if(n<5)return!1;let o=Math.floor(n*.4),l=t.slice(0,n+1);if(t.length>n+3||l[0]!==e[0]&&l[0]!==e[1])return!1;let a=l.length,s=Array.from({length:n+1},()=>new Array(a+1).fill(0));for(let i=1;i<=n;i++)for(let d=1;d<=a;d++)s[i][d]=e[i-1]===l[d-1]?s[i-1][d-1]+1:Math.max(s[i-1][d],s[i][d-1]);for(let i=Math.max(1,n-o);i<=a;i++){let d=s[n][i];if(d>=n-o&&d>=Math.max(3,Math.ceil(n*.6))&&i-d<=1&&l[i-1]===e[n-1]&&t.length-i<=2)return!0}return!1}function M(e,t,{page:n=0,from:o=null}={}){for(let l of e)if(!(n&&l.page!==n))for(let a=0;a<l.lines.length;a++){if(o&&l.page===o.page.page&&a<=o.idx)continue;let s=l.lines[a].items;for(let i=0;i<s.length;i++){let d="";for(let f=i;f<Math.min(s.length,i+4);f++)if(d+=z(s[f].str),t.test(d)||t.alts&&t.alts.some(m=>$n(m,d)))return{page:l,line:l.lines[a],idx:a,item:s[i],end:s[f],j:i}}}return null}function An(e,t){let n=[],o=M(e,t);for(;o;)n.push(o),o=M(e,t,{from:o});return n}function Ue(e,{dx:t=25,maxDown:n=3,test:o,xMax:l=null}={}){if(!e)return null;for(let a=1;a<=n;a++){let s=e.page.lines[e.idx+a];if(!s)break;let i=s.items.find(d=>Math.abs(d.x-e.item.x)<=t&&(l==null||d.x<l)&&(!o||o(d.str.trim())));if(i)return i.str.trim()}return null}function Te(e,t,n){if(!e)return"";let o=[e.line,e.page.lines[e.idx+1],e.page.lines[e.idx+2],e.page.lines[e.idx+3]].filter(l=>l&&e.line.y-l.y<=20);for(let l of o){let a=l.items.filter(s=>{let i=s.str.trim();return/^\d{4}$/.test(i)&&s.x>=t-2&&(n==null||s.x<n-2)}).sort((s,i)=>s.x-i.x);if(a.length)return a[0].str.trim()}return""}var Ut=/\*?A\s?(\d{3})[-\s]?([0-9A-Z])[-\s]?(\d{4})[-\s]?(\d{5})\*?(?![0-9])/g;function Xt(e){let t=[];return e.forEach(n=>n.lines.forEach(o=>{let l=o.text.replace(/\s+/g," "),a;for(Ut.lastIndex=0;a=Ut.exec(l);)t.push({v:"A"+a[1]+a[2]+a[3]+a[4],type:a[2],page:n.page,y:o.y,bar:/^\*/.test(a[0])})})),t}function Oe(e){let t=String(e||""),n=z(t);if(/ใบกำกับการขนย้ายสินค้า/.test(t)||n.includes(Mn))return"MOVEMENT";let o=/Document\s*Type\s*:\s*([0-9A-Z])\b/i.exec(t);return o?/^[0P]$/i.test(o[1])?"IMPORT":/^[1D]$/i.test(o[1])?"EXPORT":"":/ใบขนสินค้าขาออก/.test(t)||n.includes(Rn)?"EXPORT":/ใบขนสินค้าขาเข้า/.test(t)||n.includes(Fn)?"IMPORT":""}function Nn(e,t){let n=/Document\s*Type\s*:\s*([0-9A-Z])\b/i.exec(t);if(n){let s=Oe("Document Type: "+n[1]);if(s)return s}let o=e[0]?e[0].lines.slice(0,14).map(s=>s.text).join(`
`):"",l=Oe(o);if(l)return l;let a=Xt([{page:1,lines:e[0]?e[0].lines.slice(0,14):[]}])[0];return a?/^[0P]$/.test(a.type)?"IMPORT":/^[1D]$/.test(a.type)?"EXPORT":"":Oe(t)}var Ln=/:|^N\/?A$|INCENTIVE|TAX\s*ID|EXPORT TAX|^\d|^TEL|^FAX|^E-?MAIL|BRANCH|^\(|^PAGE\b/i,Yt=e=>/[A-Za-z]/.test(e)&&!/[ก-๙]/.test(e)&&e.replace(/[^A-Za-z]/g,"").length>=5&&!Ln.test(e.trim());function He(e,{dx:t=30,maxDown:n=7}={}){if(!e)return null;for(let o=1;o<=n;o++){let l=e.page.lines[e.idx+o];if(!l)break;let a=l.items.filter(i=>i.x>=e.item.x-t&&i.x<=e.item.x+230);if(!a.length)continue;let s=a.map(i=>i.str).join(" ").replace(/\s+/g," ").trim();if(Yt(s))return s}return null}var Wt=/^[A-Z0-9][A-Z0-9-]{4,29}$/i,ze=e=>Wt.test(e)&&/\d/.test(e)&&!/^N\/?A$/i.test(e);function Qt(e){let t=String(e||"").trim(),n=/^([^()]*?)\s*\(\s*([^()]*?)\s*\)\s*$/.exec(t);if(n){let o=n[1].trim(),l=n[2].trim();return{mbl:ze(o)?o:"",hbl:ze(l)?l:""}}return ze(t)?{mbl:t,hbl:"",single:!0}:{mbl:"",hbl:""}}var Ht=/^(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})$/;function Pe(e){let t=String(e||"").replace(/[\u0000-\u001f]/g,"").trim();if(t=t.replace(/^\s*(Invoice\s*No\.?\s*[:=]?|INV\.?\s*#\s*(NO\.?)?|INV\.|INV\s+NO\.?|INV\s+)\s*/i,""),!t||Ht.test(t.split(/[\s:]/)[0])||/^วันที่|^date/i.test(t))return"";let o=t.split(/\s*,\s*/).map(l=>l.split(/\s*:\s*/)[0].replace(/\s+\d{1,2}[/-]\d{1,2}[/-]\d{4}.*$/,"").trim()).filter(l=>l&&!Ht.test(l)&&!/^0+$/.test(l)).join(",");return!o||/[ก-๙]/.test(o)?"":o}var qn=/^(BY\s+TRUCK|N\/?A|TRUCK|รถยนต์|BY\s+AIR|-)$/i;function Ke(e){let t=[...new Set(e.filter(n=>n!==""&&n!=null))];return t.length?t.length===1?{value:t[0],conflict:!1}:{value:"",conflict:!0,all:t}:{value:"",conflict:!1}}var In=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),B=(...e)=>{let t=new RegExp("^(?:"+e.map(n=>In(z(n))).join("|")+")");return t.alts=e.map(z),t},V={importer:B("\u0E1C\u0E39\u0E49\u0E19\u0E33\u0E02\u0E2D\u0E07\u0E40\u0E02\u0E49\u0E32"),exporter:B("\u0E1C\u0E39\u0E49\u0E2A\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E2D\u0E2D\u0E01"),mvExporter:B("\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01/\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"),invoice:B("\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32","\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"),bl:B("\u0E43\u0E1A\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E07\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"),vessel:B("\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32\u0E19\u0E1E\u0E32\u0E2B\u0E19\u0E30"),impDate:B("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32","\u0E27\u0E31\u0E19\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32"),expDate:B("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01","\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01"),impPort:B("\u0E17\u0E48\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32","\u0E17\u0E48\u0E32\u0E40\u0E23\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32"),release:B("\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22"),expRel:B("\u0E17\u0E48\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E02\u0E2D\u0E07","\u0E17\u0E48\u0E32\u0E40\u0E23\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E02\u0E2D\u0E07"),expLoad:B("\u0E17\u0E48\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E1A\u0E23\u0E23\u0E17\u0E38\u0E01\u0E02\u0E2D\u0E07","\u0E17\u0E48\u0E32\u0E40\u0E23\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E1A\u0E23\u0E23\u0E17\u0E38\u0E01\u0E02\u0E2D\u0E07"),mvPort:B("\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E17\u0E32\u0E07\u0E17\u0E48\u0E32")},Mn=z("\u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E02\u0E19\u0E22\u0E49\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"),zt=z("\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08"),Rn=z("\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E32\u0E2D\u0E2D\u0E01"),Fn=z("\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E32\u0E40\u0E02\u0E49\u0E32");function Xe(e){let t=Kt((e||[]).slice(0,1)),n=[];t.forEach(y=>y.lines.forEach(c=>n.push({page:y.page,...c})));let o=n.map(y=>y.text).join(`
`),l=[],a=[],s={},i={};if(o.replace(/\s/g,"").length<40)return{docType:"",subType:"",fields:s,names:i,conflicts:l,notes:a,empty:!0};let d=Nn(t,o);if(!d)return{docType:"",subType:"",fields:s,names:i,conflicts:l,notes:a,empty:!1,unknownType:!0};let f=/Document\s*Type\s*:\s*([0-9A-Z])\b/i.exec(o),m=Xt(t),S=d==="IMPORT"?/^[0P]$/:/^[1D]$/,b=f?f[1].toUpperCase():"";{let y=m.filter(C=>S.test(C.type));b&&(y=y.filter(C=>C.type===b).length?y.filter(C=>C.type===b):y);let c=Ke(y.map(C=>C.v));if(c.conflict){let C=Math.max(...t[0].lines.map(p=>p.y)),D=y.filter(p=>p.page===1&&(p.bar||p.y>=C-90));c=Ke(D.map(p=>p.v))}c.value?s.decl=c.value:c.conflict&&l.push("\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"),!b&&s.decl&&(b=s.decl.charAt(4))}if(d==="MOVEMENT"){let y=M(t,V.mvExporter)||M(t,V.exporter),c=He(y,{dx:80,maxDown:6});c&&(i.importer=[c]);let C=M(t,V.mvPort);if(C){let A=C.line.items.map(R=>/^(\d{4})\s*:/.exec(R.str.trim())).filter(Boolean).map(R=>R[1])[0];A&&(s.port=A)}let D=/Invoice No\.\s*=\s*([^\s]+)/.exec(o);D&&(s.srcinv=D[1].trim());let p=/BOOKING NUMBER\s*:\s*(\d+)/.exec(o);return p&&(s.book=p[1]),{docType:d,subType:b,fields:s,names:i,conflicts:l,notes:a,empty:!1}}if(d==="EXPORT"){let y=He(M(t,V.exporter),{dx:30,maxDown:7});y&&(i.importer=[y]);let c=M(t,V.expRel),C=M(t,V.expLoad);if(c&&C&&c.page===C.page&&c.idx===C.idx){let U=Te(c,c.item.x,C.item.x),ve=c.line.items.filter(te=>te.x>C.end.x+5&&/[ก-๙]/.test(te.str)&&!/^รหัส/.test(te.str.trim()))[0],_e=[Te(C,C.item.x,ve?ve.x:null),U].filter(Boolean);_e.length&&(s.port=_e.join("/"))}let D=Jt(t);D&&(s.srcinv=D);let p=M(t,V.expDate),A=Ze(Ue(p,{dx:30,maxDown:3,test:U=>/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$|^\d{4}-\d{2}-\d{2}$/.test(U)})||"");A&&(s.etd=A);let R=Gt(t);return R&&(s.vessel=R),{docType:d,subType:b,fields:s,names:i,conflicts:l,notes:a,empty:!1}}let x=M(t,V.bl);if(x){let y=Ue(x,{dx:30,maxDown:4,test:C=>/\(.*\)/.test(C)||Wt.test(C)&&/\d/.test(C)&&/[A-Z]/i.test(C)}),c=Qt(y);c.mbl&&(s.mbl=c.mbl),c.hbl&&(s.hbl=c.hbl)}let r=Jt(t);r&&(s.srcinv=r);let _=An(t,V.impPort),E=_.find(y=>y.line.items.some(c=>c.x>y.end.x&&z(c.str).includes(zt)))||_[0];if(E){let y=E.line.items.find(p=>p.x>E.end.x&&z(p.str).includes(zt)),c=Te(E,E.item.x,y?y.x:null),C=y?Te(E,y.x,null):"",D=[c,C].filter(Boolean);D.length&&(s.port=D.join("/"))}let h=M(t,V.impDate),j=Ze(Ue(h,{dx:30,maxDown:3,test:y=>/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$|^\d{4}-\d{2}-\d{2}$/.test(y)})||"");j&&(s.eta=j);let u=Gt(t);u&&(s.vessel=u);let $=He(M(t,V.importer),{dx:30,maxDown:7});return $&&(i.importer=[$]),{docType:d,subType:b,fields:s,names:i,conflicts:l,notes:a,empty:!1}}function Jt(e){let t=M(e,V.invoice);if(!t)return"";let n=t.line.items.filter(l=>l.x>t.end.x&&l.x-t.end.x<=150).map(l=>l.str).join(" ").trim(),o=Pe(n);if(o)return o;for(let l=1;l<=3&&!o;l++){let a=t.page.lines[t.idx+l];if(!a)break;let s=a.items.filter(i=>i.x>=t.item.x-12&&i.x<=t.item.x+170&&!/[ก-๙]/.test(i.str));s.length&&(o=Pe(s.map(i=>i.str).join(" ")))}return o}function Gt(e){let t=M(e,V.vessel);if(!t)return"";for(let n=1;n<=3;n++){let o=t.page.lines[t.idx+n];if(!o)break;let a=o.items.filter(d=>d.x>=t.item.x-30&&d.x<t.item.x+130&&!/:/.test(d.str)).map(d=>d.str).join(" ").replace(/\s+/g," ").trim();if(!a)continue;if(qn.test(a))return"";if(/[ก-๙]/.test(a)||!/[A-Z]{2}/.test(a))continue;if(/\b(KGM|C62|KG|PCS|CTNS?|CARTONS?|PALLETS?|PACKAGES?)\b|=|\d[\d,]*\.\d{2,3}\b/.test(a))return"";let s=t.page.lines[t.idx+n+1],i=s?s.items.filter(d=>Math.abs(d.x-t.item.x)<=30).map(d=>d.str).join(" ").trim():"";return i&&/^[0-9]{2,4}[A-Z]{0,2}$/.test(i)&&!/\(/.test(a)?`${a} (${i})`:a}return""}var Bn={O:"0",Q:"0",D:"0",U:"0",I:"1",L:"1",S:"5",B:"8",Z:"2",G:"6"},Je=e=>e.toUpperCase().replace(/[OQDUILSBZG]/g,t=>Bn[t]),Ge=/A[\s-]?([0-9OQDUILSBZG]{3})[\s-]?([0-9DP])[\s-]?([0-9OQDUILSBZG]{4})[\s-]?([0-9OQDUILSBZG]{5})(?![0-9A-Z])/g;function en(e){let t=[],n=String(e||"").toUpperCase(),o;for(Ge.lastIndex=0;o=Ge.exec(n);){let l="A"+Je(o[1])+o[2]+Je(o[3])+Je(o[4]),a=+l.slice(5,7),s=+l.slice(7,9);a<55||s<1||s>12||(t.push(l),Ge.lastIndex=o.index+1)}return t}function Ye(e){let t=Kt((e||[]).slice(0,1)),n={},o={},l=[],a=["OCR"],s=[];t.forEach(j=>j.lines.forEach(u=>s.push({page:j.page,...u})));let i=s.map(j=>j.text).join(`
`);if(i.replace(/\s/g,"").length<40)return{docType:"",subType:"",fields:n,names:o,conflicts:l,notes:a,empty:!0,ocr:!0};let d=Ke(en(i));d.value?n.decl=d.value:d.conflict&&l.push("\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32");let f=n.decl?n.decl.charAt(4):"",m=/^[0P]$/.test(f)?"IMPORT":/^[1D]$/.test(f)?"EXPORT":"",S=[],b=/\bINV(?:OICE)?\s*(?:NO\b\.?|#)\s*[:=]?\s*([A-Z0-9][A-Z0-9/-]{3,})/gi,x;for(;x=b.exec(i);){let j=Pe(x[1]);j&&/\d/.test(j)&&S.push(j.toUpperCase())}let r={};S.forEach(j=>{r[j]=(r[j]||0)+1});let _=Object.keys(r).filter(j=>r[j]>=2);_.length===1&&(n.srcinv=_[0]);let E=t[0];if(E&&E.lines.length){let j=Math.max(...E.lines.map(c=>c.y)),u=Math.min(...E.lines.map(c=>c.y)),$=j-(j-u)*.35,y=E.lines.filter(c=>c.y>=$).map(c=>c.items.filter(C=>C.x<280).map(C=>C.str).join(" ").replace(/\s+/g," ").trim()).find(c=>/\b(CO\.?\s*,?\s*LTD\.?|LIMITED|PUBLIC COMPANY)\s*$/i.test(c)&&Yt(c.replace(/[.,]/g," ")));y&&(o.importer=[y])}let h=!Object.keys(n).length&&!o.importer;return{docType:m,subType:f,fields:n,names:o,conflicts:l,notes:a,empty:!1,ocr:!0,ocrNothing:h}}var Vn="assets/vendor/pdf.min.js?v="+ie,tn="assets/vendor/pdf.worker.min.js?v="+ie,se=null;function an(){if(window.pdfjsLib){try{window.pdfjsLib.GlobalWorkerOptions.workerSrc=tn}catch{}return Promise.resolve(window.pdfjsLib)}return se||(se=new Promise((e,t)=>{let n=document.createElement("script");n.src=Vn,n.onload=()=>{if(!window.pdfjsLib){se=null,t(new Error("PDFJS_NOT_LOADED"));return}try{window.pdfjsLib.GlobalWorkerOptions.workerSrc=tn}catch{}e(window.pdfjsLib)},n.onerror=()=>{se=null,t(new Error("PDFJS_LOAD_FAILED"))},document.head.appendChild(n)}),se)}var Un=25*1024*1024;async function rn(e){if(!e)throw new Error("NO_FILE");let t=String(e.name||"").toLowerCase();if(!(String(e.type||"").toLowerCase()==="application/pdf"||t.endsWith(".pdf")))throw new Error("NOT_PDF");if(e.size>Un)throw new Error("FILE_TOO_LARGE");let o=await an(),l=new Uint8Array(await e.arrayBuffer()),a=null;try{a=await o.getDocument({data:l,isEvalSupported:!1}).promise;let s=[];for(let i=1;i<=Math.min(a.numPages,1);i++){let d=await a.getPage(i),f=await d.getTextContent();s.push(f.items.filter(m=>m&&typeof m.str=="string"&&m.str.trim()!=="").map(m=>({str:m.str,x:m.transform[4],y:m.transform[5]}))),d.cleanup&&d.cleanup()}return s}catch(s){let i=String(s&&s.name||"");throw i==="PasswordException"?new Error("PDF_PASSWORD"):i==="InvalidPDFException"?new Error("PDF_INVALID"):s}finally{try{a&&a.destroy&&await a.destroy()}catch{}l=null}}var $e="assets/vendor/ocr/",ae=null;function Hn(){return window.Tesseract?Promise.resolve(window.Tesseract):ae||(ae=new Promise((e,t)=>{let n=document.createElement("script");n.src=$e+"tesseract.min.js?v="+ie,n.onload=()=>{window.Tesseract?e(window.Tesseract):(ae=null,t(new Error("OCR_LOAD_FAILED")))},n.onerror=()=>{ae=null,t(new Error("OCR_LOAD_FAILED"))},document.head.appendChild(n)}),ae)}async function cn(e,{onProgress:t}={}){if(!e)throw new Error("NO_FILE");let o=await an(),l=await Hn(),a=m=>new URL(m,document.baseURI).href,s=null;try{s=await l.createWorker("eng",1,{workerPath:a($e+"worker.min.js?v="+ie),corePath:a($e),langPath:a($e).replace(/\/$/,""),gzip:!0,cacheMethod:"none",workerBlobURL:!1,logger:m=>{t&&m&&m.status==="recognizing text"&&t(m.progress||0)}})}catch{throw new Error("OCR_LOAD_FAILED")}let i=new Uint8Array(await e.arrayBuffer()),d=null,f=document.createElement("canvas");try{d=await o.getDocument({data:i,isEvalSupported:!1}).promise;let m=[];for(let S=1;S<=Math.min(d.numPages,1);S++){let b=await d.getPage(S),x=b.getViewport({scale:1}),r=Math.min(4,Math.sqrt(9e6/(x.width*x.height))),_=b.getViewport({scale:r});f.width=Math.ceil(_.width),f.height=Math.ceil(_.height);let E=f.getContext("2d");E.fillStyle="#fff",E.fillRect(0,0,f.width,f.height),await b.render({canvasContext:E,viewport:_}).promise;let h=await s.recognize(f,{},{blocks:!0,text:!1}),j=[];(h&&h.data&&h.data.blocks||[]).forEach(u=>(u.paragraphs||[]).forEach($=>($.lines||[]).forEach(y=>(y.words||[]).forEach(c=>{!c.text||!c.text.trim()||j.push({str:c.text,x:c.bbox.x0/r,y:(_.height-c.bbox.y1)/r})})))),m.push(j),b.cleanup&&b.cleanup()}return m}catch(m){let S=String(m&&m.name||"");throw S==="PasswordException"?new Error("PDF_PASSWORD"):S==="InvalidPDFException"?new Error("PDF_INVALID"):new Error("OCR_FAILED")}finally{f.width=0,f.height=0;try{s&&await s.terminate()}catch{}try{d&&d.destroy&&await d.destroy()}catch{}i=null}}var be={NOT_PDF:"\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48 PDF \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C .pdf \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",FILE_TOO_LARGE:"\u0E44\u0E1F\u0E25\u0E4C\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B (\u0E08\u0E33\u0E01\u0E31\u0E14 25 MB) \u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E25\u0E4C\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E25\u0E47\u0E01\u0E25\u0E07",PDF_PASSWORD:"PDF \u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E15\u0E31\u0E49\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E1B\u0E25\u0E14\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E48\u0E2D\u0E19\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48",PDF_INVALID:"\u0E44\u0E1F\u0E25\u0E4C PDF \u0E40\u0E2A\u0E35\u0E22\u0E2B\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E1F\u0E25\u0E4C",NO_TEXT:"PDF \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E14\u0E49 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E0A\u0E49 PDF \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E44\u0E14\u0E49",UNKNOWN_TYPE:"PDF \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E32\u0E40\u0E02\u0E49\u0E32 / \u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E32\u0E2D\u0E2D\u0E01 / \u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E02\u0E19\u0E22\u0E49\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49",PDFJS_LOAD_FAILED:"\u0E42\u0E2B\u0E25\u0E14\u0E15\u0E31\u0E27\u0E2D\u0E48\u0E32\u0E19 PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48",PDFJS_NOT_LOADED:"\u0E42\u0E2B\u0E25\u0E14\u0E15\u0E31\u0E27\u0E2D\u0E48\u0E32\u0E19 PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48",OCR_LOAD_FAILED:"PDF \u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E1E\u0E2A\u0E41\u0E01\u0E19 \u0E41\u0E15\u0E48\u0E42\u0E2B\u0E25\u0E14\u0E15\u0E31\u0E27\u0E2D\u0E48\u0E32\u0E19\u0E20\u0E32\u0E1E (OCR) \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E07",OCR_FAILED:"PDF \u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E1E\u0E2A\u0E41\u0E01\u0E19 \u0E41\u0E25\u0E30\u0E2D\u0E48\u0E32\u0E19\u0E14\u0E49\u0E27\u0E22 OCR \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E07",OCR_NOTHING:"PDF \u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E1E\u0E2A\u0E41\u0E01\u0E19 \u0E2D\u0E48\u0E32\u0E19\u0E14\u0E49\u0E27\u0E22 OCR \u0E41\u0E25\u0E49\u0E27\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19 / Invoice / \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E17\u0E35\u0E48\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E44\u0E14\u0E49 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E07"},dn=e=>be[String(e&&e.message||"")]||"\u0E2D\u0E48\u0E32\u0E19 PDF \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48",nn=e=>String(e??"").toLowerCase().replace(/[.,\-–—_()"'`]/g," ").replace(/\s+/g," ").replace(/\bco\s*ltd\b/g,"coltd").replace(/\bcompany limited\b/g,"coltd").replace(/\blimited\b/g,"ltd").replace(/\s/g,"").trim();function zn(e,t){let n=(e||[]).filter(Boolean),o=(t||[]).map(l=>String(l??"")).filter(l=>l.trim());for(let l of o){let a=[n.filter(s=>String(s.name)===l),n.filter(s=>String(s.name).trim().toLowerCase()===l.trim().toLowerCase()),n.filter(s=>nn(s.name)===nn(l))];for(let s of a){if(s.length===1)return{item:s[0]};if(s.length>1)return{duplicates:s,name:l}}}return null}var ln=[["decl","decl"],["srcinv","srcinv"],["mbl","mbl"],["hbl","hbl"],["port","port"],["eta","eta"],["vessel","vessel"],["etd","etd"],["book","book"]];function on(e,t,{p:n="nj-"}={}){let o=b=>e.querySelector("#"+n+b),l=[],a=[],s=[],i=[];ln.forEach(([b,x])=>{let r=t.fields[b],_=o(x);!_||r==null||r===""||l.push({kind:"text",id:n+x,el:_,value:String(r),old:_.value.trim()})});let d=o("comp"),f=t.names.importer;if(d&&f&&f.length){let b=zn(Y(),f);b&&b.item?l.push({kind:"combo",id:n+"comp",el:d,item:b.item,value:b.item.name,old:q(d)}):(a.push("\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"),b&&b.duplicates?i.push({name:b.name,rows:b.duplicates}):s.push(f[0]))}let m=new Set(l.map(b=>b.id));ln.forEach(([,b])=>{let x=o(b);!x||m.has(n+b)||x.dataset.pdfVal==null||x.value.trim()===x.dataset.pdfVal&&l.push({kind:"clear",id:n+b,el:x,value:"",old:""})}),d&&!m.has(n+"comp")&&d.dataset.pdfVal!=null&&q(d)===d.dataset.pdfVal&&l.push({kind:"clearCombo",id:n+"comp",el:d,value:"",old:""});let S=l.filter(b=>b.old&&String(b.old)!==(b.kind==="combo"?String(b.item.id):b.value));return{plan:l,needMaster:a,missing:s,duplicates:i,clash:S}}function sn(e){let t=0,n=0,o=[];return e.forEach(l=>{if(l.kind==="clearCombo"){l.el.value="",l.el.dispatchEvent(new Event("input",{bubbles:!0})),l.el.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:!0})),delete l.el.dataset.pdfVal,n++;return}if(l.kind==="clear"){l.el.value="",l.el.dispatchEvent(new Event("input",{bubbles:!0})),l.el.dispatchEvent(new Event("change",{bubbles:!0})),delete l.el.dataset.pdfVal,n++;return}if(l.kind==="combo"){ge(l.el,l.item)?(t++,l.el.dataset.pdfVal=String(l.item.id)):o.push(l.id);return}l.el.value=l.value,l.el.dispatchEvent(new Event("input",{bubbles:!0})),l.el.dispatchEvent(new Event("change",{bubbles:!0})),l.el.dataset.pdfVal=l.el.value.trim(),t++}),{filled:t,failed:o,cleared:n}}function un(e){let t=e||{},n={IMPORT:"\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E32\u0E40\u0E02\u0E49\u0E32",EXPORT:"\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E32\u0E2D\u0E2D\u0E01",MOVEMENT:"\u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E02\u0E19\u0E22\u0E49\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"},l="\u0E2D\u0E48\u0E32\u0E19 PDF \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"+(t.docType?" ("+(n[t.docType]||t.docType)+(t.subType?" TYPE "+t.subType:"")+")":"")+" \u2014 \u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 "+(t.filled||0)+" \u0E0A\u0E48\u0E2D\u0E07";return t.cleared&&(l+=" \xB7 \u0E25\u0E49\u0E32\u0E07\u0E04\u0E48\u0E32\u0E08\u0E32\u0E01 PDF \u0E44\u0E1F\u0E25\u0E4C\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35 "+t.cleared+" \u0E0A\u0E48\u0E2D\u0E07"),t.ocr&&(l+=" \xB7 PDF \u0E20\u0E32\u0E1E\u0E2A\u0E41\u0E01\u0E19 \u0E2D\u0E48\u0E32\u0E19\u0E14\u0E49\u0E27\u0E22 OCR \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1A\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E17\u0E32\u0E19\u0E41\u0E25\u0E30\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E40\u0E2D\u0E07"),(t.missing||[]).forEach(a=>{l+=" \xB7 MASTER_MISSING: \u0E44\u0E21\u0E48\u0E1E\u0E1A \u201C"+a+"\u201D \u0E43\u0E19\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01/\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E40\u0E2D\u0E07"}),(t.duplicates||[]).forEach(a=>{l+=" \xB7 Company Master \u0E0B\u0E49\u0E33 \u201C"+a.name+"\u201D ("+a.rows.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23) \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E40\u0E2D\u0E07"}),(t.failed||[]).length&&(l+=" \xB7 \u0E40\u0E15\u0E34\u0E21\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: "+t.failed.join(", ")),(t.conflicts||[]).length&&(l+=" \xB7 \u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0B\u0E49\u0E33\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A ("+t.conflicts.join(", ")+")"),l}async function pn(e,t,{p:n="nj-",confirm:o}={}){let l=on(e,t,{p:n});if(l.missing.length&&typeof X=="function"){try{await X(!0)}catch{}l=on(e,t,{p:n})}let{plan:a,needMaster:s,missing:i,duplicates:d,clash:f}=l,m={needMaster:s,missing:i,duplicates:d,conflicts:t.conflicts||[],docType:t.docType||"",subType:t.subType||"",ocr:!!t.ocr};if(f.length&&typeof o=="function"&&!await o(f)){let _=a.filter(u=>!f.includes(u)),{filled:E,failed:h,cleared:j}=sn(_);return{...m,filled:E,failed:h,cleared:j,skipped:f.length}}let{filled:S,failed:b,cleared:x}=sn(a);return{...m,filled:S,failed:b,cleared:x,skipped:0}}function fn(e,t,n="\u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01 PDF",o="\u0E40\u0E01\u0E47\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21"){return new Promise(l=>{if(!e){l(!1);return}let a=document.createElement("div");a.className="jm-pdf-ask",a.setAttribute("data-enter-skip",""),a.innerHTML=`<span class="jm-pdf-ask-t"></span>
      <button type="button" class="btn btn-sm btn-p" data-yes></button>
      <button type="button" class="btn btn-sm btn-o" data-no></button>`,a.querySelector(".jm-pdf-ask-t").textContent=t,a.querySelector("[data-yes]").textContent=n,a.querySelector("[data-no]").textContent=o;let s=i=>{a.remove(),l(i)};a.querySelector("[data-yes]").onclick=()=>s(!0),a.querySelector("[data-no]").onclick=()=>s(!1),e.appendChild(a);try{a.scrollIntoView({block:"nearest"})}catch{}})}var mn="nj-master-picker",Qe=e=>String(e??"").trim().toLowerCase(),We=e=>Qe(e).replace(/[^0-9a-z\u0E00-\u0E7F]/g,"");function Jn(e,t,n){let o=Qe(t);if(!o)return e.slice();let l=We(o);return e.filter(a=>n.some(s=>{let i=a[s];return Qe(i).includes(o)||!!l&&!!We(i)&&We(i).includes(l)}))}function bn({title:e,rows:t=[],keys:n=[],cols:o=[],placeholder:l="\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE \u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",limit:a=100,manage:s=null}={}){return new Promise(i=>{document.getElementById(mn)?.remove();let d=document.createElement("div");d.id=mn,d.className="njpk-bk",d.innerHTML=`
      <div class="njpk" role="dialog" aria-modal="true">
        <div class="njpk-h">
          <h3>${g(e||"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D")}</h3>
          <button type="button" class="btn btn-icon btn-o" data-njpk-close aria-label="\u0E1B\u0E34\u0E14">\u2715</button>
        </div>
        <div class="njpk-b">
          <div class="njpk-bar">
            <label for="njpk-q">\u0E04\u0E49\u0E19\u0E2B\u0E32</label>
            <input class="inp" id="njpk-q" placeholder="${g(l)}" autocomplete="off">
            <button type="button" class="btn btn-o btn-sm" id="njpk-go">\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32</button>
            ${s?'<button type="button" class="btn btn-p btn-sm" id="njpk-add">+ '+g(s.label||"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")+"</button>":""}
          </div>
          
          ${s?`<div class="njpk-form" id="njpk-form" hidden>
            ${s.codeField?`<label for="njpk-code">${g(s.codeField)} <span class="req">*</span></label>
            <input class="inp njpk-code" id="njpk-code" autocomplete="off">`:""}
            <label for="njpk-name">${g(s.field||"\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17")} <span class="req">*</span></label>
            <input class="inp" id="njpk-name" autocomplete="off">
            <button type="button" class="btn btn-p btn-sm" id="njpk-save">\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>
            <button type="button" class="btn btn-o btn-sm" id="njpk-cancel">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
          </div>`:""}
          <div class="tbl-wrap njpk-tbl"><table class="tbl"><thead><tr>
            <th style="width:44px">\u0E40\u0E25\u0E37\u0E2D\u0E01</th>
            ${o.map(h=>`<th${h.w?` style="width:${h.w}"`:""}>${g(h.th)}</th>`).join("")}
            ${s?'<th style="width:150px">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>':""}
          </tr></thead><tbody id="njpk-tb"></tbody></table></div>
          <div class="njpk-note" id="njpk-note"></div>
        </div>
        <div class="njpk-f">
          <button type="button" class="btn btn-p" id="njpk-ok">\u0E40\u0E25\u0E37\u0E2D\u0E01</button>
          <button type="button" class="btn btn-o" data-njpk-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
        </div>
      </div>`,document.body.appendChild(d);let f=d.querySelector("#njpk-tb"),m=d.querySelector("#njpk-note"),S=d.querySelector("#njpk-q"),b=[],x=null,r=()=>{let h=Jn(t,S.value,n);b=h.slice(0,a),x=null,f.innerHTML=b.length?b.map((j,u)=>`<tr data-i="${u}">
            <td class="center"><input type="radio" name="njpk-r" value="${u}"></td>
            ${o.map($=>`<td class="ellip" title="${g($.get(j)||"")}">${g($.get(j)||"-")}</td>`).join("")}
            ${s?`<td class="njpk-act">
              <button type="button" class="btn btn-o btn-sm" data-njpk-edit="${u}">\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02</button>
              <button type="button" class="btn btn-o btn-sm njpk-del" data-njpk-del="${u}">\u{1F5D1} \u0E25\u0E1A</button>
            </td>`:""}
          </tr>`).join(""):`<tr><td colspan="${o.length+(s?2:1)}" class="center t-3">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</td></tr>`,m.textContent=h.length>b.length?"\u0E41\u0E2A\u0E14\u0E07 "+b.length+" \u0E08\u0E32\u0E01 "+h.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07":h.length?"\u0E1E\u0E1A "+h.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":""};r(),f.addEventListener("click",h=>{let j=h.target.closest("tr[data-i]");if(!j)return;let u=j.querySelector("input[type=radio]");u&&(u.checked=!0),x=b[Number(j.dataset.i)]}),f.addEventListener("change",h=>{h.target.name==="njpk-r"&&(x=b[Number(h.target.value)])}),S.addEventListener("input",r),d.querySelector("#njpk-go").onclick=r,S.onkeydown=h=>{h.key==="Enter"&&(h.preventDefault(),r())};let _=h=>{document.removeEventListener("keydown",E,!0),d.remove(),i(h||null)};function E(h){h.key==="Escape"&&(h.stopPropagation(),h.preventDefault(),_(null))}if(document.addEventListener("keydown",E,!0),d.querySelectorAll("[data-njpk-close]").forEach(h=>{h.onclick=()=>_(null)}),d.addEventListener("mousedown",h=>{h.target===d&&_(null)}),d.querySelector("#njpk-ok").onclick=()=>{if(!x){m.textContent="\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E48\u0E2D\u0E19";return}_(x)},s){let h=d.querySelector("#njpk-form"),j=d.querySelector("#njpk-name"),u=d.querySelector("#njpk-code"),$=null,y=D=>{$=D||null,j.value=D&&D.name||"",u&&(u.value=D&&D.code||""),h.hidden=!1,m.textContent=D?"\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E01\u0E49\u0E44\u0E02: "+(D.name||""):"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48";let p=u||j;setTimeout(()=>{try{p.focus()}catch{}},0)},c=()=>{h.hidden=!0,$=null,j.value="",u&&(u.value="")},C=()=>{typeof s.reload=="function"&&(t=s.reload()||t),r()};d.querySelector("#njpk-add").onclick=()=>y(null),d.querySelector("#njpk-cancel").onclick=()=>{c(),m.textContent=""},d.querySelector("#njpk-save").onclick=async()=>{let D=String(j.value||"").trim(),p=u?String(u.value||"").trim():void 0;if(u&&!p){m.textContent="\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 CODE \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",u.focus();return}if(!D){m.textContent="\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E48\u0E2D\u0E19",j.focus();return}m.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...";try{await s.onSave($,D,p),c(),C(),m.textContent="\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27"}catch(A){m.textContent=A&&A.message||"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"}},j.onkeydown=D=>{D.key==="Enter"&&(D.preventDefault(),d.querySelector("#njpk-save").click())},u&&(u.onkeydown=D=>{D.key==="Enter"&&(D.preventDefault(),j.focus())}),f.addEventListener("click",async D=>{let p=D.target.closest("[data-njpk-edit]");if(p){D.stopPropagation(),y(b[Number(p.dataset.njpkEdit)]);return}let A=D.target.closest("[data-njpk-del]");if(!A)return;D.stopPropagation();let R=b[Number(A.dataset.njpkDel)];if(R){if(A.dataset.armed!=="1"){f.querySelectorAll("[data-njpk-del]").forEach(U=>{U.dataset.armed="",U.textContent="\u{1F5D1} \u0E25\u0E1A",U.classList.remove("btn-danger")}),A.dataset.armed="1",A.textContent="\u26A0 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A?",A.classList.add("btn-danger"),m.textContent='\u0E01\u0E14 "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A?" \u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E1A \u201C'+(R.name||"")+"\u201D";return}m.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E25\u0E1A...";try{await s.onDelete(R),c(),C(),m.textContent="\u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27"}catch(U){m.textContent=U&&U.message||"\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"}}})}setTimeout(()=>{try{S.focus()}catch{}},0)})}var NM605=e=>e?String(e.name||e.code||""):"";/* V.605 : DOCUMENT \u2014 \u0E0A\u0E48\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E41\u0E2A\u0E14\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E15\u0E47\u0E21\u0E08\u0E32\u0E01 MASTER (\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E14\u0E49\u0E27\u0E22 CODE \u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21 \u00B7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 customer_id \u0E40\u0E14\u0E34\u0E21) */var nt=null,yn=()=>nt||(nt=Ie()),lt=()=>{nt=null};function Gn(e){let t=q(e);if(t){let n=(ce.masters.customers||[]).find(o=>o.id===t);if(n)return n.customer_name||n.name||n.code||""}return fe(e)}var Zn=e=>{let t=Be.slice();return e&&!t.includes(e)&&t.push(e),t.map(n=>`<option value="${g(n)}"${e===n?" selected":""}>${g(n)}${Be.includes(n)?"":" (\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19)"}</option>`).join("")},hn=(e,t)=>({getItems:oe,display:e?De:NM605,codeFirst:!0,limit:20,canCreate:!1,emptyHint:"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 SYSTEM > \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",onChange:t,...e?{searchFirst:!0,searchHint:"\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32"}:{meta:$t,searchFirst:!0,searchKeys:["tax_id","branch_code"],radio:!0,searchHint:"\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE \xB7 \u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \xB7 TAX ID \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E32\u0E02\u0E32 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32"}});function ot(e,t,{items:n=oe,pick:o=Nt,cls:l="jm-cust-pick"}={}){let a=e.querySelector("#"+t);if(!a)return()=>{};let s=a.closest(".fld");if(!s)return()=>{};s.classList.add("jm-cust-fld");let i=s.querySelector("."+l);i||(i=document.createElement("div"),i.className=l,s.appendChild(i));let d=()=>{let f=n().find(m=>m.id===q(a));i.textContent=f?o(f):"",i.hidden=!f};return d(),d}async function Hl(e,t){let n=t.id||null,o=X(),l=n?Me(n).catch(_=>{throw _}):null;l&&l.catch(()=>{}),await o;let a=t.mode==="accounting",s={charge_type:t.charge,company_group:t.group,containers:[]};if(n&&(s=await l,s.invoice_id)){e.innerHTML='<div class="card card-pad empty">\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07 Void INVOICE \u0E01\u0E48\u0E2D\u0E19</div>';return}let i=s.charge_type,d=s.company_group,f=()=>{let _=(ce.masters.customers||[]).find(E=>E.id===q(e.querySelector("#jf-cust")));return _?_.credit_term_days:null};e.innerHTML=`
    <div class="fs-page">
      <div class="fs-head"><div class="fs-title"><span class="dot"></span>
        <h2>${n?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19":"\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"} (${a?"ACCOUNTING":"DOCUMENT"} - ${bt(i)})</h2>
        <span class="ch-head-badge service">${mt(d)}</span></div>
        <button class="btn-icon" id="jf-back" aria-label="\u0E1B\u0E34\u0E14">\u2715</button></div>
      <div class="fs-body">
      <input type="hidden" id="jf-dtype" value="${g(s.data_type||"")}">
      <input type="hidden" id="jf-refdate" value="${s.reference_date||ee(new Date)}">
      <input type="hidden" id="jf-ref" value="${g(s.reference_no||"")}">

      <div class="jm-sec jm-doc">
        <div class="jm-sec-t">DOCUMENT</div>
        <div class="jm-grid">
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19</label>
            
            <input class="inp" value="${g(s&&s.job_no||gn)}" readonly disabled></div>
          <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</label>
            <select class="sel" id="jf-comp">${Et(s.company_invoice_id)}</select>
            ${a&&de()?'<button type="button" class="jm-link" data-master="companies">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>':""}</div>
          <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
            ${Ee("jf-cust",oe(),s.customer_id,"\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",a?De:NM605)}
            ${a&&de()?'<button type="button" class="jm-link" data-master="customers">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>':""}</div>
          <div class="fld"><label>Customer Job No.</label>
            <input class="inp" id="jf-cjob" value="${g(s.customer_job_no||"")}"></div>
        </div>
        <div class="jm-grid">
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
            <input class="inp" id="jf-decl" value="${g(s.customs_declaration_no||"")}"></div>
          <div class="fld"><label>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</label>
            <input class="inp" id="jf-srcinv" value="${g(s.source_invoice_no||"")}"></div>
          <div class="fld"><label>House B/L No.</label>
            <input class="inp" id="jf-hbl" value="${g(s.house_bl_no||"")}"></div>
          <div class="fld"><label>Master B/L No.</label>
            <input class="inp" id="jf-mbl" value="${g(s.master_bl_no||"")}"></div>
        </div>
        <div class="jm-grid jm-grid-5">
          <div class="fld"><label>Booking No.</label>
            <input class="inp" id="jf-book" value="${g(s.booking_no||"")}"></div>
          <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>
            <input class="inp" id="jf-vessel" value="${g(s.vessel_name||"")}"></div>
          <div class="fld"><label>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49</label>
            <input class="inp" type="number" min="0" id="jf-qtyc" value="${s.qty_container??""}"></div>
          <div class="fld"><label>ETD</label>
            <input class="inp" type="date" id="jf-etd" value="${s.etd||""}"></div>
          <div class="fld"><label>ETA / \u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label>
            <input class="inp" type="date" id="jf-eta" value="${s.eta||""}"></div>
        </div>
      </div>

      ${a?`<div class="jm-sec jm-acc">
        <div class="jm-sec-t">ACCOUNTING</div>
        <div class="jm-grid">
          <div class="fld"><label>Case</label>
            <input class="inp" id="jf-case" value="${g(s.case_no||"")}"></div>
          <div class="fld"><label>Contact</label>
            <input class="inp" id="jf-contact" value="${g(s.contact||"")}"></div>
          <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
            <input class="inp" type="number" min="0" id="jf-term" value="${s.credit_term_days??""}"
              placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"></div>
          <div class="fld"><label>Due Date</label>
            <input class="inp" type="date" id="jf-due" value="${s.due_date||""}"></div>
        </div>
        <div class="jm-hint" id="jf-due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>
      </div>`:`
        <input type="hidden" id="jf-case" value="${g(s.case_no||"")}">
        <input type="hidden" id="jf-contact" value="${g(s.contact||"")}">
        <input type="hidden" id="jf-term" value="${s.credit_term_days??""}">
        <input type="hidden" id="jf-due" value="${s.due_date||""}">
        <div id="jf-due-pv" hidden></div>`}

      <div class="jm-sec">
        <div class="jm-sec-t">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21</div>
        <div class="jm-grid">
          <div class="fld"><label>\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label>
            <input class="inp" type="date" id="jf-dlv" value="${s.delivery_date||""}"></div>
          <div class="fld"><label>CS</label>
            <input class="inp" id="jf-cs" value="${g(s.cs_name||"")}"></div>
          <div class="fld"><label>I BILLING APL</label>
            <input class="inp" id="jf-apl" value="${g(s.i_billing_apl||"")}"></div>
        </div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E40\u0E19\u0E2D\u0E23\u0E4C</label>
          <div id="jf-cnts"></div>
          <button type="button" class="btn btn-o btn-sm mt-1" id="jf-addcnt">+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E15\u0E39\u0E49</button></div>
        <div class="fld mt-2"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <textarea class="inp w100" id="jf-note">${g(s.note||"")}</textarea></div>
      </div>
      </div>
      <div class="fs-foot">
        <div class="mf-left">
          ${a?`<button class="btn btn-p" id="jf-post" disabled
            title="\u0E23\u0E2D RPC njacc_post_invoice (atomic DRAFT\u2192POSTED) \u2014 sql/dev/011 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E19">\u21E7 POST</button>
          <button class="btn btn-o" id="jf-unpost" disabled
            title="\u0E15\u0E49\u0E2D\u0E07 POST \u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30 UNPOST \u0E44\u0E14\u0E49 \u2014 sql/dev/011 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E19">\u21E9 UNPOST</button>`:""}
        </div>
        <div class="mf-right">
          <button class="btn btn-p" id="jf-save">\u{1F4BE} ${a?"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01":"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19"}</button>
          ${a?`<button class="btn btn-print" id="jf-print" disabled
            title="\u0E43\u0E0A\u0E49 renderer \u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A Preview \u2014 sql/dev/011 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E19">\u{1F5A8} Print Draft</button>`:""}
          <button class="btn btn-o" id="jf-cancel">\u2715 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
        </div>
      </div>
    </div>`;let m=e.querySelector("#jf-cnts");function S(_={}){let E=document.createElement("div");E.className="jf-cnt-row",E.innerHTML=`<input class="inp" data-cn placeholder="\u0E40\u0E25\u0E02\u0E15\u0E39\u0E49" value="${g(_.container_no||"")}">
      <input class="inp" data-ct placeholder="\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E15\u0E39\u0E49 \u0E40\u0E0A\u0E48\u0E19 40HC" style="max-width:150px" value="${g(_.container_type||"")}">
      <button class="btn btn-o btn-sm" data-del>\u2715</button>`,E.querySelector("[data-del]").onclick=()=>E.remove(),m.appendChild(E)}(s.containers||[]).forEach(S),e.querySelector("#jf-addcnt").onclick=()=>S();function b(){let _=e.querySelector("#jf-due-pv"),E=e.querySelector("#jf-due").value;if(E){_.textContent="Due Date: "+ue(E)+" (\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07)";return}let h=e.querySelector("#jf-refdate").value,j=e.querySelector("#jf-term").value!==""?Number(e.querySelector("#jf-term").value):f();if(h&&j!=null){let u=new Date(h+"T00:00:00");u.setDate(u.getDate()+Number(j)),_.textContent="Due Date (\u0E04\u0E33\u0E19\u0E27\u0E13): "+ue(ee(u))+" \xB7 \u0E40\u0E17\u0E2D\u0E21 "+j+" \u0E27\u0E31\u0E19",_.dataset.calc=ee(u)}else _.textContent="\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date",delete _.dataset.calc}["#jf-refdate","#jf-term","#jf-due"].forEach(_=>e.querySelector(_).addEventListener("input",b)),ke(e,"jf-cust",hn(a,()=>{b(),x()}));let x=a?()=>{}:ot(e,"jf-cust");b(),e.addEventListener("click",_=>{let E=_.target.closest("[data-master]");E&&(location.hash=E.dataset.master==="customers"?"#/settings/customers":"#/masters?tab="+E.dataset.master)});let r=()=>location.hash=t.mode?"#/"+t.mode+"/"+String(i).toLowerCase():"#/charges/"+i+"/"+d;i==="ADVANCE"&&AD698.mount(e,"jf-",{jobId:n,jobNo:s&&s.job_no||""}),e.querySelector("#jf-back").onclick=r,e.querySelector("#jf-cancel").onclick=r,e.querySelector("#jf-save").onclick=async _=>{Ce(e);let E=e.querySelector("#jf-refdate"),h=e.querySelector("#jf-cust"),j=!1;if((!xe(E.value)||!Tt(E.value))&&(we(E,"\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"),j=!0),xe(q(h))||(we(h,fe(h)?"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23":"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"),j=!0),j){P("\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A","err");return}let u=e.querySelector("#jf-due-pv"),$={id:n,charge_type:i,company_group:d,data_type:e.querySelector("#jf-dtype").value||null,reference_no:e.querySelector("#jf-ref").value.trim()||null,reference_date:E.value,company_invoice_id:e.querySelector("#jf-comp").value||null,customer_id:q(h),customs_declaration_no:e.querySelector("#jf-decl").value.trim()||null,source_invoice_no:e.querySelector("#jf-srcinv").value.trim()||null,house_bl_no:e.querySelector("#jf-hbl").value.trim()||null,master_bl_no:e.querySelector("#jf-mbl").value.trim()||null,booking_no:e.querySelector("#jf-book").value.trim()||null,vessel_name:e.querySelector("#jf-vessel").value.trim()||null,qty_container:e.querySelector("#jf-qtyc").value!==""?Number(e.querySelector("#jf-qtyc").value):null,etd:e.querySelector("#jf-etd").value||null,eta:e.querySelector("#jf-eta").value||null,delivery_date:e.querySelector("#jf-dlv").value||null,customer_job_no:e.querySelector("#jf-cjob").value.trim()||null,case_no:e.querySelector("#jf-case").value.trim()||null,contact:e.querySelector("#jf-contact").value.trim()||null,cs_name:e.querySelector("#jf-cs").value.trim()||null,i_billing_apl:e.querySelector("#jf-apl").value.trim()||null,credit_term_days:e.querySelector("#jf-term").value!==""?Number(e.querySelector("#jf-term").value):f(),due_date:e.querySelector("#jf-due").value||u.dataset.calc||null,note:e.querySelector("#jf-note").value.trim()||null,containers:[...m.querySelectorAll(".jf-cnt-row")].map(y=>({container_no:y.querySelector("[data-cn]").value.trim(),container_type:y.querySelector("[data-ct]").value.trim()||null})).filter(y=>y.container_no)};n||($.request_id=yn()),I(_.target,!0);try{let r698=await pe("save-job",()=>xt($));i==="ADVANCE"&&await AD698.after(e,r698&&r698.id||n);n||lt(),P(n?"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27":"\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E49\u0E27","ok"),r()}catch(y){J(y),I(_.target,!1)}}}var gn="\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",Kn=["id","job_no","open_no","created_at","created_by","updated_at","updated_by","last_updated_at","operational_status","job_closed_at","job_closed_by","job_close_note","document_status","job_posted_at","job_posted_by","invoice_id","invoice_no","invoice_status","payment_status","advance_status","settled_at","settled_by","request_id"];function Xn(e){let t={};for(let n of Object.keys(e||{}))Kn.includes(n)||(t[n]=e[n]);return t}var Yn=()=>Ne()?{label:"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",field:"\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",codeField:"CODE",reload:()=>Y(),onSave:async(e,t,n)=>{let o=String(n||"").trim();if(!o)throw new Error("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01 CODE \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17");await qe(e&&e.id?{id:e.id,company_name:t,company_code:o}:{company_name:t,company_code:o}),await X(!0),P((e&&e.id?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u201C":"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u201C")+t+"\u201D \u0E41\u0E25\u0E49\u0E27","ok")},onDelete:async e=>{try{await gt({id:e.id})}catch(t){let n=String(t&&t.message||"");if(/NJACC_COMPANY_IN_USE/.test(n)){let o=(n.match(/NJACC_COMPANY_IN_USE:(\d+)/)||[])[1];throw new Error("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E25\u0E1A\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49 \u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E21\u0E35\u0E07\u0E32\u0E19\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E2D\u0E22\u0E39\u0E48"+(o?" ("+o+" \u0E07\u0E32\u0E19)":""))}throw/NJACC_FORBIDDEN/.test(n)?new Error("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E1A\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 (SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)"):new Error("\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48")}await X(!0),P("\u0E25\u0E1A\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u201C"+(e.name||"")+"\u201D \u0E41\u0E25\u0E49\u0E27","ok")}}:null,vn={comp:{title:"\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 (Company Invoice)",getItems:Y,keys:["code","name","contact_name"],placeholder:"\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE \u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",manage:Yn,cols:[{th:"CODE",w:"110px",get:e=>e.code},{th:"\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",get:e=>e.name},{th:"\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D",w:"200px",get:e=>e.contact_name}]},cust:{title:"\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 (Customer Master)",getItems:oe,keys:["code","name","tax_id","branch_code"],placeholder:"\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE \xB7 \u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \xB7 TAX ID \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E32\u0E02\u0E32",cols:[{th:"CODE",w:"110px",get:e=>e.code},{th:"\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",get:e=>e.name},{th:"TAX ID",w:"150px",get:e=>e.tax_id},{th:"\u0E2A\u0E32\u0E02\u0E32",w:"90px",get:e=>e.branch_code},{th:"\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48",get:e=>e.address}]}};function Wn(e,t="nj-"){Object.keys(vn).forEach(n=>{let o=e.querySelector("#"+t+n),l=o&&o.closest(".fld-inline");if(!o||!l||l.querySelector('[data-mp="'+n+'"]'))return;let a=vn[n],s=document.createElement("span");s.className="jm-mp",s.setAttribute("data-mp",n),s.innerHTML='<button type="button" class="btn btn-o btn-sm jm-mp-go" title="\u0E04\u0E49\u0E19\u0E2B\u0E32">\u{1F50D}</button><button type="button" class="btn btn-o btn-sm jm-mp-pick">\u{1F465} \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D</button>',s.querySelector(".jm-mp-go").onclick=()=>{o.focus(),o.dispatchEvent(new Event("input",{bubbles:!0}))},s.querySelector(".jm-mp-pick").onclick=async()=>{let i=await bn({title:a.title,rows:a.getItems(),keys:a.keys,cols:a.cols,placeholder:a.placeholder,manage:typeof a.manage=="function"?a.manage():null});if(i&&Y().some(d=>d.id===i.id),!!i){if(!ge(o,i)){P("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48","err");return}P("\u0E40\u0E25\u0E37\u0E2D\u0E01 "+(i.code?i.code+" \u2014 ":"")+(i.name||"")+" \u0E41\u0E25\u0E49\u0E27","ok")}},l.appendChild(s)})}function _n(e,t=null){Rt(e,{p:"nj-",charge:t})}function Qn(e,t=null){let r=Ft(e,{p:"nj-",charge:t});return t==="ADVANCE"&&e&&e.closest&&e.closest(".jm-adv-doc")?r.filter(x=>x.key!=="mode"&&x.key!=="cat"):r}function et(e,t=null){let n=Qn(e,t);if(Bt(e,n,{p:"nj-"}),!n.length)return!1;let o=n[0],l=o.kind==="sel"&&e.querySelector("#nj-"+o.key+"-btn")||o.el;try{l.scrollIntoView({block:"center"})}catch{}return l.focus&&l.focus(),P(Vt(n),"err"),!0}var st={customs_declaration_no:"#nj-decl",source_invoice_no:"#nj-srcinv",house_bl_no:"#nj-hbl",customer_job_no:"#nj-cjob"};function ok486(k){return"\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"+(k&&k.job_no?" \u2014 "+k.job_no:"")}function g486(u,d,c){if(u||!c||c.dataset.g486)return;c.dataset.g486="1";c.addEventListener("click",v=>{if(v.target===c){v.stopImmediatePropagation(),v.preventDefault();return}let x=v.target.closest&&v.target.closest("[data-close]");if(x&&c.contains(x)){let z=!1;try{z=!!d()}catch{z=!1}z&&!window.confirm("\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\n\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")&&(v.stopImmediatePropagation(),v.preventDefault())}},!0)}function br486(b){b=String(b??"").trim();return b?b==="00000"?"\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48":b:""}function rc486(p){if(!p)return;let R=()=>{let id=q(p.querySelector("#nj-cust")),c=id?((ce.masters&&ce.masters.customers)||[]).find(x=>x.id===id)||null:null;p.querySelectorAll(".jm-rcp-as").forEach(b=>{let k=[...b.querySelectorAll(".jm-rcp-as-ck")].find(x=>x.dataset.v==="\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32");if(!k)return;let m=b.querySelector(".jm-rcp-cust");if(!m){m=document.createElement("div"),m.className="jm-rcp-cust",b.appendChild(m)}if(!k.checked){m.hidden=!0,m.innerHTML="";return}m.hidden=!1,m.innerHTML=c?'<span class="jm-rcp-cust-it">\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17: <b>'+g(c.name||c.customer_name||"")+'</b></span><span class="jm-rcp-cust-it">\u0E2A\u0E32\u0E02\u0E32: <b>'+(br486(c.branch_code)?g(br486(c.branch_code)):"\u2014 (\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E43\u0E19 MASTER CUSTOMER)")+"</b></span>":'<span class="jm-rcp-cust-warn">\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19</span>'})};if(!p.dataset.rc486){p.dataset.rc486="1";let L=()=>setTimeout(R,0);p.addEventListener("change",L),p.addEventListener("input",L),p.addEventListener("click",L),p.addEventListener("focusout",L)}R()}function el(e,t){let n=t?{id:t}:{};return Object.keys(st).forEach(o=>{let l=e.querySelector(st[o]);l&&(n[o]=l.value.trim())}),n}function En(e){let t=e.querySelector("#nj-dup-alert");t&&t.remove(),e.querySelectorAll(".fld.is-dup").forEach(n=>n.classList.remove("is-dup"))}function jn(e,t){En(e);let n=document.createElement("div");n.className="jf-dup",n.id="nj-dup-alert",n.setAttribute("role","alert"),n.innerHTML='<div class="jf-dup-h">\u26A0 \u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0B\u0E49\u0E33 \u2014 \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49</div><ul class="jf-dup-l">'+t.map(l=>'<li><span class="jf-dup-f">'+g(l.label||l.field)+"</span> \u201C<b>"+g(l.value)+'</b>\u201D \u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27\u0E43\u0E19 <b class="jf-dup-j">'+(l.jobs||[]).map(g).join(" \xB7 ")+"</b></li>").join("")+"</ul>",e.insertBefore(n,e.firstChild);let o=null;t.forEach(l=>{let a=e.querySelector(st[l.field]);if(!a)return;let s=a.closest(".fld");s&&s.classList.add("is-dup"),o||(o=a)});try{n.scrollIntoView({block:"center",behavior:"smooth"})}catch{}o&&o.focus&&o.focus(),P("\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0B\u0E49\u0E33 "+t.length+" \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01","err")}function tl(e){let t=String(e&&e.message||"");if(t.indexOf("NJACC_DUPLICATE")<0)return null;let n=t.indexOf("["),o=t.lastIndexOf("]");if(n<0||o<=n)return null;try{let l=JSON.parse(t.slice(n,o+1));return Array.isArray(l)&&l.length?l:null}catch{return null}}function nl(e){let t=e.querySelector(".jm-auto");if(!t||t.querySelector("#nj-pdf-btn"))return;let n=document.createElement("button");n.type="button",n.className="btn btn-sm btn-upload-pdf-entry jm-pdf-btn",n.id="nj-pdf-btn",n.textContent="\u{1F4C4} Upload PDF Entry";let o=document.createElement("input");o.type="file",o.id="nj-pdf-file",o.accept="application/pdf,.pdf",o.hidden=!0;let l=t.querySelector(".jm-auto-cb");l?(t.insertBefore(n,l),t.insertBefore(o,l)):(t.appendChild(n),t.appendChild(o))}function ll(e){let t=e.querySelector("#nj-pdf-btn"),n=e.querySelector("#nj-pdf-file");if(!t||!n)return;let o=t.textContent;t.onclick=()=>{n.value="",n.click()},n.onchange=async()=>{let l=n.files&&n.files[0];if(l){t.disabled=!0,t.textContent="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E48\u0E32\u0E19 PDF...";try{let a=Xe(await rn(l));if(a.empty){if(t.textContent="PDF \u0E2A\u0E41\u0E01\u0E19 \u2014 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E48\u0E32\u0E19\u0E14\u0E49\u0E27\u0E22 OCR...",a=Ye(await cn(l,{onProgress:f=>{t.textContent="PDF \u0E2A\u0E41\u0E01\u0E19 \u2014 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E48\u0E32\u0E19\u0E14\u0E49\u0E27\u0E22 OCR "+Math.round(f*100)+"%"}})),a.empty){P(be.NO_TEXT,"err");return}if(a.ocrNothing){P(be.OCR_NOTHING,"err");return}}if(a.unknownType){P(be.UNKNOWN_TYPE,"err");return}let s=e.querySelector(".jm-sec.jm-doc")||e,i=await pn(e,a,{p:"nj-",confirm:f=>fn(s,"PDF \u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E1F\u0E2D\u0E23\u0E4C\u0E21 "+f.length+" \u0E0A\u0E48\u0E2D\u0E07 ("+f.map(m=>m.id.replace("nj-","")).join(", ")+") \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01 PDF \u0E41\u0E17\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?")}),d=!i.filled||i.missing.length||i.duplicates.length||i.failed.length||i.ocr;P(un(i),d?"err":"ok")}catch(a){P(dn(a),"err")}finally{t.disabled=!1,t.textContent=o,n.value=""}}}}/* V.614 : \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19 (CANCEL) \u2014 \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27 \u00B7 \u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN / ADMIN \u00B7 \u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u00B7 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23 \u00B7 \u0E40\u0E25\u0E02 JOB \u0E40\u0E14\u0E34\u0E21 (\u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25) */function oc614(e,{f:t,jobId:n,jobNo:o,onDone:l}){let a=document.getElementById("nj-modal"),s=t&&t.querySelector(".mf-left");if(!a||!s||s.querySelector("#nj-cxl"))return;let i=document.createElement("button");i.type="button",i.id="nj-cxl",i.className="btn jm-del-btn",i.title="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49 (\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27 \u00B7 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23)",i.textContent="\u26D4 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19",s.appendChild(i),i.onclick=()=>{if(a.querySelector(".jm-del-ov"))return;let d=o()||"-",f=document.createElement("div");f.className="jm-del-ov",f.setAttribute("role","dialog"),f.setAttribute("aria-modal","true"),f.innerHTML=`<div class="jm-del-box"><div class="jm-del-t">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19</div><div class="jm-del-no">JOB No. <b>${g(d)}</b></div><p class="jm-del-msg">\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E07\u0E32\u0E19\u0E08\u0E30\u0E40\u0E1B\u0E47\u0E19 CANCELED \u00B7 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23 \u00B7 \u0E40\u0E25\u0E02 JOB \u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E43\u0E0A\u0E49 \u00B7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E1C\u0E39\u0E49\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32 \u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25</p><div class="fld"><label>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 <span class="req">*</span></label><textarea class="inp w100" id="nj-cxl-rs" rows="3" placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"></textarea></div><div class="jm-del-act"><button type="button" class="btn btn-o" id="nj-cxl-no">\u0E1B\u0E34\u0E14</button><button type="button" class="btn btn-danger" id="nj-cxl-ok">\u26D4 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19</button></div></div>`,a.appendChild(f);let m=f.querySelector("#nj-cxl-rs"),S=()=>{f.remove();try{i.focus()}catch{}};try{m.focus()}catch{}f.querySelector("#nj-cxl-no").onclick=S,f.addEventListener("keydown",x=>{x.key==="Escape"&&(x.stopPropagation(),S())}),f.addEventListener("click",x=>{x.stopPropagation(),x.target===f&&S()});let b=f.querySelector("#nj-cxl-ok");b.onclick=async()=>{let x=m.value.trim();if(!x){m.classList.add("jm-del-err");try{m.focus()}catch{}return}I(b,!0);try{let r=!1;if(await pe("cancel-"+n,()=>(r=!0,CJ614(n,"CANCELED",x))),!r){I(b,!1);return}P("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19 "+d+" \u0E41\u0E25\u0E49\u0E27","ok"),l()}catch(r){I(b,!1),J(r)}}}}function ol(e,{f:t,jobId:n,jobNo:o,onDone:l}){let a=document.getElementById("nj-modal"),s=t&&t.querySelector(".mf-left");if(!a||!s||s.querySelector("#nj-del"))return;let i=document.createElement("button");i.type="button",i.id="nj-del",i.className="btn jm-del-btn",i.title="\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E16\u0E32\u0E27\u0E23",i.textContent="\u{1F5D1} \u0E25\u0E1A\u0E07\u0E32\u0E19",s.appendChild(i),i.onclick=()=>{if(a.querySelector(".jm-del-ov"))return;let d=o()||"(\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02)",f=document.createElement("div");f.className="jm-del-ov",f.setAttribute("role","dialog"),f.setAttribute("aria-modal","true"),f.innerHTML=`<div class="jm-del-box">
        <div class="jm-del-t">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E07\u0E32\u0E19</div>
        <div class="jm-del-no">JOB No. <b>${g(d)}</b></div>
        <p class="jm-del-msg">\u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E01\u0E47\u0E1A snapshot \u0E44\u0E27\u0E49\u0E43\u0E19 Audit Log)</p>
        <div class="fld"><label>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 <span class="req">*</span></label>
          <textarea class="inp w100" id="nj-del-rs" rows="3" placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E25\u0E1A"></textarea></div>
        <div class="jm-del-act">
          <button type="button" class="btn btn-o" id="nj-del-no">\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
          <button type="button" class="btn btn-danger" id="nj-del-ok">\u{1F5D1} \u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23</button>
        </div></div>`,a.appendChild(f);let m=f.querySelector("#nj-del-rs"),S=()=>{f.remove();try{i.focus()}catch{}};try{m.focus()}catch{}f.querySelector("#nj-del-no").onclick=S,f.addEventListener("keydown",x=>{x.key==="Escape"&&(x.stopPropagation(),S())}),f.addEventListener("click",x=>{x.stopPropagation(),x.target===f&&S()});let b=f.querySelector("#nj-del-ok");b.onclick=async()=>{let x=m.value.trim();if(!x){m.classList.add("jm-del-err");try{m.focus()}catch{}return}I(b,!0);try{let r=!1;if(await pe("delete-"+n,()=>(r=!0,kt(n,x))),!r){I(b,!1);return}P("\u0E25\u0E1A\u0E07\u0E32\u0E19 "+d+" \u0E41\u0E25\u0E49\u0E27","ok"),l()}catch(r){I(b,!1),J(r)}}}}async function tt({charge:e,group:t,mode:n,jobId:o,copyFromId:l,draft:a,focusPost:s,onSaved:i}){let d=n==="accounting",f=o||l||!ce.masters?Le({title:d?o?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19":"\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48":"DOCUMENT \u2014 "+e,body:'<div class="load-row" aria-busy="true" aria-label="\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14">'+Array.from({length:6},()=>'<div class="skel" style="height:34px;margin:0 0 12px"></div>').join("")+"</div>",fullscreen:!0,wide:!0,cls:"modal-flow"+(d?"":" jm-noh jm-hd")+(!d&&e==="ADVANCE"?" jm-adv-doc":"")}):null,m=()=>!!f&&document.getElementById("nj-modal")!==f,S=()=>{f&&!m()&&le()},b=X(),x=o||l?Me(o||l):null;x&&x.catch(()=>{});try{await b}catch(v){throw S(),v}if(m())return;let r=null;if(o){try{r=await x}catch(w){throw S(),w}if(m())return;let v=!!r.returned_at&&String(r.operational_status||"")!=="CLOSE";if(r.invoice_id&&!v){S(),P("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07 Void INVOICE \u0E01\u0E48\u0E2D\u0E19","err");return}e=r.charge_type,t=r.company_group}else if(l){let v;try{v=await x}catch(w){throw S(),w}if(m())return;e=v.charge_type,t=v.company_group,r=Xn(v)}else a&&(r=a);let _=!!o,E=o&&r&&r.updated_at||null,h=!_&&(!!l||!!a),j=r&&r.document_status||null;_||lt();let u=n==="accounting",$=gn,y=(v,w)=>v&&v[w]===!0?"checked":"",c=v=>p.querySelector(v)||(document.getElementById("nj-modal")||document).querySelector(v),C=r&&r.reference_date||ee(new Date),D=_||h?r&&(r.job_date||r.reference_date)||"":ee(new Date),p=document.createElement("div"),A=`<label class="jm-cb"><input type="checkbox" id="nj-exempt" ${y(r,"doc_exempt")}><span>\u0E22\u0E01\u0E40\u0E27\u0E49\u0E19</span></label><label class="jm-cb"><input type="checkbox" id="nj-inspect" ${y(r,"doc_inspect")}><span>\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E23\u0E27\u0E08</span></label>`,R=`<label class="jm-cb"><input type="checkbox" id="nj-fcl" ${y(r,"cargo_fcl")}><span>FCL</span></label><label class="jm-cb"><input type="checkbox" id="nj-lcl" ${y(r,"cargo_lcl")}><span>LCL</span></label><label class="jm-cb"><input type="checkbox" id="nj-fz" ${y(r,"cargo_fz")}><span>FZ</span></label><label class="jm-cb"><input type="checkbox" id="nj-fzfz" ${y(r,"cargo_fz_fz")}><span>FZ+FZ</span></label>`,U=`<label class="jm-cb"><input type="checkbox" id="nj-fee" ${y(r,"doc_fee")}><span>\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21</span></label>`,ve=u?A+R:A+`<span class="jm-cargo" id="nj-cargo">${R}</span>`+U;p.innerHTML=`${_t("nj-sync")}
    <div class="jm-auto${u?"":" jm-auto-wrap"}">
      ${u?`<span class="jm-auto-lb">${e==="ADVANCE"?"AD:":"JOB NJ:"}</span>
      <input class="inp" id="nj-autono" value="${r&&r.job_no?g(r.job_no):$}" readonly disabled>
      <span class="jm-auto-lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</span>
      <input class="inp jm-auto-date" type="date" id="nj-jobdate" value="${D}">`:""}
      
      ${u?`<span class="jm-auto-lb">\u0E42\u0E2B\u0E21\u0E14</span>
      <select class="sel jm-auto-mode" id="nj-mode">
        <option value="">${Pt}</option>
        ${Zn(r&&r.data_type||"")}
      </select>`:It(r,{receiptBox:!0,form615:e==="SERVICE"})}
    </div>

    <div class="jm-sec jm-doc">
      <div class="jm-sec-t">DOCUMENT</div>
      
      ${u?`
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</label>
          <div class="fld-inline">
            ${Ee("nj-comp",Y(),r&&r.company_invoice_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}
            ${de()?'<button type="button" class="jm-link" data-master="companies">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>':""}
          </div></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
          <input class="inp" id="nj-decl" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32" value="${r?g(r.customs_declaration_no||""):""}"></div>
        <div class="fld"><label>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</label>
          <input class="inp" id="nj-srcinv" placeholder="\u0E01\u0E23\u0E2D\u0E01 Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07" value="${r?g(r.source_invoice_no||""):""}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="nj-hbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 House B/L No." value="${r?g(r.house_bl_no||""):""}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="nj-mbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 Master B/L No." value="${r?g(r.master_bl_no||""):""}"></div>
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="nj-book" placeholder="\u0E01\u0E23\u0E2D\u0E01 Booking No." value="${r?g(r.booking_no||""):""}"></div>
        
        <div class="fld"><label>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49</label>
          <input class="inp" type="number" min="0" id="nj-qtyc" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49" value="${r&&r.qty_container!=null?r.qty_container:""}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>ETD</label><input class="inp" type="date" id="nj-etd" value="${r&&r.etd||""}"></div>
        <div class="fld"><label>ETA</label><input class="inp" type="date" id="nj-eta" value="${r&&r.eta||""}"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label><input class="inp" type="date" id="nj-dlv" value="${r&&r.delivery_date||""}"></div>
        <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <textarea class="inp" id="nj-note" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38">${r?g(r.note||""):""}</textarea></div>
      </div>


      <div class="jm-grid">
        <div class="fld"><label class="jm-cb">
            <input type="checkbox" id="nj-lift-f" ${y(r,"lift_on_wharf_flag")}>
            <span>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 LIFT ON / WHARF \u0E15\u0E32\u0E21</span></label>
          <input class="inp" id="nj-lift-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 LIFT ON / WHARF"
            value="${r?g(r.lift_on_wharf_note||""):""}"></div>
        <div class="fld"><label class="jm-cb">
            <input type="checkbox" id="nj-stor-f" ${y(r,"storage_charge_flag")}>
            <span>\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E04\u0E48\u0E32 STORAGE CHARGE \u0E15\u0E32\u0E21</span></label>
          <input class="inp" id="nj-stor-n" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 STORAGE CHARGE"
            value="${r?g(r.storage_charge_note||""):""}"></div>
        
      </div>

      <div class="jm-cb-row jm-cb-row-wide">${ve}</div>

      <div class="jm-grid jm-grid-2">
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
          <div class="fld-inline">
            ${Ee("nj-cust",oe(),r&&r.customer_id||"","\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32",De)}
            ${de()?'<button type="button" class="jm-link" data-master="customers">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>':""}
          </div></div>
      </div>
      
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="nj-cjob" placeholder="\u0E01\u0E23\u0E2D\u0E01 Customer Job No." value="${r?g(r.customer_job_no||""):""}"></div>
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>
          <input class="inp" id="nj-vessel" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel" value="${r?g(r.vessel_name||""):""}"></div>
        <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
          <input class="inp" type="number" min="0" id="nj-term" placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32" value="${r&&r.credit_term_days!=null?r.credit_term_days:""}"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="nj-due" value="${r&&r.due_date||""}"></div>
        
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</label>
          <input class="inp" type="date" id="nj-invdate" value="${r&&r.invoice_date||""}"></div>
      </div>
      <div class="jm-hint" id="nj-due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>`:Mt(r,{receiptBox:!0,custName:!0,cnt606:!0,ch619:e})}
    </div>
    </div>

    ${u?`<div class="jm-sec jm-acc">
      <div class="jm-sec-t">ACCOUNTING</div>
      <div class="jm-grid">
        <div class="fld"><label>Case</label>
          <input class="inp" id="nj-case" placeholder="\u0E01\u0E23\u0E2D\u0E01 Case" value="${r?g(r.case_no||""):""}"></div>
        <div class="fld"><label>Contact</label>
          <input class="inp" id="nj-contact" placeholder="\u0E01\u0E23\u0E2D\u0E01 Contact" value="${r?g(r.contact||""):""}"></div>
        
      </div>
    </div>`:""}`;let W=document.createElement("div");W.innerHTML=`<div class="mf-left">
      
      
    </div>
    <div class="mf-right">
      ${!u&&e==="SERVICE"&&o?'<button class="btn btn-o" id="nj-copy">\u{1F4CB} COPY</button>':""}${!u&&e==="SERVICE"&&o&&CAN575("create")?'<button class="btn btn-o" id="nj-copyad" title="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E1B\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 DOCUMENT \u2014 ADVANCE">\u{1F4C4} COPY AD</button>':""}
      
      
      ${u?"":'<button class="btn btn-green" id="nj-preview">\u{1F5A8} Print Preview</button>'}${!u&&e==="ADVANCE"&&o&&CAN575("create")?'<button class="btn btn-o" id="nj-copyjob" title="\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E1B\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E07\u0E32\u0E19 ADVANCE \u0E43\u0E2B\u0E21\u0E48">\u{1F4CB} COPY JOB</button>':""}
      <button class="btn ${u?"btn-o":"btn-danger"}" data-close>${u?"\u2715 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01":"\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"}</button>
      <button class="btn btn-p" id="nj-save">\u{1F4BE} ${u?"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19":"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"}</button>
      ${!u&&e==="SERVICE"?`<button class="btn btn-p" id="nj-post"${o&&j==="DRAFT"?"":' disabled title="\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E44\u0E14\u0E49"'}>\u2B06 POST</button>`:""}
    </div>`;let _e=u?"":`
      <span class="jm-auto-lb">${e==="ADVANCE"?"AD:":"JOB NJ:"}</span>
      <input class="inp jm-hd-no" id="nj-autono" value="${r&&r.job_no?g(r.job_no):$}" readonly disabled>
      <span class="jm-auto-lb">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</span>
      <input class="inp jm-hd-date" type="date" id="nj-jobdate" value="${D}">`;if(g486(u,()=>te,Le({title:u?_?"\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19":"\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48":"DOCUMENT \u2014 "+e,body:p,footer:W,headExtra:_e,fullscreen:!0,wide:!0,cls:"modal-flow"+(u?"":" jm-noh jm-hd")+(!u&&e==="ADVANCE"?" jm-adv-doc":"")})),!u&&!o){let v=p.querySelector("#nj-due-pv");v&&(v.hidden=!0)}/* V.614 : \u0E25\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST (\u0E17\u0E38\u0E01 Role \u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32 DOCUMENT \u0E44\u0E14\u0E49) \u00B7 POST \u0E41\u0E25\u0E49\u0E27 = \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19 (SUPER_ADMIN / ADMIN) */!u&&o&&r&&!r.invoice_id&&(r.document_status==="POSTED"||r.job_no)&&r.operational_status!=="CANCELED"&&MA575("DOCUMENT")&&(ROLE546()==="SUPER_ADMIN"||ROLE546()==="ADMIN")&&oc614(p,{f:W,jobId:o,jobNo:()=>((c("#nj-autono")||{}).value||"").trim(),onDone:()=>{le(),typeof i=="function"&&i()}}),!u&&o&&r&&!r.invoice_id&&r.document_status!=="POSTED"&&!r.job_no&&MA575("DOCUMENT")&&ol(p,{f:W,jobId:o,jobNo:()=>((c("#nj-autono")||{}).value||"").trim(),onDone:()=>{le(),typeof i=="function"&&i()}}),yt(p),u||rc486(p);/* V.614 : \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 \u0E41\u0E01\u0E49\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u00B7 Role \u0E2D\u0E37\u0E48\u0E19 = Read Only (\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 = \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19) */try{let jd614=c("#nj-jobdate");jd614&&ROLE546()!=="SUPER_ADMIN"&&(_||(jd614.value=ee(new Date)),jd614.readOnly=!0,jd614.setAttribute("aria-readonly","true"),jd614.classList.add("jm614-ro"),jd614.title="\u0E41\u0E01\u0E49\u0E44\u0E02\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN",jd614.style.cursor="not-allowed")}catch{}let te=!1,at=()=>{te=!0};p.addEventListener("input",at),p.addEventListener("change",at),jt(p.querySelector("#nj-sync"),()=>_?o:null,()=>{le(),tt({charge:e,group:t,mode:n,jobId:o,onSaved:i}).catch(J)},()=>te),me(p,"nj-mode"),me(p,"nj-cat"),me(p,"nj-agency"),me(p,"nj-permit"),Lt(p,"nj-relport"),RP589(p,"nj-relport"),Ve(p,"nj-agency"),Ve(p,"nj-permit"),qt(p,{p:"nj-"});let ne=p.querySelector("#nj-cargo"),kn=["#nj-fcl","#nj-lcl","#nj-fz","#nj-fzfz"],xn=()=>kn.map(v=>p.querySelector(v)).filter(Boolean),rt=()=>xn().some(v=>v.checked),wn=()=>{ne&&ne.classList.remove("is-err")};ne&&ne.addEventListener("change",v=>{let w=v.target;if(!w||w.type!=="checkbox")return;let O={"nj-fcl":"nj-lcl","nj-lcl":"nj-fcl","nj-fz":"nj-fzfz","nj-fzfz":"nj-fz"},F=O[w.id]?p.querySelector("#"+O[w.id]):null;w.checked&&F&&(F.checked=!1),rt()&&wn()});let T=v=>{let w=c(v);return w?(w.value||"").trim():""},N=v=>{let w=c(v);return!!(w&&w.checked)},Q=(v,w,O,F)=>{let G=Se(p,"nj-",v);if(G===void 0)return;let Z=p.querySelector(w);return Z&&Z.checked?G:r&&r[O]!==!0&&r[F]?void 0:null};function Cn(){return{job_no:"",data_type:T("#nj-mode")||null,agency_via:T("#nj-agency")||null,agency_via_other:Fe(T("#nj-agency"))&&T("#nj-agency-other")||null,customer_name:Gn(c("#nj-cust"))||"",company_invoice:fe(c("#nj-comp"))||"",customer_job_no:T("#nj-cjob")||null,customs_declaration_no:T("#nj-decl")||null,qty_container:T("#nj-qtyc")||null,cs_name:null,release_date:null,job_date:T("#nj-jobdate")||null,company_invoice_id:q(c("#nj-comp"))||null,customer_id:q(c("#nj-cust"))||null,source_invoice_no:T("#nj-srcinv")||null,house_bl_no:T("#nj-hbl")||null,master_bl_no:T("#nj-mbl")||null,booking_no:T("#nj-book")||null,vessel_name:T("#nj-vessel")||null,etd:T("#nj-etd")||null,eta:T("#nj-eta")||null,delivery_date:T("#nj-dlv")||null,note:T("#nj-note")||null,case_no:T("#nj-case")||null,contact:T("#nj-contact")||null,credit_term_days:T("#nj-term")||null,due_date:T("#nj-due")||null,invoice_date:T("#nj-invdate")||null,doc_exempt:N("#nj-exempt"),doc_inspect:N("#nj-inspect"),doc_fee:N("#nj-fee"),cargo_fcl:N("#nj-fcl"),cargo_lcl:N("#nj-lcl"),cargo_fz:N("#nj-fz"),cargo_fz_fz:N("#nj-fzfz"),doc_overtime:N("#nj-ovt"),doc_mass:N("#nj-mass"),doc_travel:N("#nj-travel"),doc_print:N("#nj-print"),doc_labor:N("#nj-labor"),doc_ot_nj:N("#nj-otnj"),doc_0409_cust:N("#nj-c0409"),doc_0409_nocollect:N("#nj-n0409"),import_port:T("#nj-port")||null,lift_on_wharf_flag:N("#nj-lift-f"),lift_on_wharf_note:Se(p,"nj-","lift-as")!==void 0?Q("lift-as","#nj-lift-f","lift_on_wharf_flag","lift_on_wharf_note")===void 0?r.lift_on_wharf_note:Q("lift-as","#nj-lift-f","lift_on_wharf_flag","lift_on_wharf_note"):T("#nj-lift-n")||r&&r.lift_on_wharf_note||null,storage_charge_flag:N("#nj-stor-f"),storage_charge_note:Se(p,"nj-","stor-as")!==void 0?Q("stor-as","#nj-stor-f","storage_charge_flag","storage_charge_note")===void 0?r.storage_charge_note:Q("stor-as","#nj-stor-f","storage_charge_flag","storage_charge_note"):T("#nj-stor-n")||r&&r.storage_charge_note||null,release_port:T("#nj-relport")||null,release_port_other:Re(T("#nj-relport"))&&T("#nj-relport-other")||null,truck_card_flag:!!(r&&r.truck_card_flag),truck_card_no:r&&r.truck_card_no||null,truck_card_contact:r&&r.truck_card_contact||null,overtime_flag:!!(r&&r.overtime_flag),overtime_date:r&&r.overtime_date||null,overtime_slot_1:!!(r&&r.overtime_slot_1),overtime_slot_2:!!(r&&r.overtime_slot_2),overtime_slot_3:!!(r&&r.overtime_slot_3),...ye?ye.value():{}}}let re=W.querySelector("#nj-preview");re&&(re.onclick=async()=>{let v=o?null:Cn(),w=o?{charge:e,group:t,mode:n,jobId:o,onSaved:i}:{charge:e,group:t,mode:n,onSaved:i,draft:v};try{e==="ADVANCE"&&AD698.carry(p,o||null);await(await import("./job-form-doc-S2SFOC6V.js")).openJobFormPreview({id:o||null,data:v,onBack:()=>{e==="ADVANCE"&&AD698.keep();tt(w).catch(J)}})}catch(O){J(O)}});ST572(),ST573();let je=W.querySelector("#nj-copy");je&&(je.onclick=()=>{tt({charge:e,group:t,mode:n,copyFromId:o,onSaved:i}).catch(J)});ST644();let ad644=W.querySelector("#nj-copyad");ad644&&(ad644.onclick=()=>{CA644({btn:ad644,root:p,dirty:()=>te,jobId:o,group:t,mode:n,onSaved:i}).catch(J)});let cj649=W.querySelector("#nj-copyjob");cj649&&(ST649(),cj649.onclick=()=>{CJ649({btn:cj649,root:p,dirty:()=>te,jobId:o,group:t,mode:n,onSaved:i}).catch(J)});let H=W.querySelector("#nj-post");H&&s&&!H.disabled&&setTimeout(()=>{try{H.scrollIntoView({block:"nearest"}),H.focus({preventScroll:!0})}catch{}},0),H&&(H.onclick=async v=>{if(!o){P("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E44\u0E14\u0E49","err");return}if(j!=="DRAFT"){P("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27","err");return}if(!(!u&&(Ce(p),et(p,e))||!await ht("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19 (POST)",'\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E1B\u0E47\u0E19 <b>POSTED</b><br><span class="t-xs t-3">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E19\u0E33\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E0B\u0E49\u0E33</span>',"\u2B06 POST"))){I(v.target,!0);try{let O=await pe("post-job-"+o,()=>wt(o,Ie()));if(O===null){I(v.target,!1);return}j="POSTED";let F=c("#nj-autono");F&&O&&O.job_no&&(F.value=O.job_no),H.disabled=!0,H.title="\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27",P("\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27 \u2014 "+(O&&O.job_no?O.job_no:""),"ok"),i&&i()}catch(O){J(O,"\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"),I(v.target,!1)}}});let Dn=()=>X(!0);let SFK=u?null:SF551.pickers(p,"nj-",{onCust:()=>{Ae(),rc486(p)}});u&&ke(p,"nj-comp",{getItems:Y,...u?{}:{searchFirst:!0,radio:!0,codeFirst:!0,limit:20,wide:!0,onChange:()=>it(),searchHint:"\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE \u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32"},canCreate:u?Ne():!1,onCreate:async v=>{try{let w=await qe({company_name:v});return await Dn(),P("\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice \u201C"+v+"\u201D \u0E41\u0E25\u0E49\u0E27","ok"),w}catch(w){return J(w),null}}});let it=u?()=>{}:SFK.comp;it(),u&&ke(p,"nj-cust",hn(u,()=>{Ae(),Sn(),u||rc486(p)}));let Sn=u?()=>{}:SFK.cust;u?_n(p):(nl(p),ll(p),_n(p,e));let ye=u?null:St(p,r),ly541=!u&&e==="SERVICE"&&LY543(p,r),ly546=!u&&e==="SERVICE"&&LY546(p,r),ly542=!u&&e==="ADVANCE"&&LY542(p,r),ly548a=!u&&e==="ADVANCE"&&LY548A(p,r),sz562=!u&&e==="ADVANCE"&&SZ562(p),hd563=!u&&HD563(p,e),mv581=!u&&MV581(p,e),ro620=!u&&RO620(p),ad698=e==="ADVANCE"&&AD698.mount(p,"nj-",{jobId:o||null,jobNo:r&&r.job_no||""}),ct=()=>{let v=(ce.masters.customers||[]).find(w=>w.id===q(c("#nj-cust")));return v?v.credit_term_days:null};function Ae(){let v=c("#nj-due-pv");if(!v)return;let w=c("#nj-due").value;if(w){v.textContent="Due Date: "+ue(w)+" (\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07)",delete v.dataset.calc;return}let O=C,F=c("#nj-term").value!==""?Number(c("#nj-term").value):ct();if(O&&F!=null){let G=new Date(O+"T00:00:00");G.setDate(G.getDate()+Number(F)),v.textContent="Due Date (\u0E04\u0E33\u0E19\u0E27\u0E13): "+ue(ee(G))+" \xB7 \u0E40\u0E17\u0E2D\u0E21 "+F+" \u0E27\u0E31\u0E19",v.dataset.calc=ee(G)}else v.textContent="\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date",delete v.dataset.calc}["#nj-term","#nj-due"].forEach(v=>{let w=c(v);w&&w.addEventListener("input",Ae)}),Ae(),p.addEventListener("click",v=>{let w=v.target.closest("[data-master]");w&&(le(),location.hash=w.dataset.master==="customers"?"#/settings/customers":"#/masters?tab="+w.dataset.master)}),W.querySelector("#nj-save").onclick=async v=>{Ce(p);let w=!1,O=c("#nj-cust");if(u){if(!xe(q(O))&&fe(O))we(O,"\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"),w=!0;else if(et(p))return}else if(et(p,e))return;if(ne&&!rt()&&!(!u&&e==="ADVANCE")){ne.classList.add("is-err");try{ne.scrollIntoView({block:"center",behavior:"smooth"})}catch{}let k=p.querySelector("#nj-fcl");k&&k.focus&&k.focus(),P("\u26A0 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19 FCL, LCL, FZ \u0E2B\u0E23\u0E37\u0E2D FZ+FZ \u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19","err");return}if(w){P("\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01","err");return}if(En(p),!u){let k=null;try{k=await Dt({...el(p,_?o:null),charge_type:e})}catch{k=null}if(k&&k.ok===!1&&Array.isArray(k.dups)&&k.dups.length){jn(p,k.dups);return}}let F=c("#nj-due-pv"),G=u?{case_no:c("#nj-case").value.trim()||null,contact:c("#nj-contact").value.trim()||null,credit_term_days:c("#nj-term").value!==""?Number(c("#nj-term").value):ct(),due_date:c("#nj-due").value||F.dataset.calc||null,invoice_date:c("#nj-invdate").value||null}:{},Z=k=>_&&r&&r[k]!=null?r[k]:null,Tn=u?{}:{credit_term_days:c("#nj-term")?c("#nj-term").value!==""?Number(c("#nj-term").value):null:Z("credit_term_days"),due_date:c("#nj-due")?c("#nj-due").value||null:Z("due_date"),...c("#nj-invdate")?{invoice_date:c("#nj-invdate").value||null}:{},case_no:Z("case_no"),contact:Z("contact"),cs_name:Z("cs_name"),i_billing_apl:Z("i_billing_apl")},dt={..._?{id:o}:{},charge_type:e,company_group:t,data_type:c("#nj-mode").value||null,reference_date:C,reference_no:r&&r.reference_no||null,...(ROLE546()==="SUPER_ADMIN"||!_?{job_date:c("#nj-jobdate").value||null}:{}),company_invoice_id:q(c("#nj-comp"))||null,customer_id:q(c("#nj-cust")),customer_job_no:c("#nj-cjob").value.trim()||null,customs_declaration_no:c("#nj-decl").value.trim()||null,source_invoice_no:c("#nj-srcinv").value.trim()||null,house_bl_no:c("#nj-hbl").value.trim()||null,master_bl_no:c("#nj-mbl").value.trim()||null,booking_no:c("#nj-book").value.trim()||null,vessel_name:c("#nj-vessel")?c("#nj-vessel").value.trim()||null:r&&r.vessel_name||null,qty_container:c("#nj-qtyc").value!==""?Number(c("#nj-qtyc").value):null,etd:c("#nj-etd").value||null,eta:c("#nj-eta").value||null,delivery_date:c("#nj-dlv").value||null,note:c("#nj-note").value.trim()||null,...G,...Tn,..._&&E?{expected_updated_at:E}:{}};NB547(p)&&(delete dt.credit_term_days,delete dt.due_date,delete dt.invoice_date),_||(dt.request_id=yn());let L=k=>!!c(k).checked,ut=(k,K)=>c(k)?{[K]:c(k).value.trim()||null}:{},On={lift_on_wharf_flag:L("#nj-lift-f"),...ut("#nj-lift-n","lift_on_wharf_note"),storage_charge_flag:L("#nj-stor-f"),...ut("#nj-stor-n","storage_charge_note"),...Q("lift-as","#nj-lift-f","lift_on_wharf_flag","lift_on_wharf_note")!==void 0?{lift_on_wharf_note:Q("lift-as","#nj-lift-f","lift_on_wharf_flag","lift_on_wharf_note")}:{},...Q("stor-as","#nj-stor-f","storage_charge_flag","storage_charge_note")!==void 0?{storage_charge_note:Q("stor-as","#nj-stor-f","storage_charge_flag","storage_charge_note")}:{},...c("#nj-relport")?{release_port:c("#nj-relport").value||null,release_port_other:Re(c("#nj-relport").value)&&(c("#nj-relport-other").value||"").trim()||null}:{},doc_exempt:L("#nj-exempt"),doc_inspect:L("#nj-inspect"),cargo_fcl:L("#nj-fcl"),cargo_lcl:L("#nj-lcl"),cargo_fz:L("#nj-fz"),cargo_fz_fz:L("#nj-fzfz"),...u?{}:{...XV619(k619=>c("#nj-"+k619)),release_date:c("#nj-rel").value||null,import_port:c("#nj-port").value.trim()||null,doc_fee:L("#nj-fee"),doc_overtime:L("#nj-ovt"),doc_mass:L("#nj-mass"),doc_travel:L("#nj-travel"),doc_print:L("#nj-print"),doc_labor:L("#nj-labor"),doc_ot_nj:L("#nj-otnj"),doc_0409_cust:L("#nj-c0409"),doc_0409_nocollect:L("#nj-n0409"),job_category:FC620(c("#nj-cat").value,c("#nj-cat-other"))/* V.615 → V.620 FC620 */,agency_via:c("#nj-agency").value||null,agency_via_other:Fe(c("#nj-agency").value)&&c("#nj-agency-other").value.trim()||null,permit_name:c("#nj-permit").value||null,permit_name_other:c("#nj-permit").value===Ot&&c("#nj-permit-other").value.trim()||null},...ye?ye.value():{}};I(v.target,!0);try{_&&he(o);let k=await pe(_?"edit-job-"+o:"save-job",()=>Ct({job:dt,doc:On}));if(k===null){I(v.target,!1);return}_||lt(),E=k&&k.job_updated_at||null,te=!1,he(k&&k.id||o);e==="ADVANCE"&&await AD698.after(p,k&&k.id||o);let K=c("#nj-autono");if(K&&k&&k.job_no&&(K.value=k.job_no),!_&&k&&k.id&&(_=!0,o=k.id),k&&k.document_status&&(j=k.document_status),H){let ft=!!o&&j==="DRAFT";H.disabled=!ft,ft&&H.removeAttribute("title")}je&&(je.disabled=!o),re&&o&&(re.disabled=!1,re.removeAttribute("title"));let pt=k&&k.id||o;pt&&he(pt),P(!u?ok486(k):_?"\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27"+(k&&k.job_no?" \u2014 "+k.job_no:""):"\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E49\u0E27"+(k&&k.job_no?" \u2014 "+k.job_no:""),"ok"),I(v.target,!1),typeof i=="function"&&i()}catch(k){let K=tl(k);if(K){jn(p,K),I(v.target,!1);return}J(k),I(v.target,!1)}}}/* V.541 \u00B7 DOCUMENT \u2014 SERVICE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E08\u0E31\u0E14\u0E27\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E43\u0E2B\u0E21\u0E48 \u2014 \u0E22\u0E49\u0E32\u0E22 Element \u0E40\u0E14\u0E34\u0E21 (id / \u0E04\u0E48\u0E32 / Event / Validation \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14) \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E0A\u0E48\u0E2D\u0E07
   1 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 (\u0E1F\u0E49\u0E32\u0E2D\u0E48\u0E2D\u0E19) : \u0E42\u0E2B\u0E21\u0E14* \u00B7 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17* \u00B7 \u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 \u00B7 \u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u00B7 \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 / \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17* \u00B7 \u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32* \u00B7 Invoice No.* \u00B7 House B/L No.* / Master B/L No.* \u00B7 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32* \u00B7 Customer Job No.*
   2 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 (\u0E40\u0E17\u0E32\u0E2D\u0E48\u0E2D\u0E19) : Checkbox \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u00B7 3 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E02\u0E19\u0E2A\u0E48\u0E07 \u00B7 4 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Upload PDF Entry \u0E44\u0E1B\u0E2D\u0E22\u0E39\u0E48\u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27
   \u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E14\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38 \u2192 \u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E17\u0E49\u0E32\u0E22\u0E01\u0E25\u0E38\u0E48\u0E21 4 (\u0E44\u0E21\u0E48\u0E17\u0E34\u0E49\u0E07) */
function LY541(p) {
  try {
    var q = function (s) { return p.querySelector(s); },
      F = function (id) { var x = p.querySelector("#" + id); return x ? x.closest(".fld") : null; },
      au = q(".jm-auto"), cb = au && au.querySelector(".jm-auto-cb"), doc = q(".jm-sec.jm-doc"), md = p.closest(".modal");
    if (!au || !cb || !doc || !md || md.classList.contains("jm541")) return;
    md.classList.add("jm541");
    md.parentElement && md.parentElement.classList.add("jm541-bk");
    var el = function (cls, html) { var d = document.createElement("div"); d.className = cls; if (html) d.innerHTML = html; return d; },
      grid = function (cls, ids) { var g = el("jm-grid " + cls); ids.forEach(function (id) { var f = F(id); f && g.appendChild(f); }); return g; },
      ttl = function (n, t) { return el("jm541-t", '<span class="jm541-n">' + n + "</span>" + t); };
    /* \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 : Upload PDF Entry (\u0E1B\u0E38\u0E48\u0E21/Input \u0E40\u0E14\u0E34\u0E21) */
    var hx = md.querySelector(".modal-h-x"), pb = q("#nj-pdf-btn"), pf = q("#nj-pdf-file");
    if (hx && pb) { hx.appendChild(pb); pf && hx.appendChild(pf); }
    /* \u0E41\u0E16\u0E27 1 : \u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48 \u0E1B\u0E49\u0E32\u0E22 + \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 (+ \u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2D\u0E07) \u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 */
    au.removeChild(cb);
    var cur = null, kids = Array.prototype.slice.call(au.children);
    kids.forEach(function (c) {
      if (c.classList.contains("jm-auto-lb")) { cur = el("fld jm541-f"); au.appendChild(cur); cur.appendChild(c); }
      else if (cur && c !== pb && c !== pf) cur.appendChild(c);
    });
    au.classList.add("jm541-r1");
    /* \u0E01\u0E25\u0E38\u0E48\u0E21 1 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 */
    var g1 = el("jm541-g jm541-open");
    g1.appendChild(ttl(1, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"));
    au.parentNode.insertBefore(g1, au);
    g1.appendChild(au);
    g1.appendChild(grid("jm541-r2", ["nj-comp", "nj-decl", "nj-srcinv", "nj-hbl"]));
    var r3 = grid("jm541-r2 jm541-r3", ["nj-mbl", "nj-cust", "nj-cjob"]);
    g1.appendChild(r3);
    /* \u0E01\u0E25\u0E38\u0E48\u0E21 2 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 : Checkbox \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 */
    var g2 = el("jm541-g jm541-cb");
    g2.appendChild(cb);
    /* \u0E01\u0E25\u0E38\u0E48\u0E21 3 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E02\u0E19\u0E2A\u0E48\u0E07 (\u0E01\u0E25\u0E48\u0E2D\u0E07 DOCUMENT \u0E40\u0E14\u0E34\u0E21) */
    var oldGrids = Array.prototype.slice.call(doc.querySelectorAll(".jm-grid")),
      t0 = doc.querySelector(".jm-sec-t");
    var g3a = grid("jm541-r4", ["nj-book", "nj-qtyc", "nj-eta", "nj-etd"]),
      g3b = grid("jm541-r4", ["nj-rel", "nj-dlv", "nj-port", "nj-relport"]);
    /* \u0E01\u0E25\u0E38\u0E48\u0E21 4 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 */
    var g4 = el("jm-sec jm541-g jm541-more");
    g4.appendChild(ttl(4, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"));
    g4.appendChild(grid("jm541-r4", ["nj-vessel", "nj-term", "nj-due", "nj-invdate"]));
    g4.appendChild(grid("jm541-r1c", ["nj-note"]));
    /* \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E44\u0E27\u0E49 (\u0E16\u0E49\u0E32\u0E21\u0E35) \u2192 \u0E17\u0E49\u0E32\u0E22\u0E01\u0E25\u0E38\u0E48\u0E21 4 \u00B7 \u0E44\u0E21\u0E48\u0E17\u0E34\u0E49\u0E07 */
    var rest = el("jm-grid jm541-r4 jm541-rest");
    oldGrids.forEach(function (g) {
      Array.prototype.slice.call(g.children).forEach(function (c) { rest.appendChild(c); });
      g.parentNode && !g.children.length && g.parentNode.removeChild(g);
    });
    rest.children.length && g4.appendChild(rest);
    Array.prototype.slice.call(doc.children).forEach(function (c) { if (c !== t0) g4.appendChild(c); });
    if (t0) { t0.className = "jm541-t"; t0.innerHTML = '<span class="jm541-n">3</span>\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E02\u0E19\u0E2A\u0E48\u0E07'; }
    else doc.insertBefore(ttl(3, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E02\u0E19\u0E2A\u0E48\u0E07"), doc.firstChild);
    doc.classList.add("jm541-g", "jm541-doc");
    doc.appendChild(g3a); doc.appendChild(g3b);
    g1.parentNode.insertBefore(g2, g1.nextSibling);
    doc.parentNode.insertBefore(g4, doc.nextSibling);
    g2.insertBefore(ttl(2, "\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22 / \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21"), cb);
  } catch (e) { try { console.warn("LY541", e); } catch (_e) {} }
}

/* V.542 \u2192 V.551 \u00B7 DOCUMENT \u2014 ADVANCE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E08\u0E31\u0E14\u0E27\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E43\u0E2B\u0E21\u0E48 \u2014 \u0E22\u0E49\u0E32\u0E22 Element \u0E40\u0E14\u0E34\u0E21 (id / \u0E04\u0E48\u0E32 / Event / Validation / Mapping \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14) \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E0A\u0E48\u0E2D\u0E07
   \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 (\u0E23\u0E2D\u0E43\u0E2B\u0E49\u0E0A\u0E48\u0E2D\u0E07 AD / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 \u0E16\u0E39\u0E01\u0E43\u0E2A\u0E48\u0E01\u0E48\u0E2D\u0E19) : \u0E01\u0E32\u0E23\u0E4C\u0E14 AD \u00B7 \u0E01\u0E32\u0E23\u0E4C\u0E14\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 \u00B7 badge \u00B7 Upload PDF Entry (\u0E1B\u0E38\u0E48\u0E21\u0E40\u0E14\u0E34\u0E21)
   \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A) : \u0E42\u0E2B\u0E21\u0E14 \u00B7 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u00B7 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \u00B7 Invoice No. \u00B7 House B/L \u00B7 Master B/L / Customer Job No. \u00B7 \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38
   \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : Credit Term \u00B7 Due Date \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25
   \u0E0B\u0E48\u0E2D\u0E19 (UI \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19) : \u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel \u00B7 \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D DOCUMENT \u0E40\u0E14\u0E34\u0E21 \u00B7 \u0E01\u0E25\u0E48\u0E2D\u0E07 DOCUMENT \u0E40\u0E14\u0E34\u0E21 (\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48\u0E0B\u0E48\u0E2D\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22 CSS .jm-adv-doc \u0E04\u0E07\u0E40\u0E14\u0E34\u0E21) */
function LY542(p, r) {
  try {
    var q = function (s) { return p.querySelector(s); },
      F = function (id) { var x = p.querySelector("#" + id); return x ? x.closest(".fld") : null; },
      au = q(".jm-auto"), doc = q(".jm-sec.jm-doc"), md = p.closest(".modal"), bd = md && md.querySelector(".modal-b>div");
    if (!au || !doc || !md || !bd || !q("#nj-mode-wrap") || !q("#nj-comp") || !q("#nj-cust") || md.classList.contains("jm542")) return;
    md.classList.add("jm542");
    md.parentElement && md.parentElement.classList.add("jm542-bk");
    var el = function (cls, html) { var d = document.createElement("div"); d.className = cls; if (html) d.innerHTML = html; return d; },
      grid = function (cls, ids) { var g = el("jm-grid " + cls); ids.forEach(function (id) { var f = F(id); f && g.appendChild(f); }); return g; },
      ttl = function (ic, t) { return el("jm542-t", '<span class="jm542-ti">' + ic + "</span><span>" + t + "</span>"); },
      svg = function (d) { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; },
      IC_DOC = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>'),
      IC_CAL = svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
      IC_USR = svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>');
    /* \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 : \u0E0A\u0E48\u0E2D\u0E07 AD / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 \u0E16\u0E39\u0E01\u0E43\u0E2A\u0E48\u0E40\u0E02\u0E49\u0E32 .modal-h-x \u0E20\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07 \u2192 \u0E23\u0E2D\u0E08\u0E19\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14 */
    var HD = function () {
      var hx = md.querySelector(".modal-h-x"), h3 = md.querySelector(".modal-h h3"), ad = md.querySelector("#nj-autono"), jd = md.querySelector("#nj-jobdate");
      if (!hx || !h3 || !ad || !jd) return false;
      var lbs = Array.prototype.filter.call(hx.querySelectorAll(".jm-auto-lb"), function (x) { return !x.closest(".jm542-card"); });
      var pb = md.querySelector("#nj-pdf-btn"), pf = md.querySelector("#nj-pdf-file");
      if (!md.querySelector(".jm542-badge")) h3.insertAdjacentElement("afterend", el("jm542-badge", r ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19" : "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"));
      var c1 = el("jm542-card jm542-c-ad"), c2 = el("jm542-card jm542-c-dt"), t1 = el("jm542-ctx"), t2 = el("jm542-ctx");
      c1.appendChild(el("jm542-ic", IC_DOC)); lbs[0] && t1.appendChild(lbs[0]); t1.appendChild(ad); c1.appendChild(t1);
      c2.appendChild(el("jm542-ic", IC_CAL)); lbs[1] && t2.appendChild(lbs[1]); t2.appendChild(jd); c2.appendChild(t2);
      hx.appendChild(c1); hx.appendChild(c2);
      if (pb) { hx.appendChild(pb); pf && hx.appendChild(pf); }
      return true;
    };
    var tries = 0, run = function () { if (HD() || ++tries > 80) return; setTimeout(run, 20); };
    run();
    /* \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A) + \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : \u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A SF551.adv (\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A ACCOUNTING \u2014 ADVANCE) */
    var A = SF551.adv(p, "nj-", { au: au }); if (!A) return;
    /* V.606 : ADVANCE \u2014 \u0E41\u0E16\u0E27\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 : \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E15\u0E39\u0E49 \u00B7 SIZE \u00B7 \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 \u00B7 Booking No. (Element \u0E40\u0E14\u0E34\u0E21) */
    /* V.618 : \u0E41\u0E16\u0E27 \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E15\u0E39\u0E49 \u00B7 SIZE \u00B7 \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 \u00B7 Booking No. \u0E22\u0E49\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32 MASTER FORM SF551.adv (\u0E1C\u0E25\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21) */
    var mg = A.mg, mo = A.mo;
    bd.insertBefore(mg, au); bd.insertBefore(mo, au);
  } catch (e) { try { console.warn("LY542", e); } catch (_e) {} }
}

/* V.543 \u2192 V.551 \u00B7 DOCUMENT \u2014 SERVICE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 + \u0E01\u0E25\u0E38\u0E48\u0E21\u0E02\u0E49\u0E2D 1\u20135 \u0E08\u0E32\u0E01 "\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A" SF551.svc (\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A ACCOUNTING \u2014 SERVICE)
   \u0E22\u0E49\u0E32\u0E22 Element \u0E40\u0E14\u0E34\u0E21 (id / \u0E04\u0E48\u0E32 / Event / Validation / Mapping \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14) \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E0A\u0E48\u0E2D\u0E07 \u00B7 \u0E43\u0E0A\u0E49 CSS \u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19\u0E02\u0E2D\u0E07 .jm541 \u0E23\u0E48\u0E27\u0E21 (\u0E04\u0E25\u0E32\u0E2A jm541 + jm543) */
function LY543(p, r) {
  try {
    var q = function (s) { return p.querySelector(s); },
      au = q(".jm-auto"), cb = au && au.querySelector(".jm-auto-cb"), doc = q(".jm-sec.jm-doc"), md = p.closest(".modal");
    if (!au || !cb || !doc || !md || md.classList.contains("jm543")) return;
    md.classList.add("jm541", "jm543");
    md.parentElement && md.parentElement.classList.add("jm541-bk");
    /* \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 : (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) \u00B7 Upload PDF Entry (\u0E1B\u0E38\u0E48\u0E21/Input \u0E40\u0E14\u0E34\u0E21) \u0E02\u0E27\u0E32\u0E2A\u0E38\u0E14 */
    var hx = md.querySelector(".modal-h-x"), h3 = md.querySelector(".modal-h h3"), pb = q("#nj-pdf-btn"), pf = q("#nj-pdf-file");
    if (h3 && !h3.querySelector(".jm543-mode")) { var sp = document.createElement("span"); sp.className = "jm543-mode"; sp.textContent = r ? " (\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19)" : " (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48)"; h3.appendChild(sp); }
    if (hx && pb) { hx.appendChild(pb); pf && hx.appendChild(pf); }
    HD558(md, hx, h3);   /* V.558 : \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27\u0E41\u0E16\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 JOB NJ / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 (Element \u0E40\u0E14\u0E34\u0E21) \u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E44\u0E2D\u0E04\u0E2D\u0E19 */
    /* \u0E02\u0E49\u0E2D 1\u20135 : \u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A (\u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21 ACCOUNTING) */
    SF551.svc(p, "nj-", { au: au, docBox: doc, skip: [pb, pf], bl2: true });
  } catch (e) { try { console.warn("LY543", e); } catch (_e) {} }
}

/* V.558 \u00B7 DOCUMENT \u2014 SERVICE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27\u0E41\u0E16\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 \u0E44\u0E2D\u0E04\u0E2D\u0E19\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D \u00B7 \u0E01\u0E25\u0E48\u0E2D\u0E07 JOB NJ (\u0E44\u0E2D\u0E04\u0E2D\u0E19 + \u0E1B\u0E49\u0E32\u0E22\u0E40\u0E14\u0E34\u0E21 + #nj-autono \u0E40\u0E14\u0E34\u0E21 + \u0E1B\u0E49\u0E32\u0E22\u0E23\u0E2D POST \u0E02\u0E2D\u0E07 LY546) \u00B7 \u0E01\u0E25\u0E48\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 (\u0E44\u0E2D\u0E04\u0E2D\u0E19 + \u0E1B\u0E49\u0E32\u0E22\u0E40\u0E14\u0E34\u0E21 + #nj-jobdate \u0E40\u0E14\u0E34\u0E21)
   \u0E22\u0E49\u0E32\u0E22 Element \u0E40\u0E14\u0E34\u0E21\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (id / \u0E04\u0E48\u0E32 / Event / Mapping \u0E40\u0E14\u0E34\u0E21) \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48 \u00B7 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E08\u0E32\u0E01 LY543 \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (DOCUMENT \u2014 SERVICE) \u00B7 ADVANCE / ACCOUNTING \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E25\u0E32\u0E2A .jm558 */
function HD558(md, hx, h3) {
  try {
    if (!md || !hx || md.classList.contains("jm558")) return;
    var no = hx.querySelector("#nj-autono"), jd = hx.querySelector("#nj-jobdate");
    if (!no || !jd || no.parentNode !== hx || jd.parentNode !== hx) return;
    var lbs = Array.prototype.filter.call(hx.children, function (x) { return x.classList.contains("jm-auto-lb"); });
    var el = function (cls) { var d = document.createElement("div"); d.className = cls; return d; },
      svg = function (d) { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; },
      ic = function (cls, html) { var d = document.createElement("span"); d.className = "jm558-ic" + (cls ? " " + cls : ""); d.innerHTML = html; return d; },
      IC_DOC = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>'),
      IC_JOB = svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
      IC_CAL = svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>');
    md.classList.add("jm558");
    if (h3 && !h3.querySelector(".jm558-hi")) h3.insertBefore(ic("jm558-hi", IC_DOC), h3.firstChild);
    var bar = el("jm558-bar"), c1 = el("jm558-card jm558-c-no"), c2 = el("jm558-card jm558-c-dt");
    c1.appendChild(ic("", IC_JOB)); lbs[0] && c1.appendChild(lbs[0]); c1.appendChild(no);
    c2.appendChild(ic("", IC_CAL)); lbs[1] && c2.appendChild(lbs[1]); c2.appendChild(jd);
    bar.appendChild(c1); bar.appendChild(el("jm558-dv")); bar.appendChild(c2);
    hx.insertBefore(bar, hx.firstChild);
  } catch (e) { try { console.warn("HD558", e); } catch (_e) {} }
}

/* V.546 \u00B7 \u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07 : \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E1E\u0E31\u0E1A/\u0E02\u0E22\u0E32\u0E22 (Accordion) \u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21 DOCUMENT \u2014 SERVICE \u0E41\u0E25\u0E30 ACCOUNTING \u2014 SERVICE \u2014 \u0E22\u0E49\u0E32\u0E22 Element \u0E40\u0E14\u0E34\u0E21\u0E40\u0E02\u0E49\u0E32\u0E44\u0E1B\u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07 \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07/\u0E44\u0E21\u0E48\u0E25\u0E1A\u0E0A\u0E48\u0E2D\u0E07
   AC546.sec(n, title, sub, color) \u2192 {el, body}  \u00B7  AC546.wire(root, opts) \u0E1C\u0E39\u0E01\u0E01\u0E32\u0E23\u0E01\u0E14\u0E1E\u0E31\u0E1A/\u0E02\u0E22\u0E32\u0E22 + \u0E02\u0E22\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E21\u0E35 error \u0E15\u0E2D\u0E19\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 */
var AC546 = (function () {
  var CAV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  function sec(n, title, sub, color) {
    var s = document.createElement("div"); s.className = "jm546-sec jm546-c" + color; s.setAttribute("data-sec", String(n));
    var row = document.createElement("div"); row.className = "jm546-hrow";
    var h = document.createElement("button"); h.type = "button"; h.className = "jm546-h"; h.setAttribute("aria-expanded", "false");
    h.innerHTML = '<span class="jm546-n">' + n + '</span><span class="jm546-tt">' + title + (sub ? ' <span class="jm546-sub">' + sub + "</span>" : "") + '</span><span class="jm546-cav">' + CAV + "</span>";
    row.appendChild(h);
    var b = document.createElement("div"); b.className = "jm546-b";
    s.appendChild(row); s.appendChild(b);
    return { el: s, body: b, head: h, row: row };
  }
  function setOpen(s, on) { s.classList.toggle("is-open", !!on); var h = s.querySelector(":scope>.jm546-hrow>.jm546-h"); h && h.setAttribute("aria-expanded", on ? "true" : "false"); }
  function isOpen(s) { return s.classList.contains("is-open"); }
  function all(root) { return Array.prototype.slice.call(root.querySelectorAll(".jm546-sec")).filter(function (s) { return !s.classList.contains("jm546-hide"); }); }
  /* opts.single = \u0E40\u0E1B\u0E34\u0E14\u0E44\u0E14\u0E49\u0E17\u0E35\u0E25\u0E30\u0E02\u0E49\u0E2D (DOCUMENT) \u00B7 opts.saveBtns = \u0E1B\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48\u0E01\u0E14\u0E41\u0E25\u0E49\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A \u00B7 opts.errSel = \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E14 */
  function wire(root, opts) {
    opts = opts || {};
    root.addEventListener("click", function (ev) {
      var h = ev.target.closest && ev.target.closest(".jm546-h"); if (!h || !root.contains(h)) return;
      var s = h.closest(".jm546-sec"), on = !isOpen(s);
      if (on && opts.single) all(root).forEach(function (x) { x !== s && setOpen(x, false); });
      setOpen(s, on);
    });
    var errSel = opts.errSel || ".fld.invalid,.is-err,.fld.is-dup,.invalid";
    var revealErrors = function () {
      var secs = all(root), hit = false;
      secs.forEach(function (s) { if (s.querySelector(errSel)) { setOpen(s, true); hit = true; } });
      return hit;
    };
    (opts.saveBtns || []).forEach(function (sel) {
      var b = root.closest(".modal") ? root.closest(".modal").querySelector(sel) : null; if (!b) return;
      b.addEventListener("click", function () {
        var prev = all(root).map(function (s) { return [s, isOpen(s)]; });
        all(root).forEach(function (s) { setOpen(s, true); });           /* \u0E02\u0E22\u0E32\u0E22\u0E17\u0E38\u0E01\u0E02\u0E49\u0E2D\u0E01\u0E48\u0E2D\u0E19\u0E15\u0E23\u0E27\u0E08 \u2192 scroll/focus \u0E44\u0E1B\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E14\u0E44\u0E14\u0E49 */
        setTimeout(function () {
          if (revealErrors()) { all(root).forEach(function (s) { if (!s.querySelector(errSel)) setOpen(s, false); }); }
          else prev.forEach(function (p) { setOpen(p[0], p[1]); });
        }, 80);
      }, true);
    });
    /* error \u0E17\u0E35\u0E48\u0E40\u0E01\u0E34\u0E14\u0E20\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07 (\u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E23\u0E27\u0E08\u0E40\u0E25\u0E02\u0E0B\u0E49\u0E33\u0E41\u0E1A\u0E1A async) \u2192 \u0E40\u0E1B\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E19\u0E31\u0E49\u0E19 */
    try { new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t.nodeType === 1 && t.matches && t.matches(errSel)) { var s = t.closest(".jm546-sec"); s && !isOpen(s) && setOpen(s, true); } } }).observe(root, { attributes: true, attributeFilter: ["class"], subtree: true }); } catch (e) {}
    return { setOpen: setOpen, all: function () { return all(root); } };
  }
  /* \u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48 \u0E1B\u0E49\u0E32\u0E22(.jm-auto-lb) + \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u0E43\u0E19\u0E41\u0E16\u0E27 .jm-auto \u0E40\u0E14\u0E34\u0E21 \u2192 .fld (\u0E43\u0E0A\u0E49\u0E17\u0E31\u0E49\u0E07 nj- \u0E41\u0E25\u0E30 bmd-) */
  function pairAuto(au, skip) {
    var cur = null, kids = Array.prototype.slice.call(au.children);
    kids.forEach(function (c) {
      if (skip && skip.indexOf(c) >= 0) return;
      if (c.classList.contains("jm-auto-lb")) { cur = document.createElement("div"); cur.className = "fld jm541-f"; au.appendChild(cur); cur.appendChild(c); }
      else if (c.classList.contains("jm-auto-cb")) return;
      else if (cur) cur.appendChild(c);
    });
    au.classList.add("jm541-r1");
  }
  function grid(root, cls, ids, p) {
    var g = document.createElement("div"); g.className = "jm-grid " + cls;
    ids.forEach(function (id) { var x = root.querySelector("#" + p + id); var f = x && x.closest(".fld"); f && g.appendChild(f); });
    return g;
  }
  return { sec: sec, wire: wire, setOpen: setOpen, isOpen: isOpen, pairAuto: pairAuto, grid: grid };
})();

/* V.551 \u00B7 \u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A DOCUMENT (MASTER) \u2014 \u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19\u0E08\u0E23\u0E34\u0E07\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07 DOCUMENT \u0E41\u0E25\u0E30 ACCOUNTING (export \u0E08\u0E32\u0E01\u0E42\u0E21\u0E14\u0E39\u0E25\u0E19\u0E35\u0E49 \u00B7 billing-modal import \u0E44\u0E1B\u0E40\u0E23\u0E35\u0E22\u0E01\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19)
   \u0E0A\u0E48\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E08\u0E32\u0E01\u0E15\u0E31\u0E27\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E01\u0E25\u0E32\u0E07\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27 (chunk \u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E01\u0E25\u0E32\u0E07 : ke/qe \u0E14\u0E49\u0E27\u0E22 prefix "nj-" \u0E2B\u0E23\u0E37\u0E2D "bmd-") \u2192 SF551 \u0E04\u0E37\u0E2D\u0E2A\u0E48\u0E27\u0E19 "\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21" \u0E17\u0E35\u0E48\u0E40\u0E04\u0E22\u0E41\u0E22\u0E01\u0E01\u0E31\u0E19 2 \u0E0A\u0E38\u0E14
   SF551.pickers(root, P, o) : \u0E0A\u0E48\u0E2D\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \u0E41\u0E1A\u0E1A DOCUMENT (Combobox + \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E15\u0E49\u0E0A\u0E48\u0E2D\u0E07 + \u{1F50D} + \u{1F465} \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D)
   SF551.svc(root, P, o)     : SERVICE \u0E02\u0E49\u0E2D 1\u20135 (\u0E01\u0E25\u0E38\u0E48\u0E21 / \u0E25\u0E33\u0E14\u0E31\u0E1A\u0E0A\u0E48\u0E2D\u0E07 / \u0E04\u0E25\u0E32\u0E2A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19)        SF551.sections(G, o) : \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 1\u20135 (AC546)
   SF551.adv(root, P)        : ADVANCE \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A) + \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25
   SF551.r5(root, P, invFld) : \u0E41\u0E16\u0E27\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 INVOICE \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date
   \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E21\u0E48 \u00B7 \u0E22\u0E49\u0E32\u0E22 Element \u0E40\u0E14\u0E34\u0E21 (id / \u0E04\u0E48\u0E32 / Event / Validation / Mapping \u0E40\u0E14\u0E34\u0E21) */
/* V.559 \u00B7 \u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E01\u0E25\u0E32\u0E07 SF551.svc \u0E02\u0E49\u0E2D 1 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19 (\u0E42\u0E2B\u0E21\u0E14 \u00B7 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u00B7 \u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 \u00B7 \u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u00B7 \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08) \u2014 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E08\u0E32\u0E01 SF551.svc \u0E08\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27 \u2192 DOCUMENT \u2014 SERVICE \u0E41\u0E25\u0E30 ACCOUNTING \u2014 SERVICE \u0E44\u0E14\u0E49\u0E1C\u0E25\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 (ADVANCE \u0E43\u0E0A\u0E49 SF551.adv \u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E08\u0E38\u0E14\u0E19\u0E35\u0E49)
   1) \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Dropdown (.njsel-list \u0E40\u0E14\u0E34\u0E21 \u00B7 DOM \u0E40\u0E14\u0E34\u0E21) \u0E41\u0E2A\u0E14\u0E07\u0E41\u0E1A\u0E1A position:fixed \u0E15\u0E32\u0E21\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E38\u0E48\u0E21 \u2192 \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01 overflow:hidden \u0E02\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D (.jm546-sec) / \u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E15\u0E31\u0E14
      \u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E2D \u2192 \u0E40\u0E1B\u0E34\u0E14\u0E02\u0E36\u0E49\u0E19\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19 \u00B7 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32\u0E27 \u2192 \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E22\u0E43\u0E19 \u00B7 \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07 \u2192 \u0E1B\u0E34\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19 Select \u0E1B\u0E01\u0E15\u0E34) \u00B7 Esc \u0E1B\u0E34\u0E14 \u00B7 \u0E1B\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27\u0E04\u0E37\u0E19 Style \u0E40\u0E14\u0E34\u0E21
   2) "\u0E2D\u0E37\u0E48\u0E19 (\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2D\u0E07)" : \u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21 (id / \u0E04\u0E48\u0E32 / Mapping \u0E40\u0E14\u0E34\u0E21: agency_via_other \u00B7 permit_name_other) \u0E22\u0E49\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E44\u0E1B\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A\u0E0A\u0E48\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E01 \u2192 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E0A\u0E48\u0E2D\u0E07\u0E41\u0E22\u0E01\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07
      \u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07/\u0E0B\u0E48\u0E2D\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2D\u0E07 \u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E0E\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E01\u0E25\u0E32\u0E07 (hidden) \u2014 \u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E41\u0E04\u0E48\u0E08\u0E31\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07/\u0E04\u0E25\u0E32\u0E2A\u0E15\u0E32\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E19\u0E31\u0E49\u0E19 */
var DD559 = (function () {
  var OPEN = [];
  function px(n) { return Math.round(n) + "px"; }
  function reset(l) { ["position", "left", "top", "right", "bottom", "width", "minWidth", "maxHeight", "overflowY"].forEach(function (k) { l.style[k] = ""; }); l.classList.remove("dd559-up"); }
  function place(btn, l) {
    var r = (l.parentElement || btn).getBoundingClientRect(), vw = window.innerWidth || document.documentElement.clientWidth, vh = window.innerHeight || document.documentElement.clientHeight, gap = 4, m = 8;
    if (l.style.position !== "fixed") { var w0 = l.offsetWidth; l.style.position = "fixed"; l.style.right = "auto"; l.style.bottom = "auto"; l.style.width = px(Math.max(w0, r.width)); l.style.minWidth = "0"; }
    l.style.maxHeight = "";
    var cssMax = parseFloat(getComputedStyle(l).maxHeight) || 320, nat = Math.min(l.scrollHeight, cssMax);
    var below = vh - r.bottom - gap - m, above = r.top - gap - m, up = nat > below && above > below;
    var mh = Math.max(96, Math.min(cssMax, up ? above : below));
    l.style.maxHeight = px(mh); l.style.overflowY = "auto";
    var h = Math.min(l.scrollHeight, mh), w = l.offsetWidth;
    var right = getComputedStyle(l).getPropertyValue("--dd559-align").trim() === "right" || !!(l.closest && l.closest(".jm-auto-rcp"));
    var left = right ? r.right - w : r.left;
    left = Math.max(m, Math.min(left, vw - w - m));
    var top = up ? r.top - gap - h : r.bottom + gap;
    top = Math.max(m, Math.min(top, vh - h - m));
    l.style.left = px(left); l.style.top = px(top);
    var a = l.getBoundingClientRect(), dx = a.left - left, dy = a.top - top;   /* \u0E01\u0E23\u0E13\u0E35\u0E21\u0E35 Ancestor \u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19 containing block \u0E02\u0E2D\u0E07 fixed (transform) \u2192 \u0E0A\u0E14\u0E40\u0E0A\u0E22 */
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { l.style.left = px(left - dx); l.style.top = px(top - dy); }
    l.classList.toggle("dd559-up", up);
  }
  function close(it) { if (!it.l.hidden) { it.l.hidden = true; it.btn.setAttribute("aria-expanded", "false"); } }
  function onScroll(e) { OPEN.slice().forEach(function (it) { var t = e.target; if (t === it.l || (t.nodeType === 1 && it.l.contains(t))) return; close(it); }); }
  function onResize() { OPEN.forEach(function (it) { place(it.btn, it.l); }); }
  function onKey(e) { if (e.key !== "Escape" && e.key !== "Esc") return; OPEN.slice().forEach(function (it) { close(it); try { it.btn.focus(); } catch (_e) {} }); }
  function watch(it) {
    var on = OPEN.indexOf(it) >= 0;
    if (!it.l.hidden) {
      place(it.btn, it.l);
      if (!on) { OPEN.push(it); if (OPEN.length === 1) { document.addEventListener("scroll", onScroll, true); window.addEventListener("resize", onResize); document.addEventListener("keydown", onKey, true); } }
    } else {
      reset(it.l);
      if (on) { OPEN.splice(OPEN.indexOf(it), 1); if (!OPEN.length) { document.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", onResize); document.removeEventListener("keydown", onKey, true); } }
    }
  }
  function list(w) {
    var btn = w.querySelector(":scope>.njsel-btn"), l = w.querySelector(":scope>.njsel-list");
    if (!btn || !l || l.dataset.dd559) return;
    l.dataset.dd559 = "1";
    var it = { btn: btn, l: l };
    try { new MutationObserver(function () { watch(it); }).observe(l, { attributes: true, attributeFilter: ["hidden"] }); } catch (e) {}
    !l.hidden && watch(it);
  }
  function other(au, P, k, OV) {   /* V.615 : OV = \u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E0A\u0E48\u0E2D\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C (\u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07 = "\u0E2D\u0E37\u0E48\u0E19" \u0E40\u0E14\u0E34\u0E21) \u00B7 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 FORM \u0E41\u0E2A\u0E14\u0E07 "FORM \u25BE" \u0E14\u0E49\u0E32\u0E19\u0E0B\u0E49\u0E32\u0E22 */
    var w = au.querySelector("#" + P + k + "-wrap"), inp = au.querySelector("#" + P + k + "-other");
    if (!w || !inp || w.dataset.dd559o) return;
    w.dataset.dd559o = "1";
    var btn = w.querySelector(":scope>.njsel-btn"), l = w.querySelector(":scope>.njsel-list"), car = btn && btn.querySelector(".njsel-car");
    if (!btn) return;
    w.insertBefore(inp, btn);
    var pre = document.createElement("span"); pre.className = "njsel-opre"; btn.insertBefore(pre, car || null);
    var multi = w.classList.contains("njsel-multi"), first = true;
    var sync = function () {
      var on = !inp.hidden;
      w.classList.toggle("njsel-oth", on);
      var t = on && OV ? OV : "";
      if (on && multi) t = Array.prototype.filter.call(w.querySelectorAll(".njsel-ck"), function (c) { return c.checked && c.dataset.v !== Ot; }).map(function (c) { return c.dataset.v; }).join(", ");
      pre.textContent = t; btn.title = on ? (t ? t + " + " : "") + (inp.value || inp.placeholder || "") : btn.title;
      if (on && !first && !multi && !inp.disabled && !inp.readOnly) { try { inp.focus(); } catch (e) {} }
    };
    try { new MutationObserver(sync).observe(inp, { attributes: true, attributeFilter: ["hidden"] }); } catch (e) {}
    w.addEventListener("change", function (e) { if (e.target !== inp) { first = true; sync(); first = false; } });
    inp.addEventListener("focus", function () { if (l && !l.hidden) { l.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    /* \u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27 (\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15) : \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07 change \u2192 \u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01 "\u0E2D\u0E37\u0E48\u0E19" \u00B7 \u0E43\u0E0A\u0E49\u0E01\u0E0E\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E01\u0E25\u0E32\u0E07 (hidden = \u0E04\u0E48\u0E32 \u2260 "\u0E2D\u0E37\u0E48\u0E19") \u0E2B\u0E25\u0E31\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 */
    if (!multi && l) l.addEventListener("click", function (e) { if (!(e.target.closest && e.target.closest(".njsel-item"))) return; setTimeout(function () { var sel = w.querySelector("#" + P + k); sel && (inp.hidden = sel.value !== (OV || Ot)); }, 0); });
    sync(); first = false;
  }
  function row(au, P) {
    try {
      if (!au || au.dataset.dd559) return;
      au.dataset.dd559 = "1"; au.classList.add("dd559");
      ["agency", "permit"].forEach(function (k) { other(au, P, k); });
      other(au, P, "cat", "FORM");   /* V.615 : DOCUMENT — SERVICE (ADVANCE ไม่มีช่อง #nj-cat-other = ข้าม) */
      (function (w) { if (w) { var b = w.querySelector(":scope>.njsel-btn"); b && (b.style.setProperty("order", "0"), b.style.setProperty("flex", "0 0 auto", "important"), b.style.setProperty("max-width", "none"), b.style.setProperty("padding", "0 6px 0 12px"), b.style.setProperty("border-radius", "8px 0 0 8px")); var o = w.querySelector(":scope>.njsel-other"); o && (o.style.paddingLeft = "6px", o.style.borderRadius = "0 8px 8px 0"); } })(au.querySelector("#" + P + "cat-wrap.dd559o, #" + P + "cat-wrap[data-dd559o]"));
      Array.prototype.forEach.call(au.querySelectorAll(".njsel"), list);
    } catch (e) { try { console.warn("DD559", e); } catch (_e) {} }
  }
  return { row: row, place: place };
})();

/* V.620 \u00B7 DOCUMENT \u2014 SERVICE \u0E02\u0E49\u0E2D 5 / DOCUMENT \u2014 ADVANCE \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : Credit Term \u00B7 Due Date \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48 ACCOUNTING \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (V.557 \u00B7 NB547 \u2014 DOCUMENT \u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07\u0E04\u0E48\u0E32\u0E40\u0E2B\u0E25\u0E48\u0E32\u0E19\u0E35\u0E49) \u2192 \u0E41\u0E2A\u0E14\u0E07\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E14\u0E39\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E01\u0E23\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u00B7 ACCOUNTING \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21 */
function RO620(p) {
  try {
    ["nj-term", "nj-due", "nj-invdate"].forEach(function (id) { var x = p.querySelector("#" + id); if (!x) return; x.readOnly = true; x.tabIndex = -1; x.classList.add("jm620-ro"); x.setAttribute("aria-readonly", "true"); x.title = "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48 ACCOUNTING (\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25)"; if (x.placeholder) x.placeholder = "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48 ACCOUNTING"; });
  } catch (e) { try { console.warn("RO620", e); } catch (_e) {} }
  return true;
}

var SF551 = (function () {
  var L = {
    s2a: ["comp", "decl", "cust"], s2b: ["cjob", "srcinv"],
    s3a: ["hbl", "mbl"].concat(XF619.filter(function (f) { return (f.sec || 3) === 3 && f.grp !== "ADVANCE" && !f.pos; }).map(function (f) { return f.id; }).filter(function (k, i, a) { return a.indexOf(k) === i; }), ["book", "qtyc"]), s3b: ["eta", "etd", "rel", "dlv"], s3c: ["port", "relport", "vessel"].concat(XF619.filter(function (f) { return f.pos === "vessel" && f.grp !== "ADVANCE"; }).map(function (f) { return f.id; }).filter(function (k, i, a) { return a.indexOf(k) === i; }), ["note"]),   /* V.655 : Summit date · LOT ต่อจาก ชื่อเรือ / Vessel */
    s5: ["invdate", "term", "due"], s1x: ["lift-n", "stor-n"],
    a1: ["comp", "cust"], a2: ["decl", "srcinv", "hbl", "mbl"], a3: ["cjob", "note"], aMore: ["invdate", "term", "due"]
  };
  var T = {
    1: ["\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19", "(\u0E42\u0E2B\u0E21\u0E14 / \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 / \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19 / \u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 / \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08)"], 2: ["\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", "(\u0E01\u0E23\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A)"],
    3: ["\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E02\u0E19\u0E2A\u0E48\u0E07 / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07", "(\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23)"], 4: ["\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22 / \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21", "(\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19)"], 5: ["\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25", ""]
  };
  function el(cls, html) { var d = document.createElement("div"); d.className = cls; if (html) d.innerHTML = html; return d; }
  function F(root, P, k) { var x = root.querySelector("#" + P + k); return x ? x.closest(".fld") : null; }
  function grid(root, P, cls, keys) { var g = el("jm-grid " + cls); keys.forEach(function (k) { var f = F(root, P, k); f && g.appendChild(f); }); return g; }
  function ttl(n, t, s) { return el("jm541-t", '<span class="jm541-n">' + n + "</span>" + t + (s ? '<span class="jm543-sub">' + s + "</span>" : "")); }
  function svg(d) { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; }
  var IC_DOC = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>'),
    IC_USR = svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>');

  /* \u0E1B\u0E38\u0E48\u0E21 \u{1F50D} / \u{1F465} \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E2D\u0E07\u0E16\u0E39\u0E01\u0E25\u0E47\u0E2D\u0E01 (\u0E40\u0E0A\u0E48\u0E19 INVOICE POST \u0E41\u0E25\u0E49\u0E27) \u2014 \u0E15\u0E32\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21 */
  function lockSync(root, P) {
    ["comp", "cust"].forEach(function (k) {
      var inp = root.querySelector("#" + P + k), box = inp && inp.closest(".fld-inline"), mp = box && box.querySelector('.jm-mp[data-mp="' + k + '"]');
      if (!inp || !mp) return;
      var sync = function () { var off = !!(inp.disabled || inp.readOnly); mp.querySelectorAll("button").forEach(function (b) { b.disabled = off; }); };
      sync();
      try { new MutationObserver(sync).observe(inp, { attributes: true, attributeFilter: ["disabled", "readonly"] }); } catch (e) {}
    });
  }
  /* \u0E0A\u0E48\u0E2D\u0E07\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 : \u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A DOCUMENT \u0E17\u0E38\u0E01\u0E08\u0E38\u0E14 */
  function pickers(root, P, o) {
    o = o || {};
    var ci = function () {}, cs = function () {};
    ke(root, P + "comp", { getItems: Y, searchFirst: !0, radio: !0, codeFirst: !0, limit: 20, wide: !0, onChange: function () { ci(); o.onComp && o.onComp(); }, searchHint: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C CODE \u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32", canCreate: !1 });
    ci = ot(root, P + "comp", { items: Y, pick: At, cls: "jm-comp-pick" });
    ci();
    ke(root, P + "cust", hn(!1, function () { cs(); o.onCust && o.onCust(); }));
    cs = ot(root, P + "cust");
    o.noMp || Wn(root, P);
    lockSync(root, P);
    return { comp: function () { ci(); }, cust: function () { cs(); } };
  }
  /* SERVICE \u0E02\u0E49\u0E2D 1\u20135 : au = \u0E41\u0E16\u0E27 .jm-auto (\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E49\u0E2D 1 + Checkbox) \u00B7 docBox = \u0E01\u0E25\u0E48\u0E2D\u0E07 DOCUMENT \u0E40\u0E14\u0E34\u0E21 (\u0E16\u0E49\u0E32\u0E21\u0E35) \u00B7 src = \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E02\u0E2D\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D */
  function svc(root, P, o) {
    SFT574();   /* V.574 : MASTER UI — ธีมกลางของฟอร์มต้นฉบับ (DOCUMENT + ACCOUNTING ใช้ชุดเดียว) */
    var au = o.au, cb = au && au.querySelector(".jm-auto-cb"); if (!au || !cb) return null;
    au.removeChild(cb);
    AC546.pairAuto(au, o.skip || []);
    DD559.row(au, P);   /* V.559 : \u0E02\u0E49\u0E2D 1 \u2014 Dropdown \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E1A\u0E31\u0E07 \u00B7 "\u0E2D\u0E37\u0E48\u0E19 (\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2D\u0E07)" \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21 (\u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21 DOCUMENT / ACCOUNTING) */
    var g1 = el("jm541-g jm543-g1"); g1.appendChild(ttl(1, T[1][0], T[1][1]));
    au.parentNode.insertBefore(g1, au); g1.appendChild(au);
    var g2 = el("jm541-g jm543-g2"); g2.appendChild(ttl(2, T[2][0], T[2][1]));
    /* V.561 : o.bl2 (DOCUMENT \u2014 SERVICE \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u00B7 \u0E2A\u0E48\u0E07\u0E08\u0E32\u0E01 LY543) \u2192 House B/L \u00B7 Master B/L \u0E22\u0E49\u0E32\u0E22 (Element \u0E40\u0E14\u0E34\u0E21) \u0E44\u0E1B\u0E15\u0E48\u0E2D\u0E17\u0E49\u0E32\u0E22\u0E41\u0E16\u0E27 2 \u0E02\u0E2D\u0E07\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 2 \u00B7 ACCOUNTING \u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07 o.bl2 = \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 */
    var s2b = (o.bl2 ? L.s2b.concat(["hbl", "mbl"]) : L.s2b).concat(XF619.filter(function (f) { return f.sec === 2; }).map(function (f) { return f.id; })),   /* V.620 : ฟิลด์ทะเบียน sec 2 */ s3a = o.bl2 ? L.s3a.filter(function (k) { return k !== "hbl" && k !== "mbl"; }) : L.s3a;
    g2.appendChild(grid(root, P, "jm543-c3", L.s2a)); g2.appendChild(grid(root, P, "jm541-r4", s2b));
    var g3 = o.docBox || el("jm-sec jm-doc");
    var src = o.src || g3;
    var oldGrids = Array.prototype.slice.call(src.querySelectorAll(":scope>.jm-grid")), t0 = g3.querySelector(":scope>.jm-sec-t");
    var r3a = grid(root, P, "jm541-r4" + (o.bl2 ? " jm561-r3a" : "") + (o.bl2 && XF619.some(function (f) { return root.querySelector("#" + P + f.id); }) ? " jm606-r3a" : ""), s3a), r3b = grid(root, P, "jm541-r4", L.s3b), r3c = grid(root, P, "jm541-r4 jm543-r3c", L.s3c);
    r3a.classList.contains("jm606-r3a") && r3a.style.setProperty("--c619", String(Math.min(5, r3a.children.length || 1)));   /* V.620 : จำนวนคอลัมน์ตามฟิลด์จริง (CSS เดิม · มือถือคงเดิม) */
    var g5 = el("jm-sec jm541-g jm543-g5"); g5.appendChild(ttl(5, T[5][0]));
    g5.appendChild(grid(root, P, "jm543-c3b", L.s5));
    /* V.552 : \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D \u2192 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E15\u0E32\u0E21 Mapping (L.s1x = \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 Lift On / Storage \u0E41\u0E1A\u0E1A\u0E0A\u0E48\u0E2D\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 \u2192 \u0E02\u0E49\u0E2D 1) \u00B7 \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01 \u2192 \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 + \u0E17\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D 3 (\u0E44\u0E21\u0E48\u0E17\u0E34\u0E49\u0E07) */
    var r1x = grid(root, P, "jm541-r4 jm552-r1x", L.s1x), rest = el("jm-grid jm541-r4 jm541-rest");
    oldGrids.forEach(function (g) { Array.prototype.slice.call(g.children).forEach(function (c) { rest.appendChild(c); }); g.parentNode && !g.children.length && g.parentNode.removeChild(g); });
    if (rest.children.length) { try { console.warn("SF551 unmapped", Array.prototype.map.call(rest.querySelectorAll("[id]"), function (x) { return x.id; }).join(",")); } catch (e) {} }
    Array.prototype.slice.call(src.children).forEach(function (c) { if (c !== t0 && c !== au && c !== g1 && (o.keep || []).indexOf(c) < 0) g5.appendChild(c); });
    if (t0) { t0.className = "jm541-t"; t0.innerHTML = '<span class="jm541-n">3</span>' + T[3][0] + '<span class="jm543-sub">' + T[3][1] + "</span>"; }
    else g3.insertBefore(ttl(3, T[3][0], T[3][1]), g3.firstChild);
    g3.classList.add("jm541-g", "jm543-g3");
    g3.appendChild(r3a); g3.appendChild(r3b); g3.appendChild(r3c); rest.children.length && g3.appendChild(rest);
    r1x.children.length && g1.appendChild(r1x);
    var g4 = el("jm541-g jm543-g4"); g4.appendChild(ttl(4, T[4][0], T[4][1])); g4.appendChild(cb);
    g1.parentNode.insertBefore(g2, g1.nextSibling);
    g2.parentNode.insertBefore(g3, g2.nextSibling);
    g3.parentNode.insertBefore(g4, g3.nextSibling);
    g4.parentNode.insertBefore(g5, g4.nextSibling);
    return { g1: g1, g2: g2, g3: g3, g4: g4, g5: g5, cb: cb, au: au };
  }
  /* \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 1\u20135 (\u0E1E\u0E31\u0E1A/\u0E02\u0E22\u0E32\u0E22\u0E44\u0E14\u0E49\u0E14\u0E49\u0E27\u0E22 AC546) \u2014 \u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07 DOCUMENT \u0E41\u0E25\u0E30 ACCOUNTING */
  function sections(G) {
    var secs = {};
    [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]].forEach(function (m) {
      var g = G["g" + m[0]]; if (!g) return;
      var s = AC546.sec(m[0], T[m[0]][0], T[m[0]][1], m[1]);
      g.parentNode.insertBefore(s.el, g);
      var t = g.querySelector(":scope>.jm541-t"); t && t.parentNode.removeChild(t);
      s.body.appendChild(g); g.classList.add("jm546-g");
      secs[m[0]] = s;
    });
    return secs;
  }
  /* \u0E41\u0E16\u0E27\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : [INVOICE] \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date */
  function r5(root, P, invFld, g5) {
    var row = grid(root, P, "jm541-r4 jm546-r5", L.s5);
    invFld && row.insertBefore(invFld, row.firstChild);
    var c3b = g5 && g5.querySelector(".jm543-c3b"); c3b && c3b.parentNode && !c3b.children.length && c3b.parentNode.removeChild(c3b);
    g5 && g5.insertBefore(row, g5.firstChild);
    return row;
  }
  /* ADVANCE : \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A) + \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u2014 au = \u0E41\u0E16\u0E27 .jm-auto \u0E17\u0E35\u0E48\u0E21\u0E35\u0E42\u0E2B\u0E21\u0E14 */
  function adv(root, P, o) {
    SFT574();   /* V.574 : MASTER UI — ธีมกลางของฟอร์มต้นฉบับ (DOCUMENT + ACCOUNTING ใช้ชุดเดียว) */
    var au = o.au, mwrap = root.querySelector("#" + P + "mode-wrap");
    if (!au || !mwrap || !root.querySelector("#" + P + "comp") || !root.querySelector("#" + P + "cust")) return null;
    var ttl2 = function (ic, t) { return el("jm542-t", '<span class="jm542-ti">' + ic + "</span><span>" + t + "</span>"); };
    var mg = el("jm542-g jm542-main"); mg.appendChild(ttl2(IC_USR, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)"));
    var mlb = mwrap.previousElementSibling && mwrap.previousElementSibling.classList.contains("jm-auto-lb") ? mwrap.previousElementSibling : au.querySelector(".jm-auto-lb"), mf = el("fld jm542-f");
    if (mlb) mf.appendChild(mlb); mf.appendChild(mwrap);
    var rA = el("jm-grid jm542-r3"); rA.appendChild(mf);
    L.a1.forEach(function (k) { var f = F(root, P, k); f && rA.appendChild(f); });
    mg.appendChild(rA);
    mg.appendChild(grid(root, P, "jm542-r4", L.a2));
    mg.appendChild(grid(root, P, "jm542-r2", L.a3));
    /* V.618 : MASTER FORM \u2014 ADVANCE \u0E41\u0E16\u0E27\u0E17\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (\u0E40\u0E14\u0E34\u0E21 V.606 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 DOCUMENT \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19) : \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E15\u0E39\u0E49 \u00B7 SIZE \u00B7 \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 \u00B7 Booking No. (Element \u0E40\u0E14\u0E34\u0E21) \u2192 DOCUMENT \u2014 ADVANCE + ACCOUNTING \u2014 ADVANCE \u0E43\u0E0A\u0E49\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 */
    var ids620 = XF619.map(function (f) { return f.id; }).filter(function (k, i, a) { return a.indexOf(k) === i && root.querySelector("#" + P + k); });   /* V.637 : id ซ้ำ (SERVICE/ADVANCE) = นับครั้งเดียว */   /* V.620 : ไม่ผูกกับช่อง cno · นับฟิลด์ที่สร้างจริง */
    var fb637 = F(root, P, "book"); fb637 && fb637.classList.add("jm542-hide");   /* V.637 : ADVANCE — ซ่อน Booking No. (ค่าเดิมคงอยู่ในฟอร์ม · SAVE ค่าเดิม) */
    if (ids620.length) { var g620 = grid(root, P, "jm542-r4 jm606-adv", ids620); g620.style.setProperty("--c619", String(Math.min(4, g620.children.length))); mg.appendChild(g620); }   /* V.619 : id จากทะเบียน MASTER XF619 */
    var mo = el("jm542-g jm542-more"); mo.appendChild(ttl2(IC_DOC, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"));
    mo.appendChild(grid(root, P, "jm542-r3", ["term", "due", "invdate"]));
    var pv = root.querySelector("#" + P + "due-pv"); pv && mo.appendChild(pv);
    var vf = F(root, P, "vessel"); vf && vf.classList.add("jm542-hide");
    au.classList.add("jm542-auto");
    return { mg: mg, mo: mo };
  }
  /* ADVANCE \u0E41\u0E16\u0E27\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : INVOICE ADV \u00B7 Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date (\u0E41\u0E16\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27) */
  function advMore(root, P, mo, invFld) {
    var fi = F(root, P, "invdate"), ft = F(root, P, "term"), fd = F(root, P, "due"); if (!mo || !fi || !ft || !fd) return null;
    var row = ft.parentNode; row.classList.remove("jm542-r3"); row.classList.add("jm548a-r4");
    invFld && row.insertBefore(invFld, row.firstChild);
    row.insertBefore(fi, invFld ? invFld.nextSibling : row.firstChild); row.insertBefore(ft, fi.nextSibling); row.insertBefore(fd, ft.nextSibling);
    var lb = fi.querySelector(":scope>label"); lb && !lb.children.length && (lb.textContent = "Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25");
    return row;
  }
  /* V.552 \u00B7 \u0E15\u0E32\u0E23\u0E32\u0E07 INVOICE \u0E01\u0E25\u0E32\u0E07 : \u0E42\u0E04\u0E23\u0E07 (colgroup \u00B7 \u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07 \u00B7 \u0E1B\u0E38\u0E48\u0E21\u0E40\u0E23\u0E35\u0E22\u0E07 \u00B7 tbody \u00B7 \u0E2A\u0E23\u0E38\u0E1B\u0E22\u0E2D\u0E14) \u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 ACCOUNTING \u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49 (p="bm" id \u0E40\u0E14\u0E34\u0E21) \u00B7 DOCUMENT \u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E1A\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 */
  var TRI = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    SRI = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(n) { try { return V551(Number(n || 0)); } catch (e) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } }
  function invTable(o) {
    o = o || {}; var P = o.p || "bm";
    return '<div class="tbl-wrap bm-wrap"><table class="tbl bm-items inv630' + (o.ro ? " jm546-ro sf552-ro" : "") + '">'
      + '<colgroup><col class="c-seq"><col class="c-code"><col class="c-desc"><col class="c-cost"><col class="c-qty630"><col class="c-unit630"><col class="c-price630"><col class="c-amount"><col class="c-act"></colgroup>'
      + '<thead><tr><th class="center bm-th-seq"><span class="bm-seq-h">\u0E25\u0E33\u0E14\u0E31\u0E1A<button type="button" class="btn btn-o btn-sm bm-sort-h" id="' + P + '-sort">\u2195 \u0E40\u0E23\u0E35\u0E22\u0E07\u0E19\u0E49\u0E2D\u0E22 \u2192 \u0E21\u0E32\u0E01</button></span></th><th>CODE</th>'
      + '<th>DESCRIPTION</th><th hidden>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th><th class="r">COST</th><th class="r">QUANTITY</th><th>UNIT</th><th class="r">UNIT PRICE</th><th class="r">AMOUNT</th><th class="center">\u0E25\u0E1A</th></tr></thead><tbody id="' + P + '-tbody"></tbody></table></div>'
      + '<div class="bm-sum' + (o.ro ? " jm546-sum" : "") + '"><div class="r-line"><span>Subtotal</span><span id="' + P + '-sub">0.00</span></div>'
      + '<div class="r-line"><span>VAT ' + (o.vat == null ? 7 : o.vat) + '%</span><span id="' + P + '-vat">0.00</span></div>'
      + '<div class="r-line"><span>WHT</span><span id="' + P + '-wht">0.00</span></div>'
      + '<div class="r-line total"><span>Grand Total</span><span id="' + P + '-total">0.00</span></div></div>';
  }
  /* \u0E01\u0E0E\u0E40\u0E23\u0E35\u0E22\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : SERVICE \u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19 RECEIPT \u00B7 \u0E20\u0E32\u0E22\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21\u0E25\u0E33\u0E14\u0E31\u0E1A */
  function kindOf(it) { return String(it && it.charge_kind).toUpperCase() === "ADVANCE" ? "ADVANCE" : "SERVICE"; }
  /* V.630 : \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 6 \u0E17\u0E31\u0E49\u0E07 4 \u0E42\u0E2B\u0E21\u0E14 \u2014 UNIT = Dropdown FIX 10 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 (\u0E08\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21 DOCUMENT + ACCOUNTING) \u00B7 \u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E19\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 = \u0E41\u0E2A\u0E14\u0E07\u0E04\u0E07\u0E44\u0E27\u0E49 (\u0E44\u0E21\u0E48\u0E41\u0E01\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34) */
  var UNITS630 = ["SHIPMENT", "PAGE", "CONTAINER", "INVOICE", "ROUND", "VEHICLE", "SET", "DAY", "TRUCK", "FLAT RATE"];
  function unitSel(v, a) { v = v == null ? "" : String(v); var old = v !== "" && UNITS630.indexOf(v) < 0;
    return '<select class="sel u630" ' + (a || "") + '><option value="">\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 UNIT \u2014</option>'
      + (old ? '<option value="' + esc(v) + '" selected data-old630="1">' + esc(v) + ' (\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21)</option>' : "")
      + UNITS630.map(function (u) { return '<option value="' + u + '"' + (u === v ? " selected" : "") + ">" + u + "</option>"; }).join("") + "</select>"; }
  function qtyFmt(n) { if (n === "" || n == null || !isFinite(Number(n))) return ""; return Number(n).toLocaleString("en-US", { maximumFractionDigits: 4 }); }
  /* JOB \u0E40\u0E14\u0E34\u0E21\u0E44\u0E21\u0E48\u0E21\u0E35 qty / unit_price = QUANTITY 1 \u00B7 UNIT PRICE = AMOUNT \u0E40\u0E14\u0E34\u0E21 (\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u00B7 \u0E44\u0E21\u0E48\u0E40\u0E02\u0E35\u0E22\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25) */
  function qpu(it) { it = it || {}; var lg = it.qty == null && it.unit_price == null && it.amount != null && it.amount !== "";
    return { qty: lg ? 1 : (it.qty == null ? "" : it.qty), price: lg ? it.amount : (it.unit_price == null ? "" : it.unit_price), unit: it.unit == null ? "" : String(it.unit) }; }
  function invView(box, v, o) {
    o = o || {}; var P = o.p, st = box.__sf552 || (box.__sf552 = { asc: true });
    if (!box.querySelector("#" + P + "-tbody")) {
      box.classList.add("sf552-inv"); box.innerHTML = invTable({ p: P, ro: true, vat: o.vat });
      var sb = box.querySelector("#" + P + "-sort"); sb && sb.addEventListener("click", function () { st.asc = !st.asc; invView(box, st.v, o); });
    }
    st.v = v;
    var items = (v && v.items || []).slice().sort(function (a, b) { var k = (kindOf(a) === "ADVANCE" ? 1 : 0) - (kindOf(b) === "ADVANCE" ? 1 : 0); if (k) return k; var d = (a.line_no || 0) - (b.line_no || 0); return st.asc ? d : -d; });
    var sub = 0; items.forEach(function (it) { sub += Number(it.amount || 0); });
    var row = function (n, it, kind) { return '<tr><td class="center"><input class="inp center" value="' + n + '" readonly disabled></td>'
      + '<td><div class="sf552-code"><input class="inp" value="' + esc(it.code) + '" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 CODE / \u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23" readonly disabled><button type="button" class="sf552-sr" disabled tabindex="-1">' + SRI + '</button></div></td>'
      + '<td><input class="inp" value="' + esc(it.description) + '" placeholder="\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23" readonly disabled></td>'
      + '<td hidden><select class="sel" disabled><option>' + kind + '</option></select></td>'
      + '<td><input class="inp r" value="' + money(it.cost) + '" readonly disabled></td>'
      + (function (x) { return '<td><input class="inp r" value="' + qtyFmt(x.qty) + '" readonly disabled></td>'
        + '<td>' + unitSel(x.unit, "disabled") + '</td>'
        + '<td><input class="inp r" value="' + (x.price === "" ? "" : money(x.price)) + '" readonly disabled></td>'; })(qpu(it))
      + '<td><input class="inp r" value="' + money(it.amount) + '" readonly disabled></td>'
      + '<td class="center"><button type="button" class="btn btn-sm jm546-del" disabled title="\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48 ACCOUNTING">' + TRI + "</button></td></tr>"; };
    var setN = function (k, t) { var e = box.querySelector("#" + P + "-" + k); e && (e.textContent = t); };
    box.classList.toggle("sf554-denied", !!o.denied);
    if (o.denied) {   /* V.554 : \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E14\u0E39 INVOICE (\u0E15\u0E23\u0E27\u0E08\u0E17\u0E35\u0E48 Backend \u0E40\u0E14\u0E34\u0E21) \u2192 \u0E41\u0E08\u0E49\u0E07\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E32\u0E23\u0E32\u0E07\u0E27\u0E48\u0E32\u0E07 */
      box.querySelector("#" + P + "-tbody").innerHTML = '<tr class="sf554-deny"><td colspan="9" class="center">\u{1F512} \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE \u2014 \u0E41\u0E2A\u0E14\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C ACCOUNTING (\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A)</td></tr>';
      ["sub", "vat", "wht", "total"].forEach(function (k) { setN(k, "\u2013"); });
      var nt0 = box.querySelector(".jm546-note6"); nt0 && nt0.parentNode.removeChild(nt0); return;
    }
    box.querySelector("#" + P + "-tbody").innerHTML = items.length
      ? items.map(function (it) { return row(it.line_no || "", it, kindOf(it) === "ADVANCE" ? "Receipt" : "Service"); }).join("")
      : row(1, {}, o.kind || "Service");
    var set = function (k, val) { var e = box.querySelector("#" + P + "-" + k); e && (e.textContent = money(val)); };
    set("sub", v && v.subtotal != null ? v.subtotal : sub); set("vat", v && v.vat_amount); set("wht", v && v.wht_amount); set("total", v && v.total_amount);
    var nt = box.querySelector(".jm546-note6"); nt && nt.parentNode.removeChild(nt);
    if (o.note) { var d = document.createElement("div"); d.className = "jm546-note6"; d.textContent = o.note; box.appendChild(d); }
  }
  return { units630: UNITS630, unitSel: unitSel, qpu: qpu, L: L, T: T, invTable: invTable, invView: invView, pickers: pickers, svc: svc, sections: sections, r5: r5, adv: adv, advMore: advMore, grid: grid };
})();

/* V.546 + V.547 \u00B7 DOCUMENT \u2014 SERVICE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : 6 \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E1E\u0E31\u0E1A/\u0E02\u0E22\u0E32\u0E22 \u0E15\u0E48\u0E2D\u0E08\u0E32\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21\u0E02\u0E2D\u0E07 LY543 \u00B7 \u0E41\u0E2A\u0E14\u0E07\u0E15\u0E32\u0E21 Role \u0E40\u0E14\u0E34\u0E21
   USER \u2192 \u0E02\u0E49\u0E2D 1\u20134 (\u0E02\u0E49\u0E2D 5\u20136 \u0E0B\u0E48\u0E2D\u0E19 \u0E44\u0E21\u0E48\u0E25\u0E1A\u0E0A\u0E48\u0E2D\u0E07 \u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21\u0E22\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E25\u0E31\u0E1A) \u00B7 SUPER_ADMIN \u2192 \u0E02\u0E49\u0E2D 1\u20136 \u00B7 Role \u0E2D\u0E37\u0E48\u0E19 \u2192 \u0E02\u0E49\u0E2D 1\u20135 (\u0E40\u0E17\u0E48\u0E32\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E47\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E40\u0E14\u0E34\u0E21)
   \u0E02\u0E49\u0E2D 5 : INVOICE NJ (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u00B7 \u0E40\u0E25\u0E02\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25) \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date (\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21)
   \u0E02\u0E49\u0E2D 6 : \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE \u0E02\u0E2D\u0E07 JOB \u0E40\u0E14\u0E34\u0E21 (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u00B7 njacc_invoice_draft_view \u00B7 \u0E42\u0E2B\u0E25\u0E14\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14\u0E02\u0E22\u0E32\u0E22) \u2014 DOCUMENT \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07 INVOICE
   \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 : JOB NJ \u0E41\u0E2A\u0E14\u0E07 "\u0E23\u0E2D POST" \u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E21\u0E35\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07 \u00B7 \u0E40\u0E1B\u0E34\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01\u0E1E\u0E31\u0E1A\u0E17\u0E38\u0E01\u0E02\u0E49\u0E2D \u00B7 \u0E40\u0E1B\u0E34\u0E14\u0E17\u0E35\u0E25\u0E30\u0E02\u0E49\u0E2D \u00B7 \u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E22\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E14 */
function LY546(p, r) {
  try {
    var md = p.closest(".modal"); if (!md || md.classList.contains("jm546")) return;
    var G = {}; ["g1", "g2", "g3", "g4", "g5"].forEach(function (k) { G[k] = p.querySelector(".jm543-" + k); });
    if (!G.g1 || !G.g2 || !G.g3 || !G.g4 || !G.g5) return;
    md.classList.add("jm546", "jm546-doc");
    /* V.557 : DOCUMENT \u2014 SERVICE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) \u0E0B\u0E48\u0E2D\u0E19\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 5 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 6 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u2014 UI \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E04\u0E23\u0E1A)
       \u0E04\u0E25\u0E32\u0E2A\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07 DOCUMENT \u0E19\u0E35\u0E49\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (LY546 \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E40\u0E23\u0E35\u0E22\u0E01\u0E43\u0E19 ACCOUNTING) \u00B7 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19\u0E40\u0E14\u0E34\u0E21 \u2192 \u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07 Credit Term / Due Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 (\u0E04\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48 ACCOUNTING \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u00B7 NB547) */
    md.classList.add("jm557"); if (r && r.id) md.dataset.ed557 = "1";
    var role = "", esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    try { role = String(ROLE546() || ""); } catch (e) { role = ""; }
    var secs = SF551.sections(G);   /* V.551 : \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 1\u20135 \u0E08\u0E32\u0E01\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A (\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A ACCOUNTING \u2014 SERVICE) */
    /* \u0E02\u0E49\u0E2D 5 : INVOICE NJ \u0E19\u0E33\u0E2B\u0E19\u0E49\u0E32 \u00B7 \u0E40\u0E23\u0E35\u0E22\u0E07 INVOICE NJ \u00B7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date */
    var g5 = G.g5, inv = document.createElement("div"); inv.className = "fld jm546-invfld";
    var invNo = r && (r.invoice_no || r.inv_no || r.invoice_number) || "";
    inv.innerHTML = '<label>INVOICE NJ</label><div class="inp jm546-invno' + (invNo ? " has" : "") + '" id="nj-invno546">' + (invNo ? esc(invNo) : "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02") + "</div>";
    SF551.r5(p, "nj-", inv, g5);   /* V.551 : \u0E41\u0E16\u0E27\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E08\u0E32\u0E01\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A */
    /* \u0E02\u0E49\u0E2D 6 : \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 (SUPER_ADMIN \u00B7 \u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27) */
    var s6 = AC546.sec(6, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25", "(ACCOUNTING \u0E01\u0E23\u0E2D\u0E01)", 6);
    s6.body.innerHTML = '<div class="jm546-inv6" id="nj-inv546"></div>';
    secs[5].el.parentNode.insertBefore(s6.el, secs[5].el.nextSibling); secs[6] = s6;
    /* V.575 : ข้อ 5–6 แสดงตาม Permission เดิมของระบบ (โมดูล ACCOUNTING · สิทธิ์ view — เกณฑ์เดียวกับ njacc_invoice_draft_view) · ไม่ใช้ชื่อโหมดเป็นเงื่อนไข · ไม่มีสิทธิ์ = ไม่แสดง + ไม่เรียกอ่าน INVOICE */
    var see575 = PV575(); if (!see575) { secs[5].el.hidden = true; s6.el.hidden = true; }
    /* V.547 : INVOICE NJ \u0E43\u0E19\u0E02\u0E49\u0E2D 5 \u0E42\u0E2B\u0E25\u0E14\u0E17\u0E31\u0E19\u0E17\u0E35\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 (\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u00B7 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48 DRAFT-) \u00B7 \u0E02\u0E49\u0E2D 6 \u0E42\u0E2B\u0E25\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14 \u00B7 \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E21\u0E37\u0E48\u0E2D JOB \u0E16\u0E39\u0E01\u0E41\u0E01\u0E49 */
    var fmt = function (n) { n = Number(n || 0); return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
      realNo = function (v) { return v && v.invoice_no && v.has_real_no !== false && !/^DRAFT-/i.test(String(v.invoice_no)) ? String(v.invoice_no) : ""; },
      setInv = function (v) { var e = p.querySelector("#nj-invno546"); if (!e) return; var n = realNo(v); e.textContent = n || "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02"; e.classList.toggle("has", !!n); },
      busy = null,
      fetchInv = function () { if (!(r && r.id)) return Promise.resolve(null); if (busy) return busy;
        busy = Promise.resolve().then(function () { return RPC546("njacc_invoice_draft_view", { p_job: r.id }); }).then(function (v) { busy = null; return v || null; }, function (e) { busy = null; throw e; }); return busy; },
      render6 = function (v) { var box = s6.body.querySelector("#nj-inv546"); if (!box) return;   /* V.552 : \u0E15\u0E32\u0E23\u0E32\u0E07 INVOICE \u0E01\u0E25\u0E32\u0E07 (SF551.invView) */
        SF551.invView(box, v, { p: "nj6", kind: "Service", note: v ? "\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE : " + (v.status || "-") + (realNo(v) ? " \u00B7 " + realNo(v) : "") : "" }); },
      refresh = function (with6) { if (!(r && r.id) || !see575) return;
        var box = s6.body.querySelector("#nj-inv546");
        fetchInv().then(function (v) { setInv(v); with6 && render6(v); }).catch(function (er) { var dn = /FORBIDDEN/i.test(String((er && er.code || "") + " " + (er && er.message || er))); if (dn) { var e5 = p.querySelector("#nj-invno546"); e5 && (e5.textContent = "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E14\u0E39 (\u0E40\u0E09\u0E1E\u0E32\u0E30 ACCOUNTING)", e5.classList.remove("has"), e5.classList.add("sf554-deny5")); } with6 && (dn ? SF551.invView(s6.body.querySelector("#nj-inv546"), null, { p: "nj6", kind: "Service", denied: true }) : render6(null)); }); };
    try { var ev = function (e) { if (!p.isConnected) { window.removeEventListener("njacc:jobs-changed", ev); return; }
      var ids = e && e.detail && e.detail.ids; if (!(r && r.id) || !(Array.isArray(ids) && (ids.indexOf("*") >= 0 || ids.indexOf(String(r.id)) >= 0))) return;
      refresh(true); }; window.addEventListener("njacc:jobs-changed", ev); GN568(p, function () { window.removeEventListener("njacc:jobs-changed", ev); }); } catch (e) {}   /* V.568 */
    /* \u0E41\u0E2A\u0E14\u0E07\u0E15\u0E32\u0E21 Role \u0E40\u0E14\u0E34\u0E21 */
    /* V.548 : \u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E07\u0E40\u0E2B\u0E47\u0E19\u0E15\u0E32\u0E21 Role \u2192 \u0E41\u0E2A\u0E14\u0E07\u0E02\u0E49\u0E2D 1\u20136 \u0E17\u0E38\u0E01 Role (\u0E04\u0E07\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A / RPC \u0E1D\u0E31\u0E48\u0E07 Server) */
    /* V.548 : \u0E02\u0E49\u0E2D 6 \u0E41\u0E2A\u0E14\u0E07\u0E15\u0E32\u0E23\u0E32\u0E07\u0E40\u0E15\u0E47\u0E21\u0E40\u0E2A\u0E21\u0E2D (\u0E27\u0E48\u0E32\u0E07 = \u0E41\u0E16\u0E27\u0E27\u0E48\u0E32\u0E07 1 \u0E41\u0E16\u0E27 \u00B7 \u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27) \u00B7 \u0E1B\u0E38\u0E48\u0E21\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E41\u0E15\u0E48\u0E43\u0E0A\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E43\u0E19 DOCUMENT */
    render6(null);
    var add6 = document.createElement("button"); add6.type = "button"; add6.className = "btn btn-p jm546-add6"; add6.disabled = true; add6.title = "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48 ACCOUNTING \u2014 SERVICE"; add6.textContent = "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"; s6.row.appendChild(add6);
    if (r && r.id) refresh(true);   /* \u0E40\u0E25\u0E02 INVOICE NJ \u0E02\u0E49\u0E2D 5 + \u0E15\u0E32\u0E23\u0E32\u0E07\u0E02\u0E49\u0E2D 6 \u0E17\u0E31\u0E19\u0E17\u0E35 */
    /* \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27 : JOB NJ \u0E23\u0E2D POST */
    var no = md.querySelector("#nj-autono");
    if (no && !md.querySelector(".jm546-st")) {
      var st = document.createElement("span"); st.className = "jm546-st"; st.textContent = "\u0E23\u0E2D POST"; no.insertAdjacentElement("afterend", st);
      var sync = function () { var v = String(no.value || "").trim(), real = /^[A-Z]{2,6}\d{4}-\d{3,6}$/i.test(v); no.classList.toggle("jm546-wait", !real); st.hidden = real; };
      sync();
      ["#nj-save", "#nj-post"].forEach(function (sel) { var b = md.querySelector(sel); b && b.addEventListener("click", function () { [400, 1200, 2500, 5000].forEach(function (t) { setTimeout(sync, t); }); }); });
      try { window.addEventListener("njacc:jobs-changed", sync); GN568(no, function () { window.removeEventListener("njacc:jobs-changed", sync); }); } catch (e) {}   /* V.568 : ปิดหน้าต่างแล้วถอด Listener */
    }
    /* V.548 : DOCUMENT \u2014 SERVICE \u0E41\u0E2A\u0E14\u0E07\u0E02\u0E49\u0E2D 1\u20136 \u0E02\u0E22\u0E32\u0E22\u0E40\u0E15\u0E47\u0E21\u0E40\u0E2A\u0E21\u0E2D \u00B7 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1E\u0E31\u0E1A (\u0E44\u0E21\u0E48\u0E1C\u0E39\u0E01\u0E04\u0E25\u0E34\u0E01\u0E1E\u0E31\u0E1A/\u0E02\u0E22\u0E32\u0E22) */
    md.classList.add("jm548-flat");
    [1, 2, 3, 4, 5, 6].forEach(function (n) { secs[n] && AC546.setOpen(secs[n].el, true); secs[n] && secs[n].head.setAttribute("tabindex", "-1"); });
  } catch (e) { try { console.warn("LY546", e); } catch (_e) {} }
}

/* V.547 : \u0E02\u0E49\u0E2D 5 \u0E16\u0E39\u0E01\u0E0B\u0E48\u0E2D\u0E19 (USER) \u2192 \u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07 credit_term_days / due_date / invoice_date \u0E43\u0E19 payload (\u0E04\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48 ACCOUNTING \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 \u00B7 \u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A RUN-131) */
/* V.575 : ตัวตรวจสิทธิ์มองเห็นข้อมูลวางบิล / INVOICE ใน MASTER — ใช้ระบบสิทธิ์เดิม (allowed_modules ที่ Server คืนมา + สิทธิ์ action ตาม Role เดิม) ไม่เพิ่มเงื่อนไขใหม่ */
function PV575() { try { return !!(MA575("ACCOUNTING") && CAN575("view")); } catch (e) { return false; } }

function NB547(p) { try { var s = p && p.closest && p.closest(".modal") && p.closest(".modal").querySelector('.jm546-sec[data-sec="5"]'); var m = p && p.closest && p.closest(".modal"); if (m && m.classList.contains("jm556") && m.dataset.ed556 === "1") return true; if (m && m.classList.contains("jm557") && m.dataset.ed557 === "1") return true; return !!(s && s.classList.contains("jm546-hide")); } catch (e) { return false; } }

/* V.549 \u00B7 DOCUMENT \u2014 ADVANCE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E15\u0E48\u0E2D\u0E08\u0E32\u0E01 LY542 \u2014 \u0E41\u0E2A\u0E14\u0E07\u0E40\u0E15\u0E47\u0E21\u0E17\u0E38\u0E01\u0E2A\u0E48\u0E27\u0E19 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E31\u0E1A \u00B7 \u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C / SAVE / POST / Mapping
   \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : INVOICE ADV (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u00B7 \u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07\u0E08\u0E32\u0E01 INVOICE \u0E02\u0E2D\u0E07 JOB \u0E40\u0E14\u0E34\u0E21) \u00B7 Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date (\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21 \u0E22\u0E49\u0E32\u0E22\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)
   \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE (ADVANCE) : \u0E15\u0E32\u0E23\u0E32\u0E07\u0E40\u0E15\u0E47\u0E21 + \u0E2A\u0E23\u0E38\u0E1B\u0E22\u0E2D\u0E14 (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u00B7 njacc_invoice_draft_view = STABLE \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07 Draft) \u2014 \u0E01\u0E32\u0E23\u0E01\u0E23\u0E2D\u0E01/POST \u0E22\u0E31\u0E07\u0E17\u0E33\u0E17\u0E35\u0E48 ACCOUNTING \u0E15\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21 */
function LY548A(p, r) {
  try {
    var md = p.closest(".modal"); if (!md || md.classList.contains("jm548a")) return;
    var mo = md.querySelector(".jm542-more"); if (!mo) return;
    var F = function (id) { var x = md.querySelector("#" + id); return x ? x.closest(".fld") : null; },
      fi = F("nj-invdate"), ft = F("nj-term"), fd = F("nj-due");
    if (!fi || !ft || !fd) return;
    md.classList.add("jm548a");
    /* V.556 : DOCUMENT \u2014 ADVANCE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) \u0E0B\u0E48\u0E2D\u0E19 "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25" \u00B7 "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE (ADVANCE)" \u00B7 \u0E1B\u0E49\u0E32\u0E22\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48/\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19 \u2014 UI \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E04\u0E23\u0E1A)
       \u0E43\u0E0A\u0E49\u0E04\u0E25\u0E32\u0E2A\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07 DOCUMENT \u0E19\u0E35\u0E49\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (LY548A \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E40\u0E23\u0E35\u0E22\u0E01\u0E43\u0E19 ACCOUNTING) \u00B7 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19\u0E40\u0E14\u0E34\u0E21 \u2192 \u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07 Credit Term / Due Date / Date (\u0E04\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48 ACCOUNTING \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u00B7 NB547) */
    md.classList.add("jm556"); if (r && r.id) md.dataset.ed556 = "1";
    var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); },
      fmt = function (n) { n = Number(n || 0); return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
      el = function (tag, cls, html) { var d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
    /* 1) \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 : INVOICE ADV \u00B7 Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u00B7 Credit Term \u00B7 Due Date (\u0E41\u0E16\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27) */
    var inv = el("div", "fld jm548a-invfld", '<label>INVOICE ADV</label><div class="inp jm548a-invno" id="nj-invadv548">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02</div>');
    SF551.advMore(md, "nj-", mo, inv);   /* V.551 : \u0E41\u0E16\u0E27\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E08\u0E32\u0E01\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A (\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A ACCOUNTING \u2014 ADVANCE) */
    /* 2) \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE (ADVANCE) */
    var IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
      TR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
      SR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
    var g = el("div", "jm542-g jm548a-inv jm548-flat");
    var hd = el("div", "jm542-t jm548a-t", '<span class="jm542-ti">' + IC + "</span><span>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 INVOICE (ADVANCE)</span>");
    var add = el("button", "btn btn-p jm546-add6 jm548a-add", "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"); add.type = "button"; add.disabled = true; add.title = "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48 ACCOUNTING \u2014 ADVANCE";
    hd.appendChild(add); g.appendChild(hd);
    var box = el("div", "jm546-inv6 jm548a-box"); box.id = "nj-invadv548-tbl"; g.appendChild(box);
    mo.parentNode.insertBefore(g, mo.nextSibling);
    /* V.575 : ข้อมูลเพิ่มเติม / วางบิล + รายการ INVOICE (ADVANCE) แสดงตาม Permission เดิมของระบบ (โมดูล ACCOUNTING · สิทธิ์ view ของ ADVANCE) · ไม่มีสิทธิ์ = ไม่แสดง + ไม่เรียกอ่าน INVOICE */
    var see575 = PV575(); if (!see575) { mo.hidden = true; g.hidden = true; }
    var asc = true, last = null;
    var render = function (v) { last = v; SF551.invView(box, v, { p: "njad6", kind: "Receipt" }); };   /* V.552 : \u0E15\u0E32\u0E23\u0E32\u0E07 INVOICE \u0E01\u0E25\u0E32\u0E07 (SF551.invView) */
    var realNo = function (v) { return v && v.invoice_no && v.has_real_no !== false && !/^DRAFT-/i.test(String(v.invoice_no)) ? String(v.invoice_no) : ""; },
      setInv = function (v) { var e = md.querySelector("#nj-invadv548"); if (!e) return; var n = realNo(v); e.textContent = n || "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02"; e.classList.toggle("has", !!n); },
      busy = null,
      refresh = function () { if (!(r && r.id) || busy || !see575) return;
        busy = Promise.resolve().then(function () { return RPC546("njacc_invoice_draft_view", { p_job: r.id }); })
          .then(function (v) { busy = null; v = v || null; setInv(v); render(v); }, function (er) { busy = null; var dn = /FORBIDDEN/i.test(String((er && er.code || "") + " " + (er && er.message || er))); if (dn) { var e5 = md.querySelector("#nj-invadv548"); e5 && (e5.textContent = "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E14\u0E39 (\u0E40\u0E09\u0E1E\u0E32\u0E30 ACCOUNTING)", e5.classList.remove("has"), e5.classList.add("sf554-deny5")); SF551.invView(box, null, { p: "njad6", kind: "Receipt", denied: true }); } else render(null); }); };
    render(null);
    refresh();
    try { var ev = function (e) { if (!p.isConnected) { window.removeEventListener("njacc:jobs-changed", ev); return; }
      var ids = e && e.detail && e.detail.ids; if (r && r.id && Array.isArray(ids) && (ids.indexOf("*") >= 0 || ids.indexOf(String(r.id)) >= 0)) refresh(); }; window.addEventListener("njacc:jobs-changed", ev); GN568(p, function () { window.removeEventListener("njacc:jobs-changed", ev); }); } catch (e) {}   /* V.568 */
  } catch (e) { try { console.warn("LY548A", e); } catch (_e) {} }
}

/* V.562 \u00B7 DOCUMENT \u2014 ADVANCE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E2B\u0E25\u0E31\u0E07 LY542 / LY548A (\u0E04\u0E25\u0E32\u0E2A .jm562 \u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E19\u0E35\u0E49 \u00B7 ACCOUNTING \u2014 ADVANCE / SERVICE \u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E08\u0E38\u0E14\u0E19\u0E35\u0E49)
   1) \u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E23\u0E2D\u0E1A\u0E0A\u0E21\u0E1E\u0E39\u0E22\u0E38\u0E1A\u2013\u0E02\u0E22\u0E32\u0E22 : \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E15\u0E49\u0E0A\u0E48\u0E2D\u0E07\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 (.jm-comp-pick / .jm-cust-pick) \u0E0B\u0E48\u0E2D\u0E19\u0E14\u0E49\u0E27\u0E22 hidden (display:none) \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u2192 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E41\u0E16\u0E27\u0E2A\u0E39\u0E07\u0E02\u0E36\u0E49\u0E19 24px
      \u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E15\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48 \u2192 \u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E2A\u0E39\u0E07\u0E15\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32 + \u0E08\u0E31\u0E14\u0E01\u0E36\u0E48\u0E07\u0E01\u0E25\u0E32\u0E07\u0E43\u0E2B\u0E21\u0E48 = \u0E2B\u0E31\u0E27 / \u0E1B\u0E38\u0E48\u0E21\u0E25\u0E48\u0E32\u0E07\u0E01\u0E23\u0E30\u0E42\u0E14\u0E14
      \u0E41\u0E01\u0E49 : CSS \u0E08\u0E2D\u0E07\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 1 \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E44\u0E27\u0E49\u0E40\u0E2A\u0E21\u0E2D (\u0E0B\u0E48\u0E2D\u0E19\u0E41\u0E1A\u0E1A visibility) \u00B7 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E15\u0E31\u0E14 \u2026 \u00B7 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E15\u0E47\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 title
   2) \u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E01\u0E2A\u0E39\u0E07\u0E02\u0E36\u0E49\u0E19 25% \u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E40\u0E14\u0E34\u0E21 (\u0E27\u0E31\u0E14\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E08\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27\u0E40\u0E2A\u0E23\u0E47\u0E08) \u00B7 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E40\u0E14\u0E34\u0E21 \u00B7 \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E2D (CSS max-height) \u00B7 \u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32 \u00B7 \u0E1B\u0E38\u0E48\u0E21\u0E25\u0E48\u0E32\u0E07\u0E0A\u0E34\u0E14\u0E02\u0E2D\u0E1A\u0E25\u0E48\u0E32\u0E07
   3) \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 Dropdown \u0E42\u0E2B\u0E21\u0E14 : \u0E43\u0E0A\u0E49\u0E15\u0E31\u0E27\u0E08\u0E31\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E01\u0E25\u0E32\u0E07 DD559 (\u0E25\u0E2D\u0E22\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32 \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E31\u0E14 \u0E44\u0E21\u0E48\u0E14\u0E31\u0E19\u0E01\u0E23\u0E2D\u0E1A) */
function SZ562(p) {
  try {
    var md = p.closest(".modal"); if (!md || md.classList.contains("jm562")) return;
    md.classList.add("jm562");
    var mg = p.querySelector(".jm542-main"); mg && DD559.row(mg, "nj-");
    Array.prototype.forEach.call(p.querySelectorAll(".jm-comp-pick, .jm-cust-pick"), function (k) {
      var t = function () { var x = (k.textContent || "").trim(); x ? k.setAttribute("title", x) : k.removeAttribute("title"); };
      t(); try { new MutationObserver(t).observe(k, { childList: true, characterData: true, subtree: true }); } catch (e) {}
    });
    var fit = function () { if (!md.isConnected) return; md.style.removeProperty("height"); var h = md.getBoundingClientRect().height; if (h > 0) md.style.setProperty("height", Math.round(h * 1.25) + "px", "important"); };
    var n = 0, wait = function () { if (!md.isConnected) return; if (md.querySelector(".jm542-card") || ++n > 100) { requestAnimationFrame(fit); return; } setTimeout(wait, 20); };
    wait();
    var tm = null, rs = function () { if (!md.isConnected) { window.removeEventListener("resize", rs); return; } clearTimeout(tm); tm = setTimeout(fit, 120); };
    window.addEventListener("resize", rs); GN568(md, function () { clearTimeout(tm); window.removeEventListener("resize", rs); });   /* V.568 */
  } catch (e) { try { console.warn("SZ562", e); } catch (_e) {} }
}

/* V.581 \u00B7 DOCUMENT \u2014 SERVICE / ADVANCE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E22\u0E49\u0E32\u0E22\u0E1B\u0E38\u0E48\u0E21\u0E40\u0E14\u0E34\u0E21 "Upload PDF Entry" (+ input file \u0E40\u0E14\u0E34\u0E21) \u0E08\u0E32\u0E01\u0E41\u0E16\u0E1A\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07
   \u2192 \u0E41\u0E16\u0E27\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D 1 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19 (SERVICE) / \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01 (ADVANCE) \u0E0A\u0E34\u0E14\u0E02\u0E27\u0E32 \u00B7 \u0E22\u0E49\u0E32\u0E22 Node \u0E40\u0E14\u0E34\u0E21 = Event / \u0E2D\u0E48\u0E32\u0E19 PDF / OCR / Mapping \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u00B7 \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1B\u0E38\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48
   ADVANCE : \u0E23\u0E2D\u0E43\u0E2B\u0E49 LY542 \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14 AD / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 \u0E1A\u0E19\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E01\u0E48\u0E2D\u0E19 (LY542 \u0E22\u0E49\u0E32\u0E22\u0E1B\u0E38\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E41\u0E1A\u0E1A\u0E2B\u0E19\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32) \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E22\u0E49\u0E32\u0E22\u0E25\u0E07 \u00B7 ACCOUNTING \u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E08\u0E38\u0E14\u0E19\u0E35\u0E49 */
function MV581(p, e) {
  try {
    var md = p.closest(".modal"); if (!md || md.classList.contains("jm581")) return;
    var adv = e === "ADVANCE", tries = 0;
    var go = function () {
      if (!md.isConnected) return true;
      var pb = md.querySelector("#nj-pdf-btn"), pf = md.querySelector("#nj-pdf-file"),
        row = adv ? md.querySelector(".jm542-main>.jm542-t") : md.querySelector('.jm546-sec[data-sec="1"]>.jm546-hrow');
      if (!pb || !row || (adv && !md.querySelector(".modal-h-x .jm542-c-ad"))) return false;
      md.classList.add("jm581", adv ? "jm581-adv" : "jm581-svc"); row.classList.add("jm581-row");
      row.appendChild(pb); pf && row.appendChild(pf);
      return true;
    };
    var run = function () { if (go() || ++tries > 150) return; setTimeout(run, 20); };
    run();
  } catch (x) { try { console.warn("MV581", x); } catch (_) {} }
}

/* V.563 \u00B7 DOCUMENT \u2014 SERVICE \u0E41\u0E25\u0E30 DOCUMENT \u2014 ADVANCE (\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19) : \u0E2A\u0E48\u0E27\u0E19\u0E2B\u0E31\u0E27\u0E19\u0E49\u0E33\u0E40\u0E07\u0E34\u0E19\u0E44\u0E25\u0E48\u0E40\u0E09\u0E14\u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 (CSS .jm563) \u2014 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07 DOCUMENT \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (!u) \u00B7 ACCOUNTING \u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E08\u0E38\u0E14\u0E19\u0E35\u0E49
   \u0E43\u0E0A\u0E49 Element \u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 : #nj-autono (JOB NJ / AD) \u00B7 #nj-jobdate (\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19) \u0E43\u0E2A\u0E48\u0E04\u0E25\u0E32\u0E2A\u0E23\u0E48\u0E27\u0E21 .jm563-box \u0E43\u0E2B\u0E49\u0E02\u0E19\u0E32\u0E14\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19
   "\u0E23\u0E2D POST" : \u0E0B\u0E48\u0E2D\u0E19\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25 (\u0E1B\u0E49\u0E32\u0E22 .jm546-st \u0E02\u0E2D\u0E07 LY546 \u0E0B\u0E48\u0E2D\u0E19\u0E14\u0E49\u0E27\u0E22 CSS) \u00B7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07 \u2192 \u0E0A\u0E48\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E07 (\u0E0B\u0E48\u0E2D\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E14\u0E49\u0E27\u0E22 .jm563-empty \u2014 \u0E04\u0E48\u0E32\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49)
   \u0E01\u0E0E "\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07" \u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A LY546 \u00B7 \u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33\u0E2B\u0E25\u0E31\u0E07\u0E01\u0E14 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 / POST \u0E41\u0E25\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D njacc:jobs-changed (\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21) */
function HD563(p, e) {
  try {
    var md = p.closest(".modal"); if (!md || md.classList.contains("jm563")) return;
    md.classList.add("jm563", e === "ADVANCE" ? "jm563-adv" : "jm563-svc");
    var h3 = md.querySelector(":scope>.modal-h>h3");
    if (h3 && !h3.querySelector(".jm558-hi, .jm563-hi")) {
      var ic = document.createElement("span"); ic.className = "jm563-hi"; ic.setAttribute("aria-hidden", "true");
      ic.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></svg>';
      h3.insertBefore(ic, h3.firstChild);
    }
    h3 && h3.setAttribute("title", (h3.textContent || "").trim());
    var no = md.querySelector("#nj-autono"), jd = md.querySelector("#nj-jobdate");
    no && no.classList.add("jm563-box"); jd && jd.classList.add("jm563-box");
    if (!no) return;
    var sync = function () { if (!no.isConnected) { window.removeEventListener("njacc:jobs-changed", sync); return; }
      var v = String(no.value || "").trim(), real = /^[A-Z]{2,6}\d{4}-\d{3,6}$/i.test(v);
      no.classList.toggle("jm563-empty", !real); real ? no.setAttribute("title", v) : no.removeAttribute("title"); };
    sync();
    ["#nj-save", "#nj-post"].forEach(function (sel) { var b = md.querySelector(sel); b && b.addEventListener("click", function () { [400, 1200, 2500, 5000].forEach(function (t) { setTimeout(sync, t); }); }); });
    try { window.addEventListener("njacc:jobs-changed", sync); GN568(no, function () { window.removeEventListener("njacc:jobs-changed", sync); }); } catch (er) {}   /* V.568 */
  } catch (er) { try { console.warn("HD563", er); } catch (_e) {} }
}

/* ═══ V.698 · DOCUMENT / ACCOUNTING → ADVANCE : Section "เบิกเงินสำรองจ่าย" (Payment Items + สรุปยอด + AUTO SUMMARY + TIMELINE HISTORY)
   แทรกระหว่าง "ข้อมูลหลัก (ฟิลด์บังคับ)" กับ "ข้อมูลเพิ่มเติม / วางบิล" — ไม่ย้าย / ไม่แก้ช่องเดิม · ไม่แตะ "หมายเหตุ" / "ยอดเงิน" เดิม
   ข้อมูลชุดเดียวต่อ JOB (DOCUMENT + ACCOUNTING) : RPC ใหม่ njacc_adv698_get / njacc_adv698_save (RUN-698) · บันทึกหลัง SAVE เดิมสำเร็จเท่านั้น (เฉพาะเมื่อมีการแก้ไข)
   คำนวณตาม Advance v.7 : หัก = ก่อนหัก × หัก% ÷ 100 · หลังหัก = ก่อนหัก − หัก · VAT = ก่อนหัก × VAT% ÷ 100 · จ่ายจริง = หลังหัก + VAT (ปัด 2 ตำแหน่ง · ฐานข้อมูลคำนวณซ้ำ) ═══ */
var AD698 = (function () {
  var TYPES = ["ค่าแลก D/O", "ค่า STORAGE", "ค่าภาษี", "ค่ามัดจำตู้", "ค่า DEMURRAGE", "ค่า DETENTION", "ค่าโกดัง", "ค่าธรรมเนียม", "ค่าซ่อมตู้", "TERMINAL HANDLING CHARGE", "B/L FEE", "ค่าอื่นๆ"];
  var BANKS = ["กสิกรไทย", "ไทยพาณิชย์", "ทหารไทยธนชาต", "กรุงเทพ", "กรุงศรีอยุธยา", "กรุงไทย", "ออมสิน", "HSBC", "JP Morgan Chase", "สแกน QR CODE"];
  var CARRY = null, KEEP = false, SEQ = 0;
  var IC = {
    wal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 14h.01"/></svg>',
    card: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
    note: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    sum: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    clk: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    ed: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    del: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>'
  };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v) { var s = String(v == null ? "" : v).replace(/,/g, "").trim(); if (!s) return 0; var n = Number(s); return isFinite(n) && n >= 0 ? n : 0; }
  function r2(x) { x = Number(x) || 0; var s = x < 0 ? -1 : 1; return s * Math.round(Math.abs(x) * 100 * (1 + 1e-12)) / 100; }
  function calc(it) {
    var g = r2(num(it.gross)), dp = Math.min(100, num(it.deduct_pct)), vp = Math.min(100, num(it.vat_pct)), d = r2(g * dp / 100), v = r2(g * vp / 100);
    return { g: g, dp: dp, vp: vp, d: d, n: r2(g - d), v: v, real: r2(g - d + v) };
  }
  function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fp(x) { var n = Number(x) || 0; return String(Math.round(n * 10000) / 10000); }
  function used(it) { return !!(String(it.payment_type || "").trim() || String(it.bank_name || "").trim() || String(it.account_no || "").trim() || String(it.account_name || "").trim() || num(it.gross)); }
  function totals(items) {
    var t = { n: 0, g: 0, d: 0, net: 0, v: 0, real: 0 };
    items.forEach(function (it) { if (!used(it)) return; var c = calc(it); t.n++; t.g += c.g; t.d += c.d; t.net += c.n; t.v += c.v; t.real += c.real; });
    ["g", "d", "net", "v", "real"].forEach(function (k) { t[k] = r2(t[k]); });
    return t;
  }
  function norm(it) {
    it = it || {};
    var s = function (v) { return v == null ? "" : String(v); }, n = function (v) { return v == null || v === "" ? "" : fp(v); };
    return { payment_type: s(it.payment_type), bank_name: s(it.bank_name), account_no: s(it.account_no), account_name: s(it.account_name),
      gross: it.gross == null || it.gross === "" ? "" : String(r2(it.gross)), deduct_pct: n(it.deduct_pct), vat_pct: n(it.vat_pct) };
  }
  function pack(it) { return { payment_type: String(it.payment_type || "").trim(), bank_name: String(it.bank_name || "").trim(), account_no: String(it.account_no || "").trim(),
    account_name: String(it.account_name || "").trim(), gross: String(r2(num(it.gross))), deduct_pct: String(Math.min(100, num(it.deduct_pct))), vat_pct: String(Math.min(100, num(it.vat_pct))) }; }
  function errMsg(e) {
    var m = String(e && (e.message || e.code) || e || "");
    if (/NJACC_ADV698_CONFLICT/.test(m)) return "เบิกเงินสำรองจ่าย : รายการจ่ายถูกแก้ไขจากหน้าจออื่นหลังจากเปิดหน้าต่างนี้ — ปิดแล้วเปิดงานใหม่เพื่อโหลดข้อมูลล่าสุด (ข้อมูลส่วนอื่นบันทึกแล้ว)";
    if (/NJACC_ADV698_AMOUNT_INVALID|NJACC_ADV698_ITEMS_INVALID/.test(m)) return "เบิกเงินสำรองจ่าย : ตัวเลขไม่ถูกต้อง (ยอดเงินต้องไม่ติดลบ · % อยู่ระหว่าง 0–100)";
    if (/NJACC_ADV698_TOO_MANY/.test(m)) return "เบิกเงินสำรองจ่าย : รายการจ่ายเกิน 200 รายการ";
    if (/njacc_adv698_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "เบิกเงินสำรองจ่าย : ฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-698 ก่อน)";
    if (/NJACC_FORBIDDEN|NJACC_MODULE_FORBIDDEN/.test(m)) return "เบิกเงินสำรองจ่าย : ไม่มีสิทธิ์แก้ไข / เปิดดูรายการจ่ายของงานนี้";
    if (/NJACC_JOB_CANCELED/.test(m)) return "เบิกเงินสำรองจ่าย : งานถูกยกเลิกแล้ว — แก้ไขรายการจ่ายไม่ได้";
    return "เบิกเงินสำรองจ่าย : " + (m || "บันทึกไม่สำเร็จ");
  }
  function css() {
    if (document.getElementById("ad698-css")) return;
    var s = document.createElement("style"); s.id = "ad698-css";
    s.textContent = [
      ".ad698{background:#fff;border:1px solid #bfdbfe;border-radius:12px;padding:0 14px 12px;margin:0 0 12px;min-width:0;max-width:100%;box-sizing:border-box}",
      ".ad698 *{box-sizing:border-box}",
      ".ad698-h{display:flex;align-items:center;gap:10px;background:#eff6ff;margin:0 -14px 10px;padding:9px 14px;border-radius:11px 11px 0 0;border-bottom:1px solid #dbeafe}",
      ".ad698-hi{flex:none;width:30px;height:30px;border-radius:8px;background:#3b82f6;color:#fff;display:inline-flex;align-items:center;justify-content:center}",
      ".ad698-ht{font-weight:700;font-size:16px;color:#1d4ed8}",
      ".ad698-ro{margin-left:auto;font-size:12px;color:#64748b;font-weight:500}",
      ".ad698-sub{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px;flex-wrap:wrap}",
      ".ad698-st{display:flex;align-items:center;gap:7px;font-weight:600;font-size:14px;color:#1e3a8a}",
      ".ad698-add{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 12px;border:1px solid #2563eb;border-radius:8px;background:#fff;color:#1d4ed8;font-weight:600;font-size:13px;cursor:pointer}",
      ".ad698-add:hover{background:#eff6ff}",
      ".ad698-tw{overflow-x:auto;max-width:100%;border:1px solid #e2e8f0;border-radius:8px;-webkit-overflow-scrolling:touch}",
      ".ad698-tb{width:100%;min-width:1180px;border-collapse:collapse;font-size:13px}",
      ".ad698-tb th{background:#f1f5f9;color:#334155;font-weight:600;text-align:left;padding:7px 6px;white-space:nowrap;border-bottom:1px solid #e2e8f0}",
      ".ad698-tb td{padding:5px 6px;border-bottom:1px solid #f1f5f9;vertical-align:middle}",
      ".ad698-tb tr:last-child td{border-bottom:0}",
      ".ad698-tb .r{text-align:right}.ad698-tb .c{text-align:center}",
      ".ad698-tb input{width:100%;min-width:0;height:32px;font-size:13px;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#0f172a;font-family:inherit}",
      ".ad698-tb input:focus{outline:2px solid #bfdbfe;border-color:#3b82f6}",
      ".ad698-tb input.r{text-align:right}",
      ".ad698-an{display:flex;gap:4px;align-items:center}",
      ".ad698-ib{flex:none;width:30px;height:30px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#2563eb;padding:0}",
      ".ad698-ib:hover{background:#eff6ff}.ad698-ib.del{color:#dc2626;border-color:#fecaca;background:#fef2f2}.ad698-ib.del:hover{background:#fee2e2}",
      ".ad698-act{display:flex;gap:4px;justify-content:center}",
      ".ad698-cv{display:block;text-align:right;padding:6px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;white-space:nowrap;min-height:32px}",
      ".ad698-cv.g{background:#f0fdf4;border-color:#bbf7d0;color:#166534;font-weight:600}",
      ".ad698-tx{white-space:nowrap}",
      ".ad698-emp{text-align:center;color:#64748b;padding:14px 6px!important}",
      ".ad698-sum{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:10px 0 12px}",
      ".ad698-sb{background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;padding:8px 12px;min-width:0}",
      ".ad698-sb span{display:block;font-size:12px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".ad698-sb b{display:block;font-size:17px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".ad698-sb.g{background:#ecfdf5;border-color:#bbf7d0}.ad698-sb.g span{color:#15803d}.ad698-sb.g b{color:#166534}",
      ".ad698-nh{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-weight:700;font-size:14px;color:#7e22ce}",
      ".ad698-nh i{flex:none;width:24px;height:24px;border-radius:6px;background:#f3e8ff;color:#7e22ce;display:inline-flex;align-items:center;justify-content:center;font-style:normal}",
      ".ad698-ng{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:10px}",
      ".ad698-box{border:1px solid #e2e8f0;border-radius:10px;min-width:0;display:flex;flex-direction:column;background:#fff}",
      ".ad698-bh{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-bottom:1px solid #e2e8f0;border-radius:10px 10px 0 0;font-weight:600;font-size:13px;min-height:38px}",
      ".ad698-bh>span{display:flex;align-items:center;gap:6px}",
      ".ad698-box.s .ad698-bh{background:#eff6ff;color:#1e3a8a}.ad698-box.t .ad698-bh{background:#f0fdf4;color:#166534;border-color:#dcfce7}.ad698-box.t{border-color:#dcfce7}",
      ".ad698-cp{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 10px;border:1px solid #2563eb;border-radius:7px;background:#fff;color:#1d4ed8;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}",
      ".ad698-cp:hover{background:#eff6ff}",
      ".ad698-pre{margin:0;padding:8px 10px;font:12.5px/1.55 inherit;font-family:inherit;color:#1e293b;white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto}",
      ".ad698-tl{list-style:none;margin:0;padding:6px 10px;max-height:280px;overflow:auto}",
      ".ad698-tl li{display:grid;grid-template-columns:12px 108px minmax(0,1fr);gap:8px;padding:5px 0;font-size:12.5px;border-bottom:1px dashed #eef2f7}",
      ".ad698-tl li:last-child{border-bottom:0}",
      ".ad698-dot{width:10px;height:10px;border-radius:50%;margin-top:4px;background:#64748b}",
      ".ad698-dot.c{background:#16a34a}.ad698-dot.e{background:#f59e0b}.ad698-dot.i{background:#2563eb}.ad698-dot.p{background:#7c3aed}.ad698-dot.x{background:#dc2626}",
      ".ad698-tt{color:#475569;white-space:nowrap}",
      ".ad698-tw2 b{display:block;color:#0f172a;font-weight:600}.ad698-tw2 small{display:block;color:#64748b;font-size:12px}",
      ".ad698-msg{padding:10px;color:#64748b;font-size:12.5px}.ad698-msg.err{color:#b91c1c}",
      ".ad698-vw{margin-top:12px}",
      ".ad698-pv{max-width:1100px;margin:14px auto 0}",
      "@media (max-width:760px){.ad698-sum{grid-template-columns:repeat(2,minmax(0,1fr))}.ad698-ng{grid-template-columns:minmax(0,1fr)}.ad698-tl li{grid-template-columns:12px 96px minmax(0,1fr)}}",
      "@media print{.ad698-pv{display:none!important}}"
    ].join("");
    document.head.appendChild(s);
  }
  function rpc(n, a) { return RPC546(n, a); }
  function profileName() { try { var p = ce && ce.profile; return p ? (p.full_name || p.nickname || "") : ""; } catch (e) { return ""; } }
  function dt(d) { d = d ? new Date(d) : new Date(); if (isNaN(d)) return { d: "-", t: "-" }; var p = function (x) { return String(x).padStart(2, "0"); };
    return { d: p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear(), t: p(d.getHours()) + "." + p(d.getMinutes()) }; }
  function txt(root, sel) { var el = root && root.querySelector(sel); if (!el) return ""; if (el.tagName === "SELECT") { var o = el.options[el.selectedIndex]; return o && o.value ? o.text.trim() : ""; } return String(el.value != null && el.tagName !== "DIV" && el.tagName !== "SPAN" ? el.value : el.textContent || "").trim(); }
  function ctx(st) {
    if (st.job) { var j = st.job; return { mode: j.data_type || "", job: j.job_no || "", comp: j.company_invoice || "", cust: j.customer_name || "", hbl: j.house_bl_no || "" }; }
    var r = st.root, P = st.P;
    var mode = txt(r, "#" + P + "mode") || txt(r, "#" + P + "mode-wrap select") || txt(r, "#" + P + "dtype");
    var jre = /^[A-Z]{2,}[A-Z0-9-]*\d/, a1 = txt(r, "#nj-autono"), a2 = txt(r, "#bm-jobno");
    var job = (jre.test(a1) ? a1 : "") || (jre.test(a2) ? a2 : "") || (st.jobNo || "");
    return { mode: mode, job: job, comp: txt(r, "#" + P + "comp"), cust: txt(r, "#" + P + "cust"), hbl: txt(r, "#" + P + "hbl") };
  }
  function summary(st) {
    var c = ctx(st), items = st.items.filter(used), t = totals(st.items), w = dt(st.view ? st.updatedAt : null), L = [];
    L.push("📋 สรุปรายการจ่าย ADVANCE");
    L.push("User: " + ((st.view ? st.updatedBy : profileName()) || "-"));
    L.push("วันที่: " + w.d + " เวลา: " + w.t + " น.");
    c.mode && L.push("โหมด: " + c.mode);
    L.push("เลข JOB: " + (c.job || "-"));
    L.push("Company Invoice: " + (c.comp || "-"));
    L.push("Customer Name: " + (c.cust || "-"));
    L.push("House B/L No.: " + (c.hbl || "-"));
    L.push("------------------------------");
    L.push("รายการจ่าย");
    if (!items.length) L.push("- ยังไม่มีรายการ -");
    items.forEach(function (it, i) {
      var k = calc(it);
      L.push((i + 1) + ". " + [it.payment_type || "-", it.bank_name || "-", it.account_no || "-", it.account_name || "-"].join(" | ") +
        " | ก่อนหัก " + fm(k.g) + " | หัก " + fp(k.dp) + "%" + " | หลังหัก " + fm(k.n) + " | VAT " + fp(k.vp) + "% " + fm(k.v) + " | จ่ายจริง " + fm(k.real));
    });
    L.push("------------------------------");
    L.push("สรุปยอดรวม " + t.n + " รายการ");
    L.push("รวมยอดก่อนหัก: " + fm(t.g) + " บาท | รวมหัก: " + fm(t.d) + " บาท | รวม VAT: " + fm(t.v) + " บาท");
    L.push("รวมจ่ายจริงทั้งหมด: " + fm(t.real) + " บาท");
    return L.join("\n");
  }
  var TL = {
    CREATE_JOB: ["สร้างงาน", "c"], EDIT_JOB: ["แก้ไขงาน", "e"], EDIT_JOB_DOC_FIELDS: ["แก้ไขงาน", "e"], EDIT_JOB_CHECKLIST: ["แก้ไขงาน", "e"],
    POST_JOB: ["ออกเลขงาน (POST)", "p"], SET_JOB_STATUS: ["เปลี่ยนสถานะงาน", "s"], CANCEL_JOB: ["ยกเลิกงาน", "x"], RETURN_JOB_TO_DOCUMENT: ["ย้อนกลับ DOCUMENT", "x"],
    ACC_HANDOFF: ["ส่งต่อ FINANCE", "p"], ACC_REOPEN: ["เปิดกลับ ACCOUNTING", "s"], BULK_SET_CASE: ["กำหนด Case", "e"], EXPORT_CHARGES: ["ส่งออก Excel", "s"],
    ADV698_ITEMS: ["บันทึกรายการจ่าย", "i"], ADVANCE_PAY: ["ยืนยันจ่ายแล้ว (PAY)", "p"], ADVANCE_UNPAY: ["ย้อนกลับ PAY", "x"],
    SAVE_INVOICE_DRAFT: ["บันทึก INVOICE ADV (ร่าง)", "e"], ISSUE_INVOICE_NO_ON_SAVE: ["ออกเลข INVOICE ADV", "p"], POST_DRAFT_INVOICE: ["POST INVOICE ADV", "p"],
    POST_INVOICE: ["POST INVOICE ADV", "p"], UNPOST_INVOICE: ["UNPOST INVOICE ADV", "x"], UNPOST_TO_DRAFT: ["UNPOST INVOICE ADV", "x"], VOID_INVOICE: ["VOID INVOICE ADV", "x"],
    EDIT_INVOICE_DATE: ["แก้วันที่ INVOICE ADV", "e"], RESET_INVOICE_NO: ["รีเซ็ตเลข INVOICE ADV", "s"]
  };
  function tlRows(list) {
    var out = [];
    (list || []).forEach(function (ev) {
      var m = TL[ev.action] || [String(ev.action || "").replace(/_/g, " "), "s"], d = ev.detail || {}, sub = [];
      if (ev.action === "ADV698_ITEMS") { sub.push((d.count != null ? d.count : 0) + " รายการ"); d.total_real != null && sub.push("รวมจ่ายจริง " + fm(d.total_real) + " บาท"); }
      else {
        d.status && sub.push("สถานะ " + (d.status_before ? d.status_before + " → " : "") + d.status);
        d.to_status && sub.push("สถานะ " + (d.from_status ? d.from_status + " → " : "") + d.to_status);
        d.invoice_no && !/^DRAFT-/i.test(d.invoice_no) && sub.push(d.invoice_no);
        d.reason && sub.push("เหตุผล: " + d.reason);
      }
      var row = { at: ev.at, by: ev.by || "-", label: m[0], cls: m[1], sub: sub.join(" · "), act: ev.action };
      var last = out[out.length - 1];
      /* ไม่ซ้ำ : เหตุการณ์ "แก้ไขงาน" / บันทึกร่าง INVOICE ต่อเนื่องของผู้ใช้เดียวกันภายใน 2 นาที = 1 รายการ (แสดงผลเท่านั้น · ประวัติจริงไม่ถูกแก้) */
      if (last && last.by === row.by && last.label === row.label && (row.cls === "e") && !row.sub && Math.abs(new Date(row.at) - new Date(last.at)) <= 120000) { last.at = row.at; return; }
      out.push(row);
    });
    return out;
  }
  function tlHTML(st) {
    if (!st.jobId) return '<div class="ad698-msg">ยังไม่มีประวัติ — บันทึกงานครั้งแรกแล้วจะแสดง Timeline</div>';
    if (st.err) return '<div class="ad698-msg err">' + esc(st.err) + "</div>";
    if (!st.loaded) return '<div class="ad698-msg">กำลังโหลด…</div>';
    var rows = tlRows(st.timeline);
    if (!rows.length) return '<div class="ad698-msg">ยังไม่มีประวัติ</div>';
    return '<ul class="ad698-tl">' + rows.map(function (r) { var w = dt(r.at);
      return '<li><span class="ad698-dot ' + r.cls + '"></span><span class="ad698-tt">' + w.d + " " + w.t.replace(".", ":") + '</span><span class="ad698-tw2"><b>' + esc(r.label) + " โดย " + esc(r.by) + "</b>" + (r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</span></li>"; }).join("") + "</ul>";
  }
  function rowHTML(st, it, i) {
    var k = calc(it), ro = st.roNow;
    if (ro) return "<tr><td class=\"c\">" + (i + 1) + "</td><td class=\"ad698-tx\">" + esc(it.payment_type || "-") + "</td><td class=\"ad698-tx\">" + esc(it.bank_name || "-") +
      '</td><td><div class="ad698-an"><span class="ad698-tx">' + esc(it.account_no || "-") + "</span>" + (it.account_no ? '<button type="button" class="ad698-ib" data-a6="cpacc" data-i="' + i + '" title="COPY เลขบัญชี">' + IC.cp + "</button>" : "") +
      "</div></td><td>" + esc(it.account_name || "-") + '</td><td class="r">' + fm(k.g) + '</td><td class="r">' + fp(k.dp) + '</td><td class="r">' + fp(k.vp) + '</td><td class="r">' + fm(k.v) +
      '</td><td class="r"><b>' + fm(k.real) + "</b></td></tr>";
    var dl = st.dl;
    return '<tr data-i="' + i + '"><td class="c">' + (i + 1) + "</td>" +
      '<td><input data-f6="payment_type" list="' + dl + 't" value="' + esc(it.payment_type) + '" placeholder="เลือก / พิมพ์ประเภท" maxlength="120"></td>' +
      '<td><input data-f6="bank_name" list="' + dl + 'b" value="' + esc(it.bank_name) + '" placeholder="เลือก / พิมพ์ธนาคาร" maxlength="80"></td>' +
      '<td><div class="ad698-an"><input data-f6="account_no" value="' + esc(it.account_no) + '" placeholder="เลขบัญชี" maxlength="60"><button type="button" class="ad698-ib" data-a6="cpacc" data-i="' + i + '" title="COPY เลขบัญชี">' + IC.cp + "</button></div></td>" +
      '<td><input data-f6="account_name" value="' + esc(it.account_name) + '" placeholder="ชื่อบัญชี" maxlength="150"></td>' +
      '<td><input class="r" data-f6="gross" inputmode="decimal" value="' + esc(it.gross) + '" placeholder="0.00"></td>' +
      '<td><input class="r" data-f6="deduct_pct" inputmode="decimal" value="' + esc(it.deduct_pct) + '" placeholder="0"></td>' +
      '<td><input class="r" data-f6="vat_pct" inputmode="decimal" value="' + esc(it.vat_pct) + '" placeholder="0"></td>' +
      '<td><span class="ad698-cv" data-c6="v">' + fm(k.v) + "</span></td>" +
      '<td><span class="ad698-cv g" data-c6="real">' + fm(k.real) + "</span></td>" +
      '<td><div class="ad698-act"><button type="button" class="ad698-ib" data-a6="edit" title="แก้ไขรายการ">' + IC.ed + '</button><button type="button" class="ad698-ib del" data-a6="del" title="ลบรายการ">' + IC.del + "</button></div></td></tr>";
  }
  function sumHTML(st) {
    var t = totals(st.items);
    return '<div class="ad698-sb"><span>รวมยอดก่อนหัก</span><b data-s6="g">' + fm(t.g) + '</b></div><div class="ad698-sb"><span>รวมหัก</span><b data-s6="d">' + fm(t.d) +
      '</b></div><div class="ad698-sb"><span>รวม VAT</span><b data-s6="v">' + fm(t.v) + '</b></div><div class="ad698-sb g"><span>รวมจ่ายจริงทั้งหมด (<i data-s6="n" style="font-style:normal">' + t.n + "</i> รายการ)</span><b data-s6=\"real\">" + fm(t.real) + "</b></div>";
  }
  function isRo(st) { try { return !!(st.view || (typeof st.ro === "function" && st.ro())); } catch (e) { return false; } }
  function render(st) {
    var el = st.el; if (!el) return;
    st.roNow = isRo(st);
    var body;
    if (st.jobId && !st.loaded && !st.err) body = '<div class="ad698-msg">กำลังโหลดรายการจ่าย…</div>';
    else if (st.err && !st.loaded) body = '<div class="ad698-msg err">' + esc(st.err) + "</div>";
    else {
      var rows = st.items.map(function (it, i) { return rowHTML(st, it, i); }).join("");
      body = '<div class="ad698-tw"><table class="ad698-tb"><thead><tr><th class="c" style="width:38px">#</th><th style="width:170px">ประเภท</th><th style="width:150px">ธนาคาร</th><th style="width:180px">เลขบัญชี</th><th style="width:170px">ชื่อบัญชี</th><th class="r" style="width:120px">ยอดก่อนหัก</th><th class="r" style="width:76px">หัก %</th><th class="r" style="width:76px">VAT %</th><th class="r" style="width:110px">VAT</th><th class="r" style="width:120px">จ่ายจริง</th>' +
        (st.roNow ? "" : '<th class="c" style="width:80px">จัดการ</th>') + "</tr></thead><tbody>" +
        (rows || '<tr><td class="ad698-emp" colspan="' + (st.roNow ? 10 : 11) + '">ยังไม่มีรายการจ่าย' + (st.roNow ? "" : " — กด + เพิ่มรายการ") + "</td></tr>") + "</tbody></table></div>" +
        '<div class="ad698-sum">' + sumHTML(st) + "</div>";
    }
    el.innerHTML = '<div class="ad698-h"><span class="ad698-hi">' + IC.wal + '</span><span class="ad698-ht">เบิกเงินสำรองจ่าย</span>' + (st.roNow ? '<span class="ad698-ro">อ่านอย่างเดียว</span>' : "") + "</div>" +
      '<div class="ad698-sub"><span class="ad698-st">' + IC.card + "รายการจ่าย (Payment Items)</span>" + (st.roNow || !st.loaded ? "" : '<button type="button" class="ad698-add" data-a6="add">+ เพิ่มรายการ</button>') + "</div>" +
      body +
      '<div class="ad698-nh"><i>' + IC.note + "</i>หมายเหตุ / TIMELINE</div>" +
      '<div class="ad698-ng"><div class="ad698-box s"><div class="ad698-bh"><span>' + IC.sum + 'สรุปข้อมูลอัตโนมัติ (AUTO SUMMARY)</span><button type="button" class="ad698-cp" data-a6="cpsum">' + IC.cp + 'COPY ข้อความ</button></div><pre class="ad698-pre" data-s6="txt">' + esc(summary(st)) + "</pre></div>" +
      '<div class="ad698-box t"><div class="ad698-bh"><span>' + IC.clk + 'Timeline History</span></div><div data-s6="tl">' + tlHTML(st) + "</div></div></div>" +
      (st.roNow ? "" : '<datalist id="' + st.dl + 't">' + TYPES.map(function (x) { return '<option value="' + esc(x) + '">'; }).join("") + '</datalist><datalist id="' + st.dl + 'b">' + BANKS.map(function (x) { return '<option value="' + esc(x) + '">'; }).join("") + "</datalist>");
  }
  function upd(st) {
    var el = st.el; if (!el) return;
    el.querySelectorAll("tbody tr[data-i]").forEach(function (tr) {
      var it = st.items[Number(tr.dataset.i)]; if (!it) return; var k = calc(it);
      var v = tr.querySelector('[data-c6="v"]'), r = tr.querySelector('[data-c6="real"]'); v && (v.textContent = fm(k.v)); r && (r.textContent = fm(k.real));
    });
    var t = totals(st.items);
    ["g", "d", "v", "real", "n"].forEach(function (k) { var b = el.querySelector('[data-s6="' + k + '"]'); b && (b.textContent = k === "n" ? String(t.n) : fm(t[k])); });
    var tx = el.querySelector('[data-s6="txt"]'); tx && (tx.textContent = summary(st));
  }
  function copy(text, okMsg) {
    var done = function () { try { P(okMsg, "ok"); } catch (e) {} };
    try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, function () { fb(); }); return; } } catch (e) {}
    fb();
    function fb() { try { var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done(); } catch (e) { try { P("คัดลอกไม่สำเร็จ", "err"); } catch (_e) {} } }
  }
  function wire(st) {
    var el = st.el;
    el.addEventListener("input", function (ev) {
      var f = ev.target.closest && ev.target.closest("[data-f6]"); if (!f || st.roNow) return;
      var tr = f.closest("tr[data-i]"), it = tr && st.items[Number(tr.dataset.i)]; if (!it) return;
      var k = f.dataset.f6;
      if (k === "gross" || k === "deduct_pct" || k === "vat_pct") {
        var v = f.value.replace(/,/g, "").replace(/[^0-9.]/g, ""), p = v.indexOf(".");
        p >= 0 && (v = v.slice(0, p + 1) + v.slice(p + 1).replace(/\./g, ""));
        v !== f.value && (f.value = v);
      }
      it[k] = f.value; st.dirty = !0; upd(st);
    });
    el.addEventListener("change", function (ev) {
      var f = ev.target.closest && ev.target.closest("[data-f6]"); if (!f || st.roNow) return;
      var tr = f.closest("tr[data-i]"), it = tr && st.items[Number(tr.dataset.i)]; if (!it) return;
      var k = f.dataset.f6;
      if ((k === "deduct_pct" || k === "vat_pct") && f.value !== "" && num(f.value) > 100) { f.value = "100"; it[k] = "100"; st.dirty = !0; upd(st); try { P("% ต้องไม่เกิน 100", "err"); } catch (e) {} }
    });
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-a6]"); if (!b) return;
      var a = b.dataset.a6;
      if (a === "cpsum") { copy(summary(st), "คัดลอกข้อความสรุปแล้ว"); return; }
      if (a === "cpacc") { var it0 = st.items[Number(b.dataset.i)], no = it0 && String(it0.account_no || "").trim(); if (no) copy(no, "คัดลอกเลขบัญชีแล้ว"); else { try { P("ยังไม่มีเลขบัญชี", "err"); } catch (e) {} } return; }
      if (st.roNow) return;
      if (a === "add") { st.items.push(norm({})); st.dirty = !0; render(st); var ins = el.querySelectorAll('tbody tr[data-i] [data-f6="payment_type"]'); ins.length && ins[ins.length - 1].focus(); return; }
      var tr = b.closest("tr[data-i]"); if (!tr) return; var i = Number(tr.dataset.i);
      if (a === "edit") { var x = tr.querySelector('[data-f6="payment_type"]'); x && (x.focus(), x.select && x.select()); return; }
      if (a === "del") { st.items.splice(i, 1); st.dirty = !0; render(st); }
    });
  }
  async function load(st) {
    if (!st.jobId) { st.loaded = !0; render(st); return; }
    st.loaded = !1; st.err = ""; render(st);
    try {
      var r = await rpc("njacc_adv698_get", { p_job: st.jobId });
      if (!st.el || !st.el.isConnected) return;
      st.items = ((r && r.items) || []).map(norm); st.updatedAt = r && r.updated_at || null; st.updatedBy = r && r.updated_by || ""; st.timeline = (r && r.timeline) || [];
      st.loaded = !0; st.dirty = !1;
    } catch (e) { st.err = errMsg(e).replace(/^เบิกเงินสำรองจ่าย : /, "โหลดเบิกเงินสำรองจ่ายไม่ได้ — "); }
    render(st);
  }
  async function refresh(st) {
    if (!st || !st.jobId) return;
    try { var r = await rpc("njacc_adv698_get", { p_job: st.jobId }); st.timeline = (r && r.timeline) || st.timeline; st.updatedAt = r && r.updated_at || st.updatedAt; st.updatedBy = r && r.updated_by || st.updatedBy; } catch (e) {}
    var box = st.el && st.el.querySelector('[data-s6="tl"]'); box && (box.innerHTML = tlHTML(st));
  }
  function make(root, P, o) {
    css();
    var el = document.createElement("div"); el.className = "jm542-g ad698"; el.setAttribute("data-ad698", "1");
    var st = { root: root, P: P, el: el, jobId: o.jobId ? String(o.jobId) : null, items: [], loaded: !1, err: "", dirty: !1, updatedAt: null, updatedBy: "", timeline: [],
      ro: o.ro || null, view: !!o.view, job: o.job || null, dl: "ad698dl" + (++SEQ), jobNo: o.jobNo || "" };
    el.__ad698 = st;
    wire(st);
    return st;
  }
  /* ฟอร์มแก้ไข : DOCUMENT (nj-) · ACCOUNTING เปิดงาน (nj-) · ACCOUNTING ออกวางบิล (bmd-) · หน้าแก้ไขงาน (jf-) */
  function mount(root, P, o) {
    try {
      o = o || {};
      if (!root || root.querySelector("[data-ad698]")) return null;
      var mo = root.querySelector(".jm542-more"), ref = null, after = null;
      if (mo) ref = mo.parentElement && mo.parentElement.classList.contains("sf551-more") ? mo.parentElement : mo;
      else ref = root.querySelector(".jm-sec.jm-acc");
      if (!ref) { var ds = root.querySelectorAll(".jm-sec.jm-doc"); after = ds.length ? ds[ds.length - 1] : null; }
      if (!ref && !after) return null;
      var st = make(root, P, o);
      ref ? ref.parentNode.insertBefore(st.el, ref) : after.parentNode.insertBefore(st.el, after.nextSibling);
      root.__ad698 = st;
      var jid = st.jobId || null;
      if (CARRY && KEEP && CARRY.jobId === jid && Date.now() - CARRY.at < 18e5) {
        st.items = CARRY.items; st.dirty = CARRY.dirty; st.updatedAt = CARRY.updatedAt; st.updatedBy = CARRY.updatedBy; st.timeline = CARRY.timeline; st.loaded = CARRY.loaded; st.err = CARRY.err;
        CARRY = null; KEEP = !1; render(st);
        !st.loaded && st.jobId && load(st);
      } else { CARRY = null; KEEP = !1; load(st); }
      /* ACCOUNTING : สถานะอ่านอย่างเดียวตามตาราง INVOICE เดิม (POST แล้ว = ล็อก) — เปลี่ยนสถานะแล้ววาดใหม่ */
      if (o.watch) { try { var w = root.querySelector(o.watch); w && new MutationObserver(function () { var r0 = isRo(st); if (r0 !== st.roNow && st.loaded) render(st); }).observe(w, { attributes: !0, attributeFilter: ["disabled", "hidden"] }); } catch (e) {} }
      return st;
    } catch (e) { try { console.warn("AD698", e); } catch (_e) {} return null; }
  }
  /* หลัง SAVE เดิมสำเร็จ : บันทึกรายการจ่าย (เฉพาะเมื่อแก้ไข) แล้วโหลด Timeline ใหม่ · false = บันทึกรายการจ่ายไม่สำเร็จ (แจ้งเตือนแล้ว) */
  async function after(root, jobId) {
    var st = root && root.__ad698; if (!st) return !0;
    if (jobId) st.jobId = String(jobId);
    if (!st.jobId || !st.loaded) return !0;
    if (st.dirty && !isRo(st)) {
      try {
        var res = await rpc("njacc_adv698_save", { p: { id: st.jobId, expected_updated_at: st.updatedAt || null, items: st.items.filter(used).map(pack) } });
        st.items = ((res && res.items) || []).map(norm); st.updatedAt = res && res.updated_at || st.updatedAt; st.dirty = !1;
        render(st);
      } catch (e) { try { P(errMsg(e), "err"); } catch (_e) {} return !1; }
    }
    refresh(st);
    return !0;
  }
  /* Print Preview (DOCUMENT) : เก็บสถานะหน้าจอปัจจุบันไว้ — กลับจาก Preview แล้วรายการที่ยังไม่บันทึกไม่หาย */
  function carry(root, jobId) {
    var st = root && root.__ad698; KEEP = !1;
    CARRY = st ? { jobId: jobId ? String(jobId) : (st.jobId || null), items: st.items.map(function (x) { return Object.assign({}, x); }), dirty: st.dirty, updatedAt: st.updatedAt,
      updatedBy: st.updatedBy, timeline: st.timeline, loaded: st.loaded, err: st.err, at: Date.now(), ctx: ctx(st) } : null;
  }
  function keep() { KEEP = !0; }
  /* VIEW (หน้าเปิดดูงาน) : อ่านอย่างเดียว ต่อจากการ์ดข้อมูลงาน */
  function view(container, o) {
    try {
      if (!container || container.querySelector("[data-ad698]")) return null;
      var card = container.querySelector(".card"); if (!card) return null;
      var st = make(container, "", { jobId: o.jobId, view: !0, job: o.job || null });
      st.el.classList.add("ad698-vw");
      card.parentNode.insertBefore(st.el, card.nextSibling);
      load(st); return st;
    } catch (e) { try { console.warn("AD698v", e); } catch (_e) {} return null; }
  }
  /* PREVIEW (Print Preview — DOCUMENT) : แสดงใต้เอกสาร (อ่านอย่างเดียว · ไม่พิมพ์ — แบบฟอร์ม JOB FORM เดิมไม่เปลี่ยน) */
  function preview(body, o) {
    try {
      if (!body || body.querySelector("[data-ad698]")) return null;
      var jid = o.jobId ? String(o.jobId) : null, job = o.job || null;
      var st = make(body, "", { jobId: jid, view: !0, job: job });
      st.el.classList.add("ad698-pv");
      body.appendChild(st.el);
      if (CARRY && CARRY.jobId === jid) {
        st.items = CARRY.items.map(function (x) { return Object.assign({}, x); }); st.updatedAt = CARRY.updatedAt; st.updatedBy = CARRY.updatedBy || profileName(); st.timeline = CARRY.timeline; st.loaded = CARRY.loaded || !jid; st.err = CARRY.err;
        if (!job) st.job = { data_type: CARRY.ctx.mode, job_no: CARRY.ctx.job, company_invoice: CARRY.ctx.comp, customer_name: CARRY.ctx.cust, house_bl_no: CARRY.ctx.hbl };
        render(st);
      } else load(st);
      return st;
    } catch (e) { try { console.warn("AD698p", e); } catch (_e) {} return null; }
  }
  return { mount: mount, after: after, carry: carry, keep: keep, view: view, preview: preview, calc: calc, totals: totals };
})();

export{tt as openNewJobModal,Hl as render,SF551,AC546,AD698};
/* V.572 · DOCUMENT — SERVICE / ADVANCE หน้าต่างเปิดงาน/แก้ไขงาน : สีพื้นทึบปุ่ม COPY (ม่วง) และ POST (ส้ม · ยัง POST ไม่ได้ = ส้มอ่อน + กดไม่ได้ตาม disabled เดิม) — CSS เท่านั้น ไม่แตะเงื่อนไข/การทำงานของปุ่ม */
/* V.644 · DOCUMENT — SERVICE : ปุ่ม COPY AD → เปิด DOCUMENT — ADVANCE (สร้างงานใหม่) พร้อมข้อมูลจากงาน SERVICE ที่บันทึกล่าสุด
   COPY เฉพาะฟิลด์หัวข้อตรงกัน (Whitelist) · ไม่ SAVE / POST อัตโนมัติ · บันทึกด้วยปุ่มบันทึกเดิมของ ADVANCE (tt draft) · ไม่แตะงาน SERVICE ต้นฉบับ */
var KA644=["data_type","company_invoice_id","customer_id","customs_declaration_no","customer_job_no","source_invoice_no","house_bl_no","master_bl_no","note"];
async function CA644(x){var b=x.btn;if(!b||b.disabled||!x.jobId)return;var dt=!1;try{dt=!!x.dirty()}catch(e){dt=!1}
if(dt&&!window.confirm("\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 SERVICE \u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\nCOPY AD \u0E08\u0E30\u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01 COPY)\n\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"))return;
b.disabled=!0;var v;try{v=await Me(x.jobId)}catch(e){b.disabled=!1;throw e}
if(x.root&&!x.root.isConnected)return;
if(!v||String(v.charge_type||"").toUpperCase()!=="SERVICE"){b.disabled=!1;return}
var d={};KA644.forEach(function(k){v[k]!=null&&v[k]!==""&&(d[k]=v[k])});d.job_date=v.job_date||v.reference_date||ee(new Date);
await tt({charge:"ADVANCE",group:v.company_group||x.group,mode:x.mode,draft:d,onSaved:x.onSaved})}
/* V.649 · DOCUMENT — ADVANCE (แก้ไขงานที่บันทึกแล้ว) : ปุ่ม COPY JOB → เปิด DOCUMENT — ADVANCE งานใหม่ พร้อมข้อมูลทั้งหมดของงานเดิม (ฉบับที่บันทึกล่าสุด)
   ไม่ COPY : ID / เลข JOB / เลขเปิดงาน / สถานะ / ผู้สร้าง-ผู้แก้ไข / INVOICE ADV และข้อมูลบัญชี-การเงิน (Credit Term / Due Date / วันวางบิล / CASE / Contact / I BILLING / คืนงาน / เคลียร์เงินทดรอง)
   ไม่ COPY รายการ INVOICE (ADVANCE) (ข้อมูล ACCOUNTING · กรอกที่ ACCOUNTING ตาม Flow เดิม) · วันที่งาน = วันนี้ (แก้ได้ตามสิทธิ์เดิม V.614)
   ไม่ SAVE อัตโนมัติ · บันทึกด้วยปุ่มบันทึกเดิม = งานใหม่ + เลขรันเดิม · ข้อมูลซ้ำงาน ADVANCE เดิมบันทึกได้ (RUN-649) */
var KX649=["created_by_name","created_by_nickname","updated_by_name","credit_term_days","due_date","invoice_date","case_no","contact","cs_name","i_billing_apl","returned_at","returned_by","returned_by_name","returned_reason","advance_settled_at","advance_settled_by","advance_note","source_invoice_key","reference_no","acc_hold","acc_handoff_at","acc_handoff_by","posted_at","billing_note_no"];
async function CJ649(x){var b=x.btn;if(!b||b.disabled||!x.jobId)return;var dt=!1;try{dt=!!x.dirty()}catch(e){dt=!1}
if(dt&&!window.confirm("\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\nCOPY JOB \u0E08\u0E30\u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01 COPY)\n\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?"))return;
b.disabled=!0;var v;try{v=await Me(x.jobId)}catch(e){b.disabled=!1;throw e}
if(x.root&&!x.root.isConnected)return;
if(!v||String(v.charge_type||"").toUpperCase()!=="ADVANCE"){b.disabled=!1;return}
var d=Xn(v);KX649.forEach(function(k){delete d[k]});var td=ee(new Date);d.job_date=td;d.reference_date=td;
await tt({charge:"ADVANCE",group:v.company_group||x.group,mode:x.mode,draft:d,onSaved:x.onSaved})}
function ST649(){try{if(document.getElementById("st649-css"))return;var st=document.createElement("style");st.id="st649-css";st.textContent="#nj-modal #nj-copyjob.btn{background:#7C3AED!important;border:1px solid #7C3AED!important;color:#fff!important;filter:none}#nj-modal #nj-copyjob.btn:hover:not(:disabled){background:#6D28D9!important;border-color:#6D28D9!important}#nj-modal #nj-copyjob.btn:disabled{opacity:.6;cursor:wait}";document.head.appendChild(st)}catch(e){}}
function ST644(){try{if(document.getElementById("st644-css"))return;var st=document.createElement("style");st.id="st644-css";st.textContent="#nj-modal #nj-copyad.btn{background:#2563EB!important;border:1px solid #2563EB!important;color:#fff!important;filter:none}#nj-modal #nj-copyad.btn:hover:not(:disabled){background:#1D4ED8!important;border-color:#1D4ED8!important}#nj-modal #nj-copyad.btn:disabled{opacity:.6;cursor:wait}";document.head.appendChild(st)}catch(e){}}
function ST572(){try{if(document.getElementById("st572-css"))return;var st=document.createElement("style");st.id="st572-css";st.textContent="#nj-modal #nj-copy.btn{background:#7C3AED!important;border:1px solid #7C3AED!important;color:#fff!important;filter:none}#nj-modal #nj-copy.btn:hover:not(:disabled){background:#6D28D9!important;border-color:#6D28D9!important}#nj-modal #nj-post.btn{background:#EA580C!important;border:1px solid #EA580C!important;color:#fff!important;filter:none}#nj-modal #nj-post.btn:hover:not(:disabled){background:#C2410C!important;border-color:#C2410C!important}#nj-modal #nj-post.btn:disabled{background:#FFEDD5!important;border-color:#FED7AA!important;color:#9A3412!important;opacity:1!important;cursor:not-allowed!important;box-shadow:none!important}";document.head.appendChild(st)}catch(e){}}
/* V.573 → V.574 · MASTER UI (ธีมกลางฟอร์มต้นฉบับ) : DOCUMENT + ACCOUNTING ใช้ชุดเดียวกัน
   SERVICE หัวข้อ 1–4 (.modal.jm546 = ทั้ง .jm546-doc และ .jm546-acc) · ADVANCE ข้อมูลหลัก (.jm542-main ทั้ง DOCUMENT และ ACCOUNTING)
   พื้นขาว + ขอบเทาอ่อน #E2E8F0 · สีเฉพาะหมายเลข / ไอคอน / ชื่อหัวข้อ · หัวข้อบัญชี 5–6 คงรูปแบบ ACCOUNTING เดิม
   เรียกจาก SF551.svc / SF551.adv (ตัวสร้างฟอร์มกลาง) → แก้ที่นี่ที่เดียว มีผลทุกหน้าที่ใช้ฟอร์มกลาง */
function SFT574(){try{if(document.getElementById("sf574-theme"))return;var st=document.createElement("style");st.id="sf574-theme";st.textContent=".modal.jm546 .jm546-sec.jm546-c1,.modal.jm546 .jm546-sec.jm546-c2,.modal.jm546 .jm546-sec.jm546-c3,.modal.jm546 .jm546-sec.jm546-c4{background:#FFFFFF!important;border-color:#E2E8F0!important}.modal.jm546 .jm546-c1 .jm546-n{background:#2563EB!important;color:#fff!important}.modal.jm546 .jm546-c1 .jm546-tt{color:#2563EB!important}.modal.jm546 .jm546-c2 .jm546-n{background:#DB2777!important;color:#fff!important}.modal.jm546 .jm546-c2 .jm546-tt{color:#DB2777!important}.modal.jm546 .jm546-c3 .jm546-n{background:#16A34A!important;color:#fff!important}.modal.jm546 .jm546-c3 .jm546-tt{color:#16A34A!important}.modal.jm546 .jm546-c4 .jm546-n{background:#F59E0B!important;color:#fff!important}.modal.jm546 .jm546-c4 .jm546-tt{color:#F59E0B!important}.modal.jm546 .jm546-sec.jm546-c1 .jm546-sub,.modal.jm546 .jm546-sec.jm546-c2 .jm546-sub,.modal.jm546 .jm546-sec.jm546-c3 .jm546-sub,.modal.jm546 .jm546-sec.jm546-c4 .jm546-sub{color:#64748B!important}#nj-modal .sf551 .jm542-main,.modal.jm-adv-doc .jm542-main{background:#FFFFFF!important;box-shadow:inset 0 0 0 1px #E2E8F0!important}#nj-modal .sf551 .jm542-main .jm542-t,.modal.jm-adv-doc .jm542-main .jm542-t{color:#E11D48!important}#nj-modal .sf551 .jm542-main .jm542-ti,.modal.jm-adv-doc .jm542-main .jm542-ti{background:#E11D48!important;color:#fff!important}";document.head.appendChild(st)}catch(e){}}
function ST573(){SFT574()}
/* V.589 · DOCUMENT — SERVICE · ท่าตรวจปล่อย (Dropdown หลายรายการ #nj-relport เท่านั้น) : รายการถูกกรอบหัวข้อ (overflow) ตัด
   → ขณะเปิด วางรายการแบบ position:fixed เหนือทุกองค์ประกอบ (ไม่ย้าย DOM · Event / การเลือก / ค่าเดิมทั้งหมด) · พื้นที่ล่างไม่พอ = เปิดขึ้นด้านบน
   · สูงไม่เกิน 320px เลื่อนภายในได้ · ตามปุ่มเมื่อเลื่อนหน้าจอ / ปรับขนาดหน้าต่าง · ปิดแล้วคืนรูปแบบเดิม */
function RP589(root,id){try{var w=root.querySelector("#"+id+"-wrap");if(!w||w.dataset.rp589)return;w.dataset.rp589="1";var b=w.querySelector("#"+id+"-btn"),l=w.querySelector("#"+id+"-list");if(!b||!l)return;
  var K=["position","left","top","width","minWidth","maxWidth","maxHeight","overflowY","zIndex","right","bottom"],
  clear=function(){K.forEach(function(k){l.style[k]=""});l.classList.remove("rp589-up")},
  place=function(){if(l.hidden||!b.isConnected)return;var r=b.getBoundingClientRect(),vh=window.innerHeight||document.documentElement.clientHeight,vw=window.innerWidth||document.documentElement.clientWidth,g=4,m=8,below=vh-r.bottom-g-m,above=r.top-g-m,full=l.scrollHeight||0,want=Math.min(full,320),up=below<Math.min(want,220)&&above>below,room=Math.max(120,Math.min(320,up?above:below)),h=Math.min(full,room),mn=Math.min(Math.max(r.width,230),vw-2*m),mx=Math.max(mn,Math.min(380,vw*.8)),lf=Math.max(m,Math.min(r.left,vw-m-Math.max(mn,Math.min(mx,l.scrollWidth||mn))));
    l.style.position="fixed";l.style.left=Math.round(lf)+"px";l.style.top=Math.round(up?r.top-g-h:r.bottom+g)+"px";l.style.width="max-content";l.style.minWidth=Math.round(mn)+"px";l.style.maxWidth=Math.round(mx)+"px";l.style.maxHeight=Math.round(room)+"px";l.style.overflowY="auto";l.style.zIndex="1250";l.style.right="auto";l.style.bottom="auto";l.classList.toggle("rp589-up",up)},
  on=function(){if(!w.isConnected){window.removeEventListener("resize",on);document.removeEventListener("scroll",on,!0);return}l.hidden||place()};
  new MutationObserver(function(){l.hidden?clear():place()}).observe(l,{attributes:!0,attributeFilter:["hidden"]});
  l.addEventListener("change",function(){setTimeout(on,0)});
  window.addEventListener("resize",on);document.addEventListener("scroll",on,!0)}catch(e){try{console.warn("RP589",e)}catch(_e){}}}
