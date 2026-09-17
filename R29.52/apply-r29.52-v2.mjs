import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const die = (m) => { console.error('\nR29.52-v2 HATA:', m); process.exit(1) }
const read = (p) => fs.readFileSync(p, 'utf8')
const write = (p,s) => { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p,s,'utf8') }
const walk=(d,out=[])=>{if(!fs.existsSync(d))return out;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','dist','target'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(/\.(tsx|ts)$/.test(p))out.push(p)}return out}
if(!fs.existsSync(path.join(ROOT,'package.json'))) die(`Proje kökü bulunamadı: ${ROOT}`)

const files=walk(path.join(ROOT,'src'))
const best=(score)=>files.map(file=>{let text='';try{text=read(file)}catch{}return{file,text,score:score(file,text)}}).sort((a,b)=>b.score-a.score)[0]
const alert=best((f,t)=>(/AlertBoxPanel/i.test(f)?100:0)+(/General Settings/.test(t)?25:0)+(/Global Editing/.test(t)?25:0)+(/kick_subscription/.test(t)?20:0)+(/\/alertbox/.test(t)?10:0))
const chat=best((f,t)=>(/ChatBox/i.test(f)?100:0)+(/Yayın sohbeti|Yayin sohbeti/.test(t)?35:0)+(/OBS Tarayıcı Kaynağı|OBS Tarayici Kaynagi/.test(t)?25:0)+(/\/chatbox/.test(t)?20:0))
if(!alert||alert.score<40)die('AlertBox kaynağı bulunamadı.')
if(!chat||chat.score<40)die('ChatBox kaynağı bulunamadı.')
const main=path.join(ROOT,'src','main.tsx')
const server=path.join(ROOT,'bot-service','server.mjs')
const css=path.join(ROOT,'src','r2952-ui.css')
if(!fs.existsSync(main)||!fs.existsSync(server))die('main.tsx veya server.mjs bulunamadı.')

const stamp=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)
const backupDir=path.join(ROOT,`backup-R29.52-v2-${stamp}`)
for(const p of [alert.file,chat.file,main,server]){const rel=path.relative(ROOT,p),q=path.join(backupDir,rel);fs.mkdirSync(path.dirname(q),{recursive:true});fs.copyFileSync(p,q)}

