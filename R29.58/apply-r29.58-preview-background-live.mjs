import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.58-preview-background-live'
const PANEL = path.join(ROOT, 'src', 'components', 'AlertBoxPanel.tsx')
const SERVER = path.join(ROOT, 'bot-service', 'server.mjs')

function die(message) {
  console.error(`\n${VERSION} HATA: ${message}`)
  process.exit(1)
}
function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, text) { fs.writeFileSync(file, text, 'utf8') }

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

// -----------------------------------------------------------------------------
// FRONTEND: push Preview Background directly into the iframe via postMessage.
// This does not rely on iframe URL reloads or wrapper backgrounds.
// -----------------------------------------------------------------------------
let panel = read(PANEL)

if (!panel.includes("shakechatbot-alert-preview-background")) {
  const messageAnchor = "    const message = { type: 'shakechatbot-alert-preview', payload, animate }"
  if (!panel.includes(messageAnchor)) die('postPreviewPayload message anchor bulunamadı.')

  panel = panel.replace(
    messageAnchor,
    "    const message = { type: 'shakechatbot-alert-preview', payload, animate, previewBackground }"
  )

  const persistEffect = `  useEffect(() => {\n    try { window.localStorage.setItem('shakechatbot.alertbox.preview-background', previewBackground) } catch { /* noop */ }\n  }, [previewBackground])`

  if (!panel.includes(persistEffect)) die('R29.57 previewBackground persistence bloğu bulunamadı.')

  const liveEffect = `${persistEffect}\n\n  useEffect(() => {\n    const message = { type: 'shakechatbot-alert-preview-background', previewBackground }\n    const frames = [previewFrameRef.current, generalPreviewFrameRef.current]\n    for (const frame of frames) {\n      if (!frame?.contentWindow) continue\n      frame.contentWindow.postMessage(message, ALERTBOX_SERVICE_BASE)\n    }\n  }, [previewBackground])`

  panel = panel.replace(persistEffect, liveEffect)
}

write(PANEL, panel)

// -----------------------------------------------------------------------------
// BOT SERVICE PREVIEW PAGE: apply dashboard preview color INSIDE iframe document.
// Normal /alertbox OBS page stays transparent because this runs only in previewMode.
// -----------------------------------------------------------------------------
let server = read(SERVER)

if (!server.includes('R29_58_APPLY_PREVIEW_BACKGROUND')) {
  const renderAnchor = "function renderPreview(data,animate){queue.length=0;playbackToken++;playing=false;stopMedia();stage.innerHTML='';buildCard(data,{preview:true,animate:animate===true});}"
  if (!server.includes(renderAnchor)) die('server.mjs renderPreview anchor bulunamadı.')

  const helper = `function R29_58_APPLY_PREVIEW_BACKGROUND(value){\n  if(!previewMode)return;\n  var raw=String(value||'').trim();\n  var color=/^#[0-9a-f]{6}$/i.test(raw)?raw:'#000000';\n  document.documentElement.style.setProperty('background',color,'important');\n  document.documentElement.style.setProperty('background-color',color,'important');\n  document.body.style.setProperty('background',color,'important');\n  document.body.style.setProperty('background-color',color,'important');\n  stage.style.setProperty('background',color,'important');\n  stage.style.setProperty('background-color',color,'important');\n}\n`

  server = server.replace(renderAnchor, helper + renderAnchor)

  // Replace only the previewMode message block, never the live EventSource block.
  const oldListener = "window.addEventListener('message',function(event){try{var msg=event.data||{};if(msg.type==='shakechatbot-alert-preview'&&msg.payload)renderPreview(msg.payload,msg.animate===true);}catch(_e){}});"
  if (!server.includes(oldListener)) die('server.mjs preview message listener bulunamadı.')

  const newListener = "window.addEventListener('message',function(event){try{var msg=event.data||{};if(msg.type==='shakechatbot-alert-preview-background'){R29_58_APPLY_PREVIEW_BACKGROUND(msg.previewBackground);return;}if(msg.type==='shakechatbot-alert-preview'&&msg.payload){R29_58_APPLY_PREVIEW_BACKGROUND(msg.previewBackground);renderPreview(msg.payload,msg.animate===true);}}catch(_e){}});"
  server = server.replace(oldListener, newListener)

  const previewModeAnchor = "if(previewMode){\n  window.addEventListener('message'"
  if (!server.includes(previewModeAnchor)) die('server.mjs previewMode listener başlangıcı bulunamadı.')
  server = server.replace(previewModeAnchor, "if(previewMode){\n  R29_58_APPLY_PREVIEW_BACKGROUND(params.get('previewBg')||'#000000');\n  window.addEventListener('message'")
}

write(SERVER, server)

// Verification.
const verifyPanel = read(PANEL)
const verifyServer = read(SERVER)
if (!verifyPanel.includes("type: 'shakechatbot-alert-preview-background'")) die('Frontend canlı preview background mesajı eklenemedi.')
if (!verifyPanel.includes('previewBackground }')) die('Preview payload background bağlantısı doğrulanamadı.')
if (!verifyServer.includes('R29_58_APPLY_PREVIEW_BACKGROUND')) die('Iframe background uygulayıcısı eklenemedi.')
if (!verifyServer.includes("msg.type==='shakechatbot-alert-preview-background'")) die('Iframe background mesaj dinleyicisi eklenemedi.')

console.log('\n=== R29.58 PREVIEW BACKGROUND LIVE TAMAM ===')
console.log('Preview Background: renk seçince iframe içine CANLI gönderilir')
console.log('Sayfa yenilemesi: gerekmiyor')
console.log('OBS / normal /alertbox: şeffaf kalır')
console.log('Alert logic / TTS / Queue / Conditions: dokunulmadı')
console.log('Backup:', backupRoot)
console.log('\nBot servisini ve npx tauri dev penceresini tamamen yeniden başlat.')
