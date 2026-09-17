import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const PANEL = path.join(ROOT, 'src', 'components', 'AlertBoxPanel.tsx')
const SERVER = path.join(ROOT, 'bot-service', 'server.mjs')
const VERSION = 'R29.56-preview-black'

function die(message) {
  console.error(`\n${VERSION} HATA: ${message}`)
  process.exit(1)
}

if (!fs.existsSync(path.join(ROOT, 'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)
if (!fs.existsSync(PANEL)) die('src/components/AlertBoxPanel.tsx bulunamadı.')
if (!fs.existsSync(SERVER)) die('bot-service/server.mjs bulunamadı.')

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupRoot = path.join(ROOT, `backup-${VERSION}-${stamp}`)
for (const file of [PANEL, SERVER]) {
  const target = path.join(backupRoot, path.relative(ROOT, file))
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(file, target)
}

// Dashboard preview frame/card: solid black only. No checkerboard.
let panel = fs.readFileSync(PANEL, 'utf8')
panel = panel.replace(
  /\.sl-alertbox-parity \.alertbox-live-stage\{[^}]*\}/g,
  '.sl-alertbox-parity .alertbox-live-stage{position:relative;width:100%;aspect-ratio:16/9;min-height:0!important;overflow:hidden;background:#000!important}'
)
panel = panel.replace(
  /\.sl-alertbox-parity \.alertbox-live-frame\{[^}]*\}/g,
  '.sl-alertbox-parity .alertbox-live-frame{position:absolute;left:0;top:0;width:1920px;height:1080px;border:0;background:#000!important;transform-origin:0 0;display:block}'
)
panel = panel.replace(
  /className="alertbox-live-stage alertbox-live-stage-exact" style=\{\{ border: 0, borderRadius: 0, minHeight: 320 \}\}/g,
  'className="alertbox-live-stage alertbox-live-stage-exact" style={{ border: 0, borderRadius: 0, minHeight: 0, background: \'#000\' }}'
)
panel = panel.replace(
  /style=\{\{ transform: `scale\(\$\{generalPreviewScale\}\)`[^}]*\}\}/g,
  "style={{ transform: `scale(${generalPreviewScale})`, background: '#000' }}"
)
panel = panel.replace(
  /style=\{\{ transform: `scale\(\$\{previewScale\}\)`[^}]*\}\}/g,
  "style={{ transform: `scale(${previewScale})`, background: '#000' }}"
)
fs.writeFileSync(PANEL, panel, 'utf8')

// /alertbox?preview=1 page itself must be black.
// Normal /alertbox (OBS) remains transparent because this only runs in previewMode.
let server = fs.readFileSync(SERVER, 'utf8')

for (const [startMark, endMark] of [
  ['// R29.55_PREVIEW_SURFACE_FIX_START', '// R29.55_PREVIEW_SURFACE_FIX_END'],
  ['// R29.56_PREVIEW_BLACK_START', '// R29.56_PREVIEW_BLACK_END'],
]) {
  const start = server.indexOf(startMark)
  const end = start >= 0 ? server.indexOf(endMark, start) : -1
  if (start >= 0 && end >= 0) server = server.slice(0, start) + server.slice(end + endMark.length)
}

const marker = "var params=new URLSearchParams(window.location.search),previewMode=params.get('preview')==='1',eventFilter="
const markerAt = server.indexOf(marker)
if (markerAt < 0) die('server.mjs içinde previewMode satırı bulunamadı.')
const semi = server.indexOf(';', markerAt)
if (semi < 0) die('previewMode satırı sonu bulunamadı.')

const injection = `\n// R29.56_PREVIEW_BLACK_START\nif(previewMode){\n  document.documentElement.style.setProperty('background','#000','important');\n  document.documentElement.style.setProperty('background-color','#000','important');\n  document.body.style.setProperty('background','#000','important');\n  document.body.style.setProperty('background-color','#000','important');\n  if(stage){\n    stage.style.setProperty('background','#000','important');\n    stage.style.setProperty('background-color','#000','important');\n  }\n}\n// R29.56_PREVIEW_BLACK_END\n`
server = server.slice(0, semi + 1) + injection + server.slice(semi + 1)
fs.writeFileSync(SERVER, server, 'utf8')

const panelVerify = fs.readFileSync(PANEL, 'utf8')
const serverVerify = fs.readFileSync(SERVER, 'utf8')
if (!panelVerify.includes('background:#000!important')) die('Panel siyah preview kuralı uygulanamadı.')
if (!serverVerify.includes('// R29.56_PREVIEW_BLACK_START')) die('Preview sayfası siyah kuralı uygulanamadı.')

console.log('\n=== R29.56 PREVIEW BLACK TAMAM ===')
console.log('Uygulamadaki Alert Preview: DÜZ SİYAH')
console.log('OBS / normal /alertbox: ŞEFFAF KALDI')
console.log('Alert logic / TTS / Queue / Conditions: DOKUNULMADI')
console.log('Backup:', backupRoot)
console.log('\nBot servisini tamamen kapatıp yeniden aç: npm run bot:dev')
console.log('Ardından ayrı terminalde: npx tauri dev')
