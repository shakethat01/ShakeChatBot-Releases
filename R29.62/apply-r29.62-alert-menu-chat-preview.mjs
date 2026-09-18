import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.62-alert-menu-chat-preview'
const BG = '#000000'

function die(message) {
  console.error(`\n${VERSION} HATA: ${message}`)
  process.exit(1)
}
function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, text) { fs.writeFileSync(file, text, 'utf8') }
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','dist','target'].includes(entry.name)) continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (/\.(tsx|ts|css)$/i.test(p)) out.push(p)
  }
  return out
}

if (!fs.existsSync(path.join(ROOT, 'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)
const server = path.join(ROOT, 'bot-service', 'server.mjs')
if (!fs.existsSync(server)) die('bot-service/server.mjs bulunamadı.')

const sourceFiles = walk(path.join(ROOT, 'src'))
const choose = (scoreFn) => sourceFiles.map(file => {
  let text = ''
  try { text = read(file) } catch {}
  return { file, text, score: scoreFn(file, text) }
}).sort((a,b)=>b.score-a.score)[0]

const alert = choose((f,t)=>(/AlertBoxPanel/i.test(f)?100:0)+(/sl-test-submenu/.test(t)?40:0)+(/sl-parity-shell/.test(t)?30:0)+(/\/alertbox/.test(t)?20:0))
const chat = choose((f,t)=>(/ChatBoxPanel/i.test(f)?100:0)+(/\/chatbox/.test(t)?35:0)+(/preview/i.test(t)?20:0)+(/OBS Browser Source|Tarayıcı Kaynağı|Tarayici Kaynagi/i.test(t)?20:0))
if (!alert || alert.score < 50) die('AlertBoxPanel kaynağı bulunamadı.')
if (!chat || chat.score < 40) die('ChatBoxPanel kaynağı bulunamadı.')

const cssCandidates = [
  path.join(ROOT,'src','r2952-ui.css'),
  path.join(ROOT,'src','index.css'),
  path.join(ROOT,'src','App.css'),
]
const cssFile = cssCandidates.find(fs.existsSync)
if (!cssFile) die('Uygulama CSS dosyası bulunamadı.')

const stamp = new Date().toISOString().replace(/[:.]/g,'-')
const backupRoot = path.join(ROOT, `backup-${VERSION}-${stamp}`)
for (const file of [...new Set([alert.file, chat.file, cssFile, server])]) {
  const target = path.join(backupRoot, path.relative(ROOT,file))
  fs.mkdirSync(path.dirname(target), { recursive:true })
  fs.copyFileSync(file,target)
}

// -----------------------------------------------------------------------------
// AlertBox: scrollbar görünmesin ama popup/menu KESİLMESİN.
// R29.52'deki root overflow:hidden popup'ları kırpıyordu.
// Ayrıca Test alt menüsü sağ kenarda sağa açıldığı için pencere dışına taşıyordu;
// submenu artık SOLA açılır.
// -----------------------------------------------------------------------------
let css = read(cssFile)
const cssStart = '/* R29.62_ALERT_MENU_LAYOUT_START */'
const cssEnd = '/* R29.62_ALERT_MENU_LAYOUT_END */'
if (css.includes(cssStart)) {
  const a = css.indexOf(cssStart), b = css.indexOf(cssEnd, a)
  if (b >= 0) css = css.slice(0,a) + css.slice(b + cssEnd.length)
}
css += `\n\n${cssStart}\n[data-scb-r2952="alertbox"],\n.alertbox-page.sl-alertbox-parity {\n  width:100% !important;\n  max-width:none !important;\n  min-width:0 !important;\n  overflow:visible !important;\n  scrollbar-width:none !important;\n  -ms-overflow-style:none !important;\n}\n[data-scb-r2952="alertbox"] .sl-parity-shell,\n[data-scb-r2952="alertbox"] .sl-parity-main,\n[data-scb-r2952="alertbox"] .sl-topbar,\n[data-scb-r2952="alertbox"] .sl-test-wrap,\n.alertbox-page.sl-alertbox-parity .sl-parity-shell,\n.alertbox-page.sl-alertbox-parity .sl-parity-main,\n.alertbox-page.sl-alertbox-parity .sl-topbar,\n.alertbox-page.sl-alertbox-parity .sl-test-wrap {\n  min-width:0 !important;\n  max-width:none !important;\n  overflow:visible !important;\n}\n[data-scb-r2952="alertbox"] .sl-test-menu,\n.alertbox-page.sl-alertbox-parity .sl-test-menu {\n  right:0 !important;\n  left:auto !important;\n  overflow:visible !important;\n}\n[data-scb-r2952="alertbox"] .sl-test-submenu,\n.alertbox-page.sl-alertbox-parity .sl-test-submenu {\n  left:auto !important;\n  right:100% !important;\n  margin-right:6px !important;\n  overflow:visible !important;\n}\n[data-scb-r2952="alertbox"] .sl-parity-nav,\n[data-scb-r2952="alertbox"] .sl-parity-main,\n.alertbox-page.sl-alertbox-parity .sl-parity-nav,\n.alertbox-page.sl-alertbox-parity .sl-parity-main {\n  scrollbar-width:none !important;\n  -ms-overflow-style:none !important;\n}\n[data-scb-r2952="alertbox"]::-webkit-scrollbar,\n[data-scb-r2952="alertbox"] .sl-parity-nav::-webkit-scrollbar,\n[data-scb-r2952="alertbox"] .sl-parity-main::-webkit-scrollbar,\n.alertbox-page.sl-alertbox-parity::-webkit-scrollbar,\n.alertbox-page.sl-alertbox-parity .sl-parity-nav::-webkit-scrollbar,\n.alertbox-page.sl-alertbox-parity .sl-parity-main::-webkit-scrollbar {\n  width:0 !important;\n  height:0 !important;\n  display:none !important;\n}\n\n/* ChatBox dashboard preview dış yüzeyi */\n[data-scb-r2952="chatbox"] [class*="preview" i],\n[data-scb-r2952="chatbox"] [class*="sample" i],\n[data-scb-r2952="chatbox"] iframe,\n.chatbox-page [class*="preview" i],\n.chatbox-page iframe {\n  background:${BG} !important;\n  background-color:${BG} !important;\n}\n${cssEnd}\n`
write(cssFile, css)

// AlertBox component içindeki eski submenu yönünü de doğrudan düzelt.
let atext = read(alert.file)
atext = atext.replace(/\.sl-test-submenu\{display:none;position:absolute;left:100%;top:0;/g,
  '.sl-test-submenu{display:none;position:absolute;left:auto;right:100%;top:0;margin-right:6px;')
write(alert.file, atext)

// -----------------------------------------------------------------------------
// ChatBox: eğer preview React içinde doğrudan beyaz yüzey çiziyorsa, yalnız preview
// yakınındaki white background literal'larını siyaha çevir.
// -----------------------------------------------------------------------------
let ctext = read(chat.file)
let directPreviewChanges = 0
const lines = ctext.split(/\r?\n/)
for (let i=0;i<lines.length;i++) {
  if (!/background(?:Color)?\s*:\s*['"](?:#fff(?:fff)?|white)['"]/i.test(lines[i])) continue
  const context = lines.slice(Math.max(0,i-35), Math.min(lines.length,i+36)).join('\n')
  if (!/preview|sample|iframe|önizleme|onizleme|yalnızca önizleme|yalnizca onizleme/i.test(context)) continue
  const before = lines[i]
  lines[i] = lines[i]
    .replace(/background\s*:\s*['"](?:#fff(?:fff)?|white)['"]/ig, `background: '${BG}'`)
    .replace(/backgroundColor\s*:\s*['"](?:#fff(?:fff)?|white)['"]/ig, `backgroundColor: '${BG}'`)
  if (lines[i] !== before) directPreviewChanges++
}
ctext = lines.join('\n')

// ChatBox preview iframe varsa ?preview=1 ekle. Widget/OBS URL metnini değiştirme;
// yalnız iframe src attribute'u hedeflenir.
let iframeChanges = 0
ctext = ctext.replace(/<iframe\b[\s\S]{0,1200}?>/gi, (tag) => {
  if (/preview=1/i.test(tag)) return tag
  let next = tag
  next = next.replace(/src=(['"])([^'"]*\/chatbox[^'"]*)\1/i, (_m,q,url) => {
    iframeChanges++
    return `src=${q}${url}${url.includes('?') ? '&' : '?'}preview=1${q}`
  })
  if (next !== tag) return next
  next = next.replace(/src=\{([A-Za-z_$][\w$]*)\}/, (_m,v) => {
    iframeChanges++
    return 'src={`' + '${' + v + '}' + '${String(' + v + ").includes('?') ? '&' : '?'}" + 'preview=1`}'
  })
  return next
})
write(chat.file, ctext)

// -----------------------------------------------------------------------------
// ChatBox iframe sayfası: preview durumunda gerçek beyaz canvas/stage'i siyah yap.
// OBS normal /chatbox sayfası etkilenmez: yalnız preview=1 veya iframe içinde çalışır.
// R29.61 yalnız body/#stage deniyordu; gerçek beyaz yüzey farklı bir wrapper ise kaçıyordu.
// Burada viewport'un büyük kısmını kaplayan üst seviye preview yüzeylerini de boyuyoruz.
// -----------------------------------------------------------------------------
let s = read(server)
const marker = 'R29.62_CHATBOX_PREVIEW_SURFACE'
if (!s.includes(marker)) {
  const injection = `<script>\n/* ${marker} */\n(function(){\n  try {\n    var p=String(location.pathname||'').toLowerCase();\n    if(p.indexOf('chatbox')<0 && p.indexOf('chat-box')<0) return;\n    var qs=new URLSearchParams(location.search||'');\n    if(qs.get('preview')!=='1' && window.self===window.top) return;\n    var bg='${BG}';\n    function paint(el){\n      if(!el||!el.style) return;\n      el.style.setProperty('background',bg,'important');\n      el.style.setProperty('background-color',bg,'important');\n    }\n    function apply(){\n      paint(document.documentElement); paint(document.body);\n      ['root','stage','chat','chatbox','messages'].forEach(function(id){paint(document.getElementById(id));});\n      if(document.body){\n        Array.from(document.body.children).forEach(function(el){\n          if(el.tagName!=='SCRIPT'&&el.tagName!=='STYLE') paint(el);\n        });\n        Array.from(document.body.querySelectorAll('*')).forEach(function(el){\n          try {\n            var r=el.getBoundingClientRect();\n            if(r.width>=window.innerWidth*0.72 && r.height>=window.innerHeight*0.72) paint(el);\n          } catch(_e){}\n        });\n      }\n    }\n    apply();\n    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});\n    setTimeout(apply,0); setTimeout(apply,80); setTimeout(apply,300);\n    try { new MutationObserver(function(){apply();}).observe(document.documentElement,{childList:true,subtree:true}); } catch(_e){}\n  } catch(_e){}\n})();\n</script>\n`
  const heads = (s.match(/<\/head>/gi) || []).length
  if (!heads) die('server.mjs içinde HTML </head> bulunamadı; ChatBox preview güvenli biçimde patchlenemedi.')
  s = s.replace(/<\/head>/gi, injection + '</head>')
}
write(server, s)

// doğrulama
if (!read(cssFile).includes(cssStart)) die('AlertBox layout CSS doğrulanamadı.')
if (!read(server).includes(marker)) die('ChatBox preview server patch doğrulanamadı.')

console.log(`\n=== ${VERSION} TAMAM ===`)
console.log('AlertBox Test submenu: artık sağdan taşmıyor, SOLA açılıyor.')
console.log('AlertBox popup clipping: overflow:hidden etkisi kaldırıldı.')
console.log('AlertBox scrollbar: görünmüyor; içerik/menüler kesilmiyor.')
console.log('ChatBox preview: beyaz preview yüzeyi siyaha zorlandı.')
console.log('ChatBox OBS /chatbox: şeffaf davranış korunuyor.')
console.log('ChatBox direct preview değişikliği:', directPreviewChanges)
console.log('ChatBox iframe preview URL değişikliği:', iframeChanges)
console.log('AlertBox:', path.relative(ROOT,alert.file))
console.log('ChatBox :', path.relative(ROOT,chat.file))
console.log('Backup  :', backupRoot)
console.log('\nBot servisini ve npx tauri dev penceresini TAMAMEN kapatıp yeniden aç.')
