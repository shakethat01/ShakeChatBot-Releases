import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const SERVER = path.join(ROOT, 'bot-service', 'server.mjs')
const VERSION = 'R29.55-preview-surface-fix'

function die(msg) {
  console.error(`\n${VERSION} HATA: ${msg}`)
  process.exit(1)
}
if (!fs.existsSync(path.join(ROOT, 'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)
if (!fs.existsSync(SERVER)) die('bot-service/server.mjs bulunamadı.')

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backup = path.join(ROOT, `backup-${VERSION}-${stamp}`, 'bot-service', 'server.mjs')
fs.mkdirSync(path.dirname(backup), { recursive: true })
fs.copyFileSync(SERVER, backup)

let s = fs.readFileSync(SERVER, 'utf8')
const marker = "var params=new URLSearchParams(window.location.search),previewMode=params.get('preview')==='1',eventFilter="
const at = s.indexOf(marker)
if (at < 0) die('previewMode satırı bulunamadı.')
const semi = s.indexOf(';', at)
if (semi < 0) die('previewMode satırı sonlandırılamadı.')

const START = '// R29.55_PREVIEW_SURFACE_FIX_START'
const END = '// R29.55_PREVIEW_SURFACE_FIX_END'
if (s.includes(START)) {
  const a = s.indexOf(START)
  const b = s.indexOf(END, a)
  if (b < 0) die('Eski R29.55 marker yarım kalmış.')
  s = s.slice(0, a) + s.slice(b + END.length)
}

const inject = `\n${START}\nif(previewMode){\n  var previewBg='repeating-conic-gradient(#111820 0% 25%,#1a232c 0% 50%) 0 0 / 24px 24px';\n  document.documentElement.style.setProperty('background',previewBg,'important');\n  document.body.style.setProperty('background',previewBg,'important');\n  document.body.style.setProperty('background-color','#111820','important');\n  stage.style.setProperty('background','transparent','important');\n}\n${END}\n`

s = s.slice(0, semi + 1) + inject + s.slice(semi + 1)
fs.writeFileSync(SERVER, s, 'utf8')

const verify = fs.readFileSync(SERVER, 'utf8')
if (!verify.includes(START) || !verify.includes("if(previewMode)")) die('Patch doğrulanamadı.')

console.log('\n=== R29.55 PREVIEW SURFACE FIX TAMAM ===')
console.log('Dashboard preview: checkerboard iframe SAYFASININ içinde')
console.log('OBS / Live overlay: şeffaf kalır')
console.log('Alert logic / TTS / Queue / Conditions: dokunulmadı')
console.log('Backup:', backup)
console.log('\nBot servisini tamamen kapatıp yeniden aç: npm run bot:dev')
console.log('Sonra npx tauri dev penceresini yeniden aç.')
