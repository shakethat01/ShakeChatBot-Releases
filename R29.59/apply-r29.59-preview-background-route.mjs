import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.59-preview-background-route'
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

// FRONTEND: her renk değişiminde iframe URL'si değişsin; browser kesin yeniden yüklesin.
let panel = read(PANEL)
if (!panel.includes('previewBackground')) die('Preview Background state bulunamadı. Önce R29.57/R29.58 uygulanmış olmalı.')

panel = panel.replace(/src=\{ALERTBOX_LIVE_PREVIEW_URL\}/g,
  "src={ALERTBOX_LIVE_PREVIEW_URL + '&previewBg=' + encodeURIComponent(previewBackground)}")
panel = panel.replace(/src=\{previewBackgroundUrl\}/g,
  "src={ALERTBOX_LIVE_PREVIEW_URL + '&previewBg=' + encodeURIComponent(previewBackground)}")

if (!panel.includes("key={`general-preview-${previewBackground}`}")) {
  panel = panel.replace(
    'ref={generalPreviewFrameRef}\n                className="alertbox-live-frame"',
    'key={`general-preview-${previewBackground}`}\n                ref={generalPreviewFrameRef}\n                className="alertbox-live-frame"'
  )
}
if (!panel.includes("key={`event-preview-${previewBackground}`}")) {
  panel = panel.replace(
    'ref={previewFrameRef}\n                    className="alertbox-live-frame"',
    'key={`event-preview-${previewBackground}`}\n                    ref={previewFrameRef}\n                    className="alertbox-live-frame"'
  )
}

write(PANEL, panel)

// SERVER: beyaz alanı artık client JS ile değil, HTML daha tarayıcıya gitmeden server-side boyuyoruz.
// preview=1 yoksa OBS/live /alertbox tamamen şeffaf kalır.
let server = read(SERVER)
const routeRegex = /  if \(request\.method === 'GET' && pathname === '\/alertbox'\) \{[\s\S]*?\n  \}\n\n  if \(request\.method === 'GET' && pathname === '\/alertbox\/status'\) \{/
const routeMatch = server.match(routeRegex)
if (!routeMatch) die('/alertbox GET route bloğu bulunamadı.')

const routeReplacement = [
"  if (request.method === 'GET' && pathname === '/alertbox') {",
"    // R29.59_PREVIEW_ROUTE_BACKGROUND",
"    const isDashboardPreview = requestUrl.searchParams.get('preview') === '1'",
"    const requestedPreviewBg = String(requestUrl.searchParams.get('previewBg') || '#000000').trim()",
"    const previewBg = /^#[0-9a-f]{6}$/i.test(requestedPreviewBg) ? requestedPreviewBg : '#000000'",
"    let page = alertBoxOverlayHtml()",
"    if (isDashboardPreview) {",
"      page = page.replace(/(html,body\\{[^}]*?)background:[^;]+;/i, (_match, prefix) => prefix + 'background:' + previewBg + '!important;')",
"      page = page.replace(/(#stage\\{)/i, (_match, prefix) => prefix + 'background:' + previewBg + '!important;')",
"    }",
"    return html(response, 200, page)",
"  }",
"",
"  if (request.method === 'GET' && pathname === '/alertbox/status') {"
].join('\n')

server = server.replace(routeRegex, routeReplacement)
write(SERVER, server)

const verifyPanel = read(PANEL)
const verifyServer = read(SERVER)
if (!verifyPanel.includes("&previewBg=' + encodeURIComponent(previewBackground)")) die('Iframe previewBg URL bağlantısı eklenemedi.')
if (!verifyServer.includes('R29.59_PREVIEW_ROUTE_BACKGROUND')) die('Server-side preview background route eklenemedi.')
if (!verifyServer.includes("requestUrl.searchParams.get('preview') === '1'")) die('Preview/live ayrımı doğrulanamadı.')

console.log('\n=== R29.59 PREVIEW BACKGROUND ROUTE TAMAM ===')
console.log('Preview Background: server-side uygulanır; beyaz iframe yüzeyi kalmamalı')
console.log('Renk değişimi: iframe URL değiştiği için otomatik yeniden yüklenir')
console.log('OBS / normal /alertbox: şeffaf kalır')
console.log('Alert logic / TTS / Queue / Conditions: dokunulmadı')
console.log('Backup:', backupRoot)
console.log('\nBot servisini TAMAMEN kapatıp yeniden aç: npm run bot:dev')
console.log('Sonra ayrı terminalde: npx tauri dev')
