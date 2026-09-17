import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const PANEL = path.join(ROOT, 'src', 'components', 'AlertBoxPanel.tsx')
const SERVER = path.join(ROOT, 'bot-service', 'server.mjs')
const VERSION = 'R29.57-preview-background'

function die(message){ console.error(`\n${VERSION} HATA: ${message}`); process.exit(1) }
if(!fs.existsSync(path.join(ROOT,'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)
if(!fs.existsSync(PANEL)) die('src/components/AlertBoxPanel.tsx bulunamadı.')
if(!fs.existsSync(SERVER)) die('bot-service/server.mjs bulunamadı.')

const stamp = new Date().toISOString().replace(/[:.]/g,'-')
const backupRoot = path.join(ROOT, `backup-${VERSION}-${stamp}`)
for(const file of [PANEL,SERVER]){
  const out = path.join(backupRoot, path.relative(ROOT,file))
  fs.mkdirSync(path.dirname(out), { recursive:true })
  fs.copyFileSync(file,out)
}

let panel = fs.readFileSync(PANEL,'utf8')

// State + persistence (dashboard preview only; OBS output is unaffected)
if(!panel.includes('shakechatbot.alertbox.preview-background')){
  const stateAnchor = "  const [audioMuted, setAudioMuted] = useState(false)"
  if(!panel.includes(stateAnchor)) die('audioMuted state anchor bulunamadı.')
  panel = panel.replace(stateAnchor, `${stateAnchor}\n  const [previewBackground, setPreviewBackground] = useState(() => {\n    try {\n      const saved = window.localStorage.getItem('shakechatbot.alertbox.preview-background') || '#000000'\n      return /^#[0-9a-f]{6}$/i.test(saved) ? saved : '#000000'\n    } catch { return '#000000' }\n  })`)

  const effectAnchor = "  useEffect(() => {\n    const refresh = () => setDiagnostics(getAlertBoxDiagnostics())"
  if(!panel.includes(effectAnchor)) die('Preview background persistence effect anchor bulunamadı.')
  panel = panel.replace(effectAnchor, `  useEffect(() => {\n    try { window.localStorage.setItem('shakechatbot.alertbox.preview-background', previewBackground) } catch { /* noop */ }\n  }, [previewBackground])\n\n${effectAnchor}`)
}

// Preview URL gets its own dashboard-only background parameter.
if(!panel.includes('previewBackgroundUrl')){
  const urlAnchor = "  const filteredOutputUrl = useMemo(() => {"
  if(!panel.includes(urlAnchor)) die('filteredOutputUrl anchor bulunamadı.')
  panel = panel.replace(urlAnchor, `  const previewBackgroundUrl = useMemo(() => \`${'${ALERTBOX_LIVE_PREVIEW_URL}'}&previewBg=${'${encodeURIComponent(previewBackground)}'}\`, [previewBackground])\n\n${urlAnchor}`)
}

panel = panel.replace(/src=\{ALERTBOX_LIVE_PREVIEW_URL\}/g, 'src={previewBackgroundUrl}')

// Make outer preview surface follow the selected color too.
panel = panel.replace(
  /className="alertbox-live-stage alertbox-live-stage-exact" style=\{\{ border: 0, borderRadius: 0, minHeight: (?:0|320)(?:, background: '[^']*')? \}\}/g,
  'className="alertbox-live-stage alertbox-live-stage-exact" style={{ border: 0, borderRadius: 0, minHeight: 0, background: previewBackground }}'
)
panel = panel.replace(
  /style=\{\{ transform: `scale\(\$\{generalPreviewScale\}\)`(?:, background: '[^']*')? \}\}/g,
  'style={{ transform: `scale(${generalPreviewScale})`, background: previewBackground }}'
)
panel = panel.replace(
  /style=\{\{ transform: `scale\(\$\{previewScale\}\)`(?:, background: '[^']*')? \}\}/g,
  'style={{ transform: `scale(${previewScale})`, background: previewBackground }}'
)

// Add user-facing control beside the existing alert background control, in both preview footers.
if(!panel.includes('Preview Background')){
  const generalAnchor = `<span>Background Color</span>\n                <input type="color" value={editorSettings.backgroundColor}`
  if(!panel.includes(generalAnchor)) die('General Preview Background Color control bulunamadı.')
  panel = panel.replace(generalAnchor, `<span>Alert Background</span>\n                <input type="color" value={editorSettings.backgroundColor}`)

  const generalLabelStart = `              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>\n                <span>Alert Background</span>`
  panel = panel.replace(generalLabelStart, `              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>\n                <span>Preview Background</span>\n                <input value={previewBackground} onChange={(event) => { const value = event.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(value)) setPreviewBackground(value) }} style={{ width: 82 }} />\n                <input type="color" value={previewBackground} onChange={(event) => setPreviewBackground(event.target.value)} style={{ width: 30, height: 30, padding: 0 }} />\n              </label>\n              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>\n                <span>Alert Background</span>`)

  // Event preview footer has text + color input for the alert background.
  const eventAnchor = `                    <span>Background Color</span>\n                    <input value={editorSettings.backgroundColor}`
  if(!panel.includes(eventAnchor)) die('Event Preview Background Color control bulunamadı.')
  panel = panel.replace(eventAnchor, `                    <span>Alert Background</span>\n                    <input value={editorSettings.backgroundColor}`)

  const eventLabelStart = `                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>\n                    <span>Alert Background</span>`
  panel = panel.replace(eventLabelStart, `                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>\n                    <span>Preview Background</span>\n                    <input value={previewBackground} onChange={(event) => { const value = event.target.value.trim(); if (/^#[0-9a-f]{6}$/i.test(value)) setPreviewBackground(value) }} style={{ width: 82 }} />\n                    <input type="color" value={previewBackground} onChange={(event) => setPreviewBackground(event.target.value)} style={{ width: 30, height: 30, padding: 0 }} />\n                  </label>\n                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>\n                    <span>Alert Background</span>`)
}

fs.writeFileSync(PANEL,panel,'utf8')

let server = fs.readFileSync(SERVER,'utf8')

// Remove older preview-only hardcoded background patches if present.
for(const [start,end] of [
  ['// R29.55_PREVIEW_SURFACE_FIX_START','// R29.55_PREVIEW_SURFACE_FIX_END'],
  ['// R29.56_PREVIEW_BLACK_START','// R29.56_PREVIEW_BLACK_END'],
  ['// R29.57_PREVIEW_BG_START','// R29.57_PREVIEW_BG_END'],
]){
  const a=server.indexOf(start), b=a>=0?server.indexOf(end,a):-1
  if(a>=0&&b>=0) server=server.slice(0,a)+server.slice(b+end.length)
}

const marker = "var params=new URLSearchParams(window.location.search),previewMode=params.get('preview')==='1',eventFilter="
const at = server.indexOf(marker)
if(at<0) die('server.mjs previewMode satırı bulunamadı.')
const semi = server.indexOf(';',at)
if(semi<0) die('server.mjs previewMode satırı sonu bulunamadı.')
const injection = `\n// R29.57_PREVIEW_BG_START\nif(previewMode){\n  var requestedPreviewBg=String(params.get('previewBg')||'#000000');\n  var previewBg=/^#[0-9a-f]{6}$/i.test(requestedPreviewBg)?requestedPreviewBg:'#000000';\n  document.documentElement.style.setProperty('background',previewBg,'important');\n  document.body.style.setProperty('background',previewBg,'important');\n  document.body.style.setProperty('background-color',previewBg,'important');\n  if(stage){stage.style.setProperty('background',previewBg,'important');stage.style.setProperty('background-color',previewBg,'important');}\n}\n// R29.57_PREVIEW_BG_END\n`
server = server.slice(0,semi+1)+injection+server.slice(semi+1)
fs.writeFileSync(SERVER,server,'utf8')

const verifyPanel=fs.readFileSync(PANEL,'utf8')
const verifyServer=fs.readFileSync(SERVER,'utf8')
if(!verifyPanel.includes('Preview Background')) die('Preview Background kontrolü eklenemedi.')
if(!verifyPanel.includes('previewBackgroundUrl')) die('Preview URL bağlantısı eklenemedi.')
if(!verifyServer.includes('requestedPreviewBg')) die('Server previewBg desteği eklenemedi.')

console.log('\n=== R29.57 PREVIEW BACKGROUND TAMAM ===')
console.log('Preview Background: uygulama içinden istediğin renk seçilebilir')
console.log('Ayar: localStorage ile kalıcı')
console.log('Alert Background: ayrı bırakıldı')
console.log('OBS / normal /alertbox: şeffaf kalır')
console.log('Alert logic / TTS / Queue / Conditions: dokunulmadı')
console.log('Backup:', backupRoot)
console.log('\nBot servisini ve npx tauri dev penceresini yeniden başlat.')