function markRoot(text,tag){
  if(text.includes(`data-scb-r2952="${tag}"`))return text
  const pats=[
    /\breturn\s*\(\s*<(div|section|main|form|article)\b/m,
    /\breturn\s*<(div|section|main|form|article)\b/m,
    /=>\s*\(\s*<(div|section|main|form|article)\b/m,
    /=>\s*<(div|section|main|form|article)\b/m
  ]
  for(const re of pats){const m=re.exec(text);if(!m)continue;const rel=m[0].lastIndexOf('<'+m[1]);const pos=m.index+rel+1+m[1].length;return text.slice(0,pos)+` data-scb-r2952="${tag}"`+text.slice(pos)}
  // Fragment veya değişken JSX kullanan componentler için güvenli fallback: dosyadaki ilk gerçek container.
  const m=/<(div|section|main|form|article)\b/.exec(text)
  if(m){const pos=m.index+1+m[1].length;return text.slice(0,pos)+` data-scb-r2952="${tag}"`+text.slice(pos)}
  die(`${tag} için işaretlenecek JSX container bulunamadı.`)
}

function patchKickTts(text){
  let out=text,count=0
  const candidates=[...out.matchAll(/([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)\s*===\s*(['"])subscription\2/g)].reverse()
  for(const m of candidates){const i=m.index,ctx=out.slice(Math.max(0,i-1800),Math.min(out.length,i+1800)).toLowerCase();if(!(/\btts\b|text\s*to\s*speech|speechsynthesis|ttsvoice|ttsvolume|metni\s*sese/.test(ctx)))continue;if(/variationcondition|variation condition|varyasyon koşulu|varyasyon kosulu/.test(ctx))continue;const rep=`(${m[1]} === ${m[2]}subscription${m[2]} || ${m[1]} === ${m[2]}kick_subscription${m[2]})`;out=out.slice(0,i)+rep+out.slice(i+m[0].length);count++}
  return{out,count}
}
function patchKickRegistry(text){let count=0;const out=text.replace(/(\bkick\s*:\s*\[)([\s\S]{0,900}?)(\])/gi,(all,a,b,c)=>{if(/condition/i.test(b))return all;const n=b.replace(/(['"])follow\1/g,"'kick_follow'").replace(/(['"])subscription\1/g,"'kick_subscription'");if(n!==b)count++;return a+n+c});return{out,count}}

let a=markRoot(read(alert.file),'alertbox')
const t=patchKickTts(a);a=t.out
const r=patchKickRegistry(a);a=r.out
write(alert.file,a)
write(chat.file,markRoot(read(chat.file),'chatbox'))

let m=read(main)
if(!m.includes("./r2952-ui.css")){const ims=[...m.matchAll(/^import[^\n]*$/gm)];if(ims.length){const z=ims.at(-1),p=z.index+z[0].length;m=m.slice(0,p)+"\nimport './r2952-ui.css'"+m.slice(p)}else m="import './r2952-ui.css'\n"+m;write(main,m)}

write(css,`/* ShakeChatBot R29.52 */
:root{--sbg:#0b0f13;--spanel:#10161c;--spanel2:#151d24;--sborder:#26333e;--stext:#edf2f7;--smuted:#8e9ba7;--saccent:#f59e0b}
[data-scb-r2952]{color:var(--stext)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important}
[data-scb-r2952="alertbox"]{background:var(--sbg)!important;border-radius:12px;overflow:hidden}
[data-scb-r2952="alertbox"] [class*="panel" i],[data-scb-r2952="alertbox"] [class*="card" i],[data-scb-r2952="alertbox"] [class*="section" i],[data-scb-r2952="alertbox"] [class*="sidebar" i],[data-scb-r2952="alertbox"] [class*="toolbar" i]{background-color:var(--spanel)!important;border-color:var(--sborder)!important;color:var(--stext)!important}
[data-scb-r2952="alertbox"] [class*="sidebar" i]{background:#0d1318!important}
[data-scb-r2952] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),[data-scb-r2952] select,[data-scb-r2952] textarea{min-height:36px!important;background:#0d1318!important;color:var(--stext)!important;border:1px solid var(--sborder)!important;border-radius:8px!important;padding:8px 10px!important;outline:none!important}
[data-scb-r2952] input:focus,[data-scb-r2952] select:focus,[data-scb-r2952] textarea:focus{border-color:rgba(245,158,11,.8)!important;box-shadow:0 0 0 3px rgba(245,158,11,.12)!important}
[data-scb-r2952] input[type="checkbox"],[data-scb-r2952] input[type="radio"],[data-scb-r2952] input[type="range"]{accent-color:var(--saccent)!important}
[data-scb-r2952] button{min-height:34px!important;background:#1a242c!important;color:#e9eef3!important;border:1px solid #33424e!important;border-radius:8px!important;padding:7px 12px!important;font-weight:650!important;box-shadow:none!important}
[data-scb-r2952] button:hover{background:#222e37!important;border-color:#4a5e6d!important}
[data-scb-r2952="alertbox"] [aria-selected="true"],[data-scb-r2952="alertbox"] [aria-current="page"],[data-scb-r2952="alertbox"] .active{background:rgba(245,158,11,.11)!important;border-color:rgba(245,158,11,.48)!important;color:#ffd57a!important}
[data-scb-r2952="alertbox"] [class*="preview" i],[data-scb-r2952="alertbox"] iframe{background:#05090c!important;border-color:var(--sborder)!important;border-radius:10px!important;overflow:hidden}
[data-scb-r2952="chatbox"]{background:var(--sbg)!important;padding:18px 20px 28px!important;border:1px solid var(--sborder)!important;border-radius:12px!important;max-width:1480px;margin:0 auto}
[data-scb-r2952="chatbox"] label{color:#cbd5df!important;font-size:12px;font-weight:650}
[data-scb-r2952="chatbox"] p,[data-scb-r2952="chatbox"] small,[data-scb-r2952="alertbox"] p,[data-scb-r2952="alertbox"] small{color:var(--smuted)}
[data-scb-r2952="chatbox"] [class*="preview" i],[data-scb-r2952="chatbox"] [class*="sample" i],[data-scb-r2952="chatbox"] iframe{background:#070b0e!important;border:1px solid var(--sborder)!important;border-radius:12px!important;box-shadow:0 18px 55px rgba(0,0,0,.32)!important;overflow:hidden}
[data-scb-r2952] ::-webkit-scrollbar{width:10px;height:10px}[data-scb-r2952] ::-webkit-scrollbar-track{background:#0b1014}[data-scb-r2952] ::-webkit-scrollbar-thumb{background:#34424e;border:2px solid #0b1014;border-radius:999px}
@media(max-width:900px){[data-scb-r2952="chatbox"]{padding:12px!important}[data-scb-r2952="alertbox"] [class*="preview" i]{min-width:0!important;width:100%!important}}
`)

let s=read(server)
if(!s.includes('r2952KickAlertSeen')){const anchor='const alertBoxClients = new Set()';if(!s.includes(anchor))die('AlertBox server anchor bulunamadı.');s=s.replace(anchor,anchor+`\n\n// R29.52 Kick alert dedupe - Twitch untouched\nconst r2952KickAlertSeen=new Map()\nfunction r2952KickAlertDuplicate(body,payload){if(String(payload?.platform||body?.platform||'').toLowerCase()!=='kick')return false;if(body?.isTest||body?.isReplay||payload?.isTest||payload?.isReplay)return false;const kind=String(payload?.kind||body?.kind||'').toLowerCase();const id=String(body?.sourceEventId||body?.source_event_id||body?.eventId||body?.event_id||body?.id||'').trim();let key=id?('id:'+kind+':'+id):'';if(!key&&(kind==='follow'||kind==='subscription')){const u=String(body?.user||body?.username||body?.name||body?.displayName||payload?.user||payload?.username||payload?.name||'').trim().toLowerCase();if(u)key='semantic:'+kind+':'+u}if(!key)return false;const now=Date.now(),ttl=12000;for(const[k,v]of r2952KickAlertSeen)if(now-v>ttl)r2952KickAlertSeen.delete(k);const prev=r2952KickAlertSeen.get(key);r2952KickAlertSeen.set(key,now);return Number.isFinite(prev)&&now-prev<=ttl}\n`)}
if(!s.includes('deduped: true')){const re=/(if\s*\(request\.method\s*===\s*['"]POST['"]\s*&&\s*pathname\s*===\s*['"]\/alertbox\/event['"]\)[\s\S]{0,900}?const\s+body\s*=\s*await\s+readJsonBody\([^\n]+\)\s*\n\s*const\s+payload\s*=\s*alertBoxSafePayload\(body\)\s*\n)(\s*broadcastAlertBox\(payload\))/m;if(!re.test(s))die('/alertbox/event bloğu bulunamadı.');s=s.replace(re,`$1      if (r2952KickAlertDuplicate(body, payload)) return json(response, 200, { ok: true, deduped: true, clients: alertBoxClients.size })\n$2`)}
write(server,s)

console.log('\n=== ShakeChatBot R29.52-v2 TAMAM ===')
console.log('AlertBox:',path.relative(ROOT,alert.file))
console.log('ChatBox :',path.relative(ROOT,chat.file))
console.log('Yeni Kick TTS eşlemesi:',t.count,'(ilk denemede uygulanmışsa 0 normal)')
console.log('Yeni Kick varyasyon registry düzeltmesi:',r.count,'(ilk denemede uygulanmışsa 0 normal)')
console.log('Kick follow/sub duplicate guard: AKTİF')
console.log('Conditions: ELLEMEDİM')
console.log('Yedek:',backupDir)
