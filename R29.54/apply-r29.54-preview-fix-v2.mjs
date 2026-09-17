import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.54-preview-fix-v2'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T','_').slice(0,19)
const BACKUP = path.join(ROOT, `backup-${VERSION}-${stamp}`)

function die(message){ console.error(`\n${VERSION} HATA: ${message}`); process.exit(1) }
function read(file){ return fs.readFileSync(file,'utf8') }
function write(file,text){ fs.writeFileSync(file,text,'utf8') }
function backup(file){
  if(!fs.existsSync(file)) return
  const rel=path.relative(ROOT,file)
  const out=path.join(BACKUP,rel)
  fs.mkdirSync(path.dirname(out),{recursive:true})
  fs.copyFileSync(file,out)
}

if(!fs.existsSync(path.join(ROOT,'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)

const PANEL=path.join(ROOT,'src','components','AlertBoxPanel.tsx')
const SERVER=path.join(ROOT,'bot-service','server.mjs')
if(!fs.existsSync(PANEL)) die('src/components/AlertBoxPanel.tsx bulunamadı.')
if(!fs.existsSync(SERVER)) die('bot-service/server.mjs bulunamadı.')

backup(PANEL)
backup(SERVER)

let panel=read(PANEL)

// Sorunun 1. kısmı: stage 16:9 hesaplanmasına rağmen inline minHeight:320
// yüzünden iframe bittikten sonra altta ikinci checkerboard şeridi kalıyordu.
panel=panel.replace(
  /className="alertbox-live-stage alertbox-live-stage-exact" style=\{\{ border: 0, borderRadius: 0, minHeight: 320 \}\}/g,
  'className="alertbox-live-stage alertbox-live-stage-exact" style={{ border: 0, borderRadius: 0, minHeight: 0 }}'
)

// Inline tema kuralı eski veya yeni sürüm fark etmeksizin stage'i tam 16:9 yap.
panel=panel.replace(
  /\.sl-alertbox-parity \.alertbox-live-stage\{[^}]*\}/g,
  '.sl-alertbox-parity .alertbox-live-stage{position:relative;width:100%;aspect-ratio:16/9;min-height:0!important;overflow:hidden;background:#0f1419!important}'
)

panel=panel.replace(
  /\.sl-alertbox-parity \.alertbox-live-frame\{[^}]*\}/g,
  '.sl-alertbox-parity .alertbox-live-frame{position:absolute;left:0;top:0;width:1920px;height:1080px;border:0;background:transparent!important;transform-origin:0 0;display:block}'
)

write(PANEL,panel)

let server=read(SERVER)

// Sorunun 2. kısmı: iframe dokümanı şeffaf olsa bile preview WebView beyaz yüzey gösterebiliyor.
// Checkerboard'u parent'a değil, sadece ?preview=1 olan iframe'in kendi HTML'ine koyuyoruz.
// Canlı OBS URL'si previewMode=false olduğu için tamamen şeffaf kalır.
if(!server.includes('R29_54_SINGLE_PREVIEW_SURFACE')){
  const needle="var params=new URLSearchParams(window.location.search),previewMode=params.get('preview')==='1',eventFilter="
  const start=server.indexOf(needle)
  if(start<0) die('AlertBox previewMode satırı bulunamadı.')
  const end=server.indexOf(';',start)
  if(end<0) die('AlertBox previewMode satırı tamamlanamadı.')

  const inject=`\n// R29_54_SINGLE_PREVIEW_SURFACE\nif(previewMode){\n  var previewChecker='repeating-conic-gradient(#10161c 0% 25%,#192129 0% 50%) 0 0 / 24px 24px';\n  document.documentElement.style.background=previewChecker;\n  document.body.style.background='transparent';\n  stage.style.background='transparent';\n}\n`
  server=server.slice(0,end+1)+inject+server.slice(end+1)
}

write(SERVER,server)

const verifyPanel=read(PANEL)
const verifyServer=read(SERVER)
if((verifyPanel.match(/minHeight: 0/g)||[]).length<2) die('İki preview stage de düzeltilmedi.')
if(!verifyServer.includes('R29_54_SINGLE_PREVIEW_SURFACE')) die('Preview checkerboard eklenemedi.')

console.log('\n=== R29.54 PREVIEW FIX V2 TAMAM ===')
console.log('Tek preview alanı      : OK')
console.log('Alttaki ikinci şerit   : kaldırıldı')
console.log('Preview iframe zemini  : checkerboard')
console.log('OBS canlı overlay      : şeffaf kaldı')
console.log('Alert / TTS / Queue    : dokunulmadı')
console.log('Conditions             : dokunulmadı')
console.log('Backup                 :',BACKUP)
console.log('\nBot servisini ve npx tauri dev penceresini yeniden başlat.')
