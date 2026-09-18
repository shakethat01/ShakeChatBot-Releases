import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.61-alert-scroll-chat-preview'

function die(message) {
  console.error(`\n${VERSION} HATA: ${message}`)
  process.exit(1)
}

function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, text) { fs.writeFileSync(file, text, 'utf8') }

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)
}

const server = path.join(ROOT, 'bot-service', 'server.mjs')
if (!fs.existsSync(server)) die('bot-service/server.mjs bulunamadı.')

const cssCandidates = [
  path.join(ROOT, 'src', 'r2952-ui.css'),
  path.join(ROOT, 'src', 'index.css'),
  path.join(ROOT, 'src', 'App.css'),
]
const cssFile = cssCandidates.find((file) => fs.existsSync(file))
if (!cssFile) die('Uygulama CSS dosyası bulunamadı.')

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupRoot = path.join(ROOT, `backup-${VERSION}-${stamp}`)
for (const file of [cssFile, server]) {
  const target = path.join(backupRoot, path.relative(ROOT, file))
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(file, target)
}

// -----------------------------------------------------------------------------
// 1) AlertBox: sadece bu sayfadaki sağ scrollbar görünmesin.
// Scroll çalışmaya devam eder; overflow kapatılmaz.
// -----------------------------------------------------------------------------
let css = read(cssFile)

if (!css.includes('R29.61_ALERTBOX_SCROLLBAR_HIDE')) {
  css += `\n\n/* R29.61_ALERTBOX_SCROLLBAR_HIDE */\n[data-scb-r2952="alertbox"],\n[data-scb-r2952="alertbox"] .sl-parity-main,\n.alertbox-page.sl-alertbox-parity,\n.alertbox-page.sl-alertbox-parity .sl-parity-main {\n  scrollbar-width: none !important;\n  -ms-overflow-style: none !important;\n}\n\n[data-scb-r2952="alertbox"]::-webkit-scrollbar,\n[data-scb-r2952="alertbox"] .sl-parity-main::-webkit-scrollbar,\n.alertbox-page.sl-alertbox-parity::-webkit-scrollbar,\n.alertbox-page.sl-alertbox-parity .sl-parity-main::-webkit-scrollbar {\n  width: 0 !important;\n  height: 0 !important;\n  display: none !important;\n}\n\n/* ChatBox preview dış yüzeyi de AlertBox preview gibi koyu olsun. */\n[data-scb-r2952="chatbox"] [class*="preview" i],\n[data-scb-r2952="chatbox"] [class*="sample" i],\n[data-scb-r2952="chatbox"] iframe {\n  background: #000 !important;\n  background-color: #000 !important;\n}\n`
}

write(cssFile, css)

// -----------------------------------------------------------------------------
// 2) ChatBox dashboard preview: iframe SAYFASININ iç yüzeyini siyah yap.
// Normal OBS /chatbox çıktısı şeffaf kalır.
// Bunu route adına bağımlı olmadan, HTML head'lerine küçük ve koşullu bir script
// ekleyerek yapıyoruz. Script sadece chatbox yolu + iframe/preview durumunda çalışır.
// -----------------------------------------------------------------------------
let s = read(server)

const marker = 'R29.61_CHATBOX_PREVIEW_SURFACE'
if (!s.includes(marker)) {
  const injection = `<style id="r2961-chatbox-preview-style">\nhtml.r2961-chatbox-preview,\nhtml.r2961-chatbox-preview body,\nhtml.r2961-chatbox-preview #root,\nhtml.r2961-chatbox-preview #stage,\nhtml.r2961-chatbox-preview .chatbox-stage,\nhtml.r2961-chatbox-preview .chatbox-preview {\n  background:#000 !important;\n  background-color:#000 !important;\n}\n</style>\n<script>\n/* ${marker} */\n(function(){\n  try {\n    var pathname = String(location.pathname || '').toLowerCase();\n    var isChatBox = pathname.indexOf('chatbox') >= 0 || pathname.indexOf('chat-box') >= 0;\n    if (!isChatBox) return;\n    var params = new URLSearchParams(location.search || '');\n    var isPreview = params.get('preview') === '1' || window.self !== window.top;\n    if (!isPreview) return;\n\n    document.documentElement.classList.add('r2961-chatbox-preview');\n    var apply = function(){\n      document.documentElement.style.setProperty('background', '#000', 'important');\n      document.documentElement.style.setProperty('background-color', '#000', 'important');\n      if (document.body) {\n        document.body.style.setProperty('background', '#000', 'important');\n        document.body.style.setProperty('background-color', '#000', 'important');\n      }\n      var ids = ['root','stage'];\n      for (var i=0;i<ids.length;i++) {\n        var el=document.getElementById(ids[i]);\n        if(el){\n          el.style.setProperty('background','#000','important');\n          el.style.setProperty('background-color','#000','important');\n        }\n      }\n    };\n    apply();\n    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once:true });\n  } catch (_e) {}\n})();\n</script>\n`

  const count = (s.match(/<\/head>/gi) || []).length
  if (!count) die('server.mjs içinde HTML </head> bulunamadı; güvenli patch uygulanmadı.')
  s = s.replace(/<\/head>/gi, injection + '</head>')
}

write(server, s)

// Verification
const cssVerify = read(cssFile)
const serverVerify = read(server)
if (!cssVerify.includes('R29.61_ALERTBOX_SCROLLBAR_HIDE')) die('AlertBox scrollbar CSS doğrulanamadı.')
if (!serverVerify.includes(marker)) die('ChatBox preview background patch doğrulanamadı.')

console.log(`\n=== ${VERSION} TAMAM ===`)
console.log('AlertBox: sağ scrollbar gizlendi, mouse wheel scroll çalışmaya devam eder.')
console.log('ChatBox preview: dashboard içinde zemin siyah.')
console.log('ChatBox OBS overlay: normal /chatbox şeffaf kalır.')
console.log('AlertBox/ChatBox iş mantığına dokunulmadı.')
console.log('CSS:', path.relative(ROOT, cssFile))
console.log('Server:', path.relative(ROOT, server))
console.log('Backup:', backupRoot)
console.log('\nBot servisini ve npx tauri dev penceresini yeniden başlat.')
