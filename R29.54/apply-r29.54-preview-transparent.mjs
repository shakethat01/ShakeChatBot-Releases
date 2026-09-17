import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.54-preview-transparent'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T','_').slice(0,19)
const BACKUP = path.join(ROOT, `backup-${VERSION}-${stamp}`)

function die(message) {
  console.error(`\n${VERSION} HATA: ${message}`)
  process.exit(1)
}
function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, text) { fs.writeFileSync(file, text, 'utf8') }
function backup(file) {
  if (!fs.existsSync(file)) return
  const rel = path.relative(ROOT, file)
  const target = path.join(BACKUP, rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(file, target)
}

if (!fs.existsSync(path.join(ROOT, 'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)

const ALERT = path.join(ROOT, 'src', 'components', 'AlertBoxPanel.tsx')
const SERVER = path.join(ROOT, 'bot-service', 'server.mjs')
if (!fs.existsSync(ALERT)) die('src/components/AlertBoxPanel.tsx bulunamadı.')
if (!fs.existsSync(SERVER)) die('bot-service/server.mjs bulunamadı.')
backup(ALERT)
backup(SERVER)

let alert = read(ALERT)
const stageRule = /\.sl-alertbox-parity \.alertbox-live-stage\{[^}]*\}/g
if (!stageRule.test(alert)) die('AlertBox preview stage CSS kuralı bulunamadı.')
stageRule.lastIndex = 0
alert = alert.replace(stageRule, `.sl-alertbox-parity .alertbox-live-stage{position:relative;width:100%;aspect-ratio:16/9;min-height:320px;overflow:hidden;background:repeating-conic-gradient(#10161c 0% 25%,#192129 0% 50%) 0 0/24px 24px!important}`)

const frameRule = /\.sl-alertbox-parity \.alertbox-live-frame\{[^}]*\}/g
if (!frameRule.test(alert)) die('AlertBox preview iframe CSS kuralı bulunamadı.')
frameRule.lastIndex = 0
alert = alert.replace(frameRule, `.sl-alertbox-parity .alertbox-live-frame{position:absolute;left:0;top:0;width:1920px;height:1080px;border:0;background:transparent!important;transform-origin:0 0;display:block}`)

alert = alert.replace(/style=\{\{ transform: `scale\(\$\{generalPreviewScale\}\)` \}\}/g, "style={{ transform: `scale(${generalPreviewScale})`, background: 'transparent' }}")
alert = alert.replace(/style=\{\{ transform: `scale\(\$\{previewScale\}\)` \}\}/g, "style={{ transform: `scale(${previewScale})`, background: 'transparent' }}")
write(ALERT, alert)

let server = read(SERVER)
server = server.replace(/html,body\{width:100%;height:100%;margin:0;overflow:hidden;background:transparent;/, 'html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent!important;')
server = server.replace(/#stage\{position:fixed;inset:0;display:flex;/, '#stage{position:fixed;inset:0;display:flex;background:transparent!important;')
write(SERVER, server)

const verifyAlert = read(ALERT)
const verifyServer = read(SERVER)
if (!verifyAlert.includes('repeating-conic-gradient(#10161c')) die('Preview transparency uygulanamadı.')
if (!verifyAlert.includes('background:transparent!important')) die('Preview iframe transparency uygulanamadı.')
if (!verifyServer.includes('background:transparent!important')) die('Overlay transparency uygulanamadı.')

console.log('\n=== R29.54 PREVIEW TRANSPARENT TAMAM ===')
console.log('Alert preview : eski şeffaf/checkerboard arkaplan geri geldi')
console.log('Beyaz text    : preview içinde artık görünür')
console.log('OBS overlay   : şeffaf kalır')
console.log('Alert logic   : dokunulmadı')
console.log('Conditions    : dokunulmadı')
console.log('TTS / Queue   : dokunulmadı')
console.log('Backup        :', BACKUP)
console.log('\nBot servisini ve npx tauri dev penceresini yeniden başlat.')
