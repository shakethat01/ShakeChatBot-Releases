import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const VERSION = 'R29.53'
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
const BACKUP = path.join(ROOT, `backup-${VERSION}-theme-${stamp}`)

function die(message) {
  console.error(`\n${VERSION} HATA: ${message}`)
  process.exit(1)
}
function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text, 'utf8') }
function hash(text) { return crypto.createHash('sha256').update(text).digest('hex') }
function backup(file) {
  if (!fs.existsSync(file)) return
  const rel = path.relative(ROOT, file)
  const target = path.join(BACKUP, rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(file, target)
}

if (!fs.existsSync(path.join(ROOT, 'package.json'))) die(`ShakeChatBot proje kökü bulunamadı: ${ROOT}`)

const ALERT = path.join(ROOT, 'src', 'components', 'AlertBoxPanel.tsx')
const GLOBAL_CSS = path.join(ROOT, 'src', 'r2952-ui.css')
const MAIN = path.join(ROOT, 'src', 'main.tsx')
if (!fs.existsSync(ALERT)) die('src/components/AlertBoxPanel.tsx bulunamadı.')
if (!fs.existsSync(MAIN)) die('src/main.tsx bulunamadı.')

for (const file of [ALERT, GLOBAL_CSS, MAIN]) backup(file)

const ALERTBOX_THEME = `      <style>{\`
        .sl-alertbox-parity{--sl-bg:#0a0d11;--sl-panel:#12171d;--sl-panel-2:#171d24;--sl-deep:#0d1116;--sl-border:#28303a;--sl-border-strong:#37414d;--sl-muted:#9299a3;--sl-text:#e7eaee;--sl-accent:#df9634;--sl-accent-hover:#eda94f;--sl-accent-soft:rgba(223,150,52,.12);min-height:100%;background:var(--sl-bg);color:var(--sl-text);padding:0!important}
        .sl-alertbox-parity .alertbox-hero{padding:18px 22px 14px;border-bottom:1px solid var(--sl-border);margin:0;background:#0f1318;box-shadow:0 1px 0 rgba(255,255,255,.015)}
        .sl-alertbox-parity .alertbox-hero-icon{display:none}
        .sl-alertbox-parity .alertbox-hero h2{font-size:25px;margin:0 0 7px;color:var(--sl-text)}
        .sl-alertbox-parity .alertbox-hero p{color:var(--sl-muted)}
        .sl-parity-shell{display:grid;grid-template-columns:210px minmax(0,1fr);min-height:calc(100vh - 94px)}
        .sl-parity-nav{background:#0d1116;border-right:1px solid var(--sl-border);padding:14px 10px 80px;position:sticky;top:0;align-self:start;height:calc(100vh - 1px);overflow:auto}
        .sl-parity-nav button{width:100%;justify-content:flex-start;border:1px solid transparent!important;background:transparent!important;color:#c9ced6!important;padding:7px 9px;border-radius:8px!important;min-height:32px;font-weight:650!important;box-shadow:none!important}
        .sl-parity-nav button:hover{background:#151b22!important;color:#f1f3f5!important;border-color:#222a33!important}
        .sl-parity-nav button.active{background:var(--sl-accent-soft)!important;color:#f3c27c!important;border-color:rgba(223,150,52,.24)!important;box-shadow:inset 3px 0 0 var(--sl-accent)!important}
        .sl-nav-group{margin-top:6px}.sl-nav-section{width:100%!important;font-size:13px!important;font-weight:800!important;margin:0!important;color:#e2e6ea!important;display:flex!important;justify-content:space-between!important;align-items:center!important;padding:8px 9px!important;min-height:32px!important;background:transparent!important}.sl-nav-section:hover{background:#141a20!important}.sl-nav-section-chevron{transition:transform .16s ease;transform:rotate(0deg);opacity:.72}.sl-nav-group.expanded .sl-nav-section-chevron{transform:rotate(180deg)}
        .sl-nav-sub{padding:0 0 5px}.sl-nav-sub button{padding-left:25px;font-size:12px;min-height:27px}.sl-nav-sub>div>button.active{box-shadow:inset 3px 0 0 var(--sl-accent)!important}
        .sl-nav-deep{margin-left:13px;border-left:1px solid var(--sl-border)}.sl-nav-deep button{padding-left:24px;font-size:12px;min-height:25px}
        .sl-nav-action{border-top:1px solid var(--sl-border);margin-top:6px;padding-top:6px}
        .sl-parity-main{min-width:0;padding:18px 22px 90px;background:linear-gradient(180deg,#0b0e12 0%,#0a0d11 100%)}
        .sl-topbar{display:grid;grid-template-columns:minmax(280px,1fr) auto auto auto;gap:8px;align-items:end;margin:0 0 18px}
        .sl-topbar .widget-field{min-width:0}.sl-topbar label{display:grid;gap:7px;font-weight:750;font-size:13px;color:#cbd1d8}.sl-topbar code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#0e1318;border:1px solid var(--sl-border);border-radius:9px;padding:10px 12px;color:#dfe4e8;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)}
        .sl-topbar button{height:38px;border-radius:9px!important;background:#1a2027!important;color:#e7eaee!important;border:1px solid #303945!important;font-weight:700!important;padding:0 15px;opacity:1!important}.sl-topbar button:hover:not(:disabled){background:#222a33!important;border-color:#414c59!important}.sl-topbar button.primary{background:#1a2027!important;color:#e7eaee!important}
        .sl-alertbox-parity button{color:#e7eaee!important;background:#1a2027!important;border:1px solid #303945!important;border-radius:9px!important;font-weight:700!important;opacity:1;box-shadow:0 1px 1px rgba(0,0,0,.16)!important}.sl-alertbox-parity button:hover:not(:disabled){background:#222a33!important;border-color:#414c59!important}.sl-alertbox-parity button:disabled{color:#7f8791!important;opacity:.5!important}.sl-alertbox-parity .alertbox-live-save,.sl-alertbox-parity .alertbox-test-button{background:var(--sl-accent)!important;color:#17120a!important;border-color:#e3a044!important}.sl-alertbox-parity .alertbox-live-save:hover,.sl-alertbox-parity .alertbox-test-button:hover{background:var(--sl-accent-hover)!important}
        .sl-test-wrap{position:relative}.sl-test-menu{position:absolute;z-index:1600;top:42px;right:0;width:160px;background:#171d24;border:1px solid var(--sl-border-strong);border-radius:10px;box-shadow:0 18px 46px rgba(0,0,0,.42);padding:5px}.sl-test-entry{position:relative}.sl-test-entry>button{width:100%;height:34px!important;justify-content:space-between!important;border-radius:7px!important;text-align:left;background:transparent!important;border-color:transparent!important}.sl-test-entry:hover>button{background:#222a33!important}.sl-test-submenu{display:none;position:absolute;left:100%;top:-5px;width:200px;background:#171d24;border:1px solid var(--sl-border-strong);border-radius:10px;box-shadow:0 18px 46px rgba(0,0,0,.42);padding:5px}.sl-test-entry:hover>.sl-test-submenu{display:block}.sl-test-submenu button{width:100%;min-height:34px;height:auto!important;justify-content:flex-start!important;border-radius:7px!important;text-align:left;padding:8px 10px!important;background:transparent!important;border-color:transparent!important}.sl-test-submenu button:hover{background:#222a33!important}.sl-test-submenu button[disabled]{opacity:.4!important}
        .sl-alertbox-parity .alertbox-grid{display:block}.sl-alertbox-parity .alertbox-card{background:var(--sl-panel)!important;border:1px solid var(--sl-border)!important;border-radius:12px!important;box-shadow:0 8px 26px rgba(0,0,0,.18)!important}
        .sl-alertbox-parity .alertbox-card-heading h3{font-size:16px;color:#e8ebef}.sl-alertbox-parity .alertbox-card-heading p{color:var(--sl-muted)}
        .sl-general-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,.9fr);gap:20px;align-items:start}
        .sl-alertbox-parity #alertbox-general-settings{padding:18px;margin:0}
        .sl-alertbox-parity #alertbox-global-editing{padding:18px;margin:0}.sl-alertbox-parity #alertbox-global-editing>.alertbox-card-heading{margin-bottom:14px}
        .sl-alertbox-parity #alertbox-global-editing .alertbox-card{min-height:250px}
        .sl-alertbox-parity .alertbox-editor-shell{margin-top:0}.sl-alertbox-parity .alertbox-editor-shell>.sl-event-editor-root{display:grid!important;grid-template-columns:minmax(0,1fr)!important}.sl-alertbox-parity .alertbox-editor-shell>.sl-event-editor-root>aside:first-child{display:none!important}
        .sl-event-primary-grid{min-width:0}.sl-event-primary-grid>.alertbox-card{min-width:0}.sl-event-primary-grid .alertbox-live-preview-card{min-width:0}
        .sl-alertbox-parity #alertbox-event-editor{background:transparent;border:0;padding:0;box-shadow:none}
        .sl-alertbox-parity .alertbox-kind-tabs,.sl-alertbox-parity .alertbox-subtype-tabs,.sl-alertbox-parity .alertbox-studio-profilebar{display:none}
        .sl-alertbox-parity .alertbox-editor-heading{background:transparent;border:0;padding:0 0 12px}.sl-alertbox-parity .alertbox-editor-heading h3{font-size:15px;color:#e7eaee}
        .sl-alertbox-parity .alertbox-editor-card>.alertbox-section-heading{margin-top:16px}
        .sl-alertbox-parity .alertbox-live-preview-card{position:sticky;top:12px}
        .sl-alertbox-parity .alertbox-live-stage{position:relative;width:100%;aspect-ratio:16/9;min-height:320px;overflow:hidden;background:#07090c;border-radius:10px}
        .sl-alertbox-parity .alertbox-live-frame{position:absolute;left:0;top:0;width:1920px;height:1080px;border:0;background:transparent;transform-origin:0 0;display:block}
        .sl-alertbox-parity .alertbox-live-offline{position:absolute;inset:0;display:grid;place-items:center;padding:20px;background:rgba(7,9,12,.86);color:#b9c0c8;font-size:12px;text-align:center;z-index:2}
        .sl-alertbox-parity input,.sl-alertbox-parity select,.sl-alertbox-parity textarea{background:#0e1318!important;color:#e7eaee!important;border:1px solid #303945!important;border-radius:8px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.015)!important}.sl-alertbox-parity input:focus,.sl-alertbox-parity select:focus,.sl-alertbox-parity textarea:focus{border-color:rgba(223,150,52,.78)!important;box-shadow:0 0 0 3px rgba(223,150,52,.11)!important;outline:none!important}
        .sl-alertbox-parity input[type=range]{background:transparent!important;border:0!important;accent-color:var(--sl-accent)!important}
        .sl-alertbox-parity input[type=checkbox],.sl-alertbox-parity input[type=radio]{accent-color:var(--sl-accent)!important}
        .sl-alertbox-parity .alertbox-footnote{display:none}
        .sl-modal-parity{border-radius:12px!important;background:#12171d!important;border:1px solid var(--sl-border)!important;box-shadow:0 24px 70px rgba(0,0,0,.5)!important}.sl-modal-parity h3{font-size:18px;color:#e8ebef}.sl-modal-parity .sl-modal-footer{background:#0e1318;margin:18px -20px -20px;padding:13px 20px;border-top:1px solid var(--sl-border)}
        @media(max-width:1250px){.sl-event-primary-grid{grid-template-columns:minmax(0,1fr)!important}.sl-alertbox-parity .alertbox-live-preview-card{position:relative;top:auto}.sl-parity-main{padding-left:16px;padding-right:16px}.sl-topbar{grid-template-columns:minmax(220px,1fr) auto auto auto}}
        @media(max-width:980px){.sl-parity-shell{grid-template-columns:1fr}.sl-parity-nav{position:relative;height:auto;border-right:0;border-bottom:1px solid var(--sl-border)}.sl-topbar{grid-template-columns:1fr 1fr}.sl-general-layout{grid-template-columns:1fr}.sl-parity-main{padding:14px 12px 80px}}
      \`}</style>`

const GLOBAL_THEME = `/* ShakeChatBot ${VERSION} · unified modern dark theme */
:root{
  color-scheme:dark;
  --scb-bg:#0a0d11;
  --scb-bg-2:#0d1116;
  --scb-surface:#12171d;
  --scb-surface-2:#171d24;
  --scb-surface-3:#1c232b;
  --scb-border:#28303a;
  --scb-border-strong:#37414d;
  --scb-text:#e7eaee;
  --scb-muted:#9299a3;
  --scb-accent:#df9634;
  --scb-accent-hover:#eda94f;
  --scb-accent-soft:rgba(223,150,52,.12);
  --scb-danger:#b74a4a;
  --scb-success:#4f9b72;
  --scb-radius:10px;
  --scb-radius-lg:13px;
}

html,body,#root{background:#0a0d11!important;color:var(--scb-text)!important}
body{background:linear-gradient(180deg,#0a0d11 0%,#0d1116 100%)!important}
#root{min-height:100vh}
#root *{box-sizing:border-box}
#root :where(h1,h2,h3,h4,h5,h6){color:var(--scb-text)}
#root :where(p,small,.muted,[class*="muted" i],[class*="subtitle" i],[class*="description" i]){color:var(--scb-muted)}
#root :where(a){color:#dca25a}
#root :where(a:hover){color:#f0b766}

/* Surfaces: colors/borders only; existing layouts stay intact. */
#root :where(.panel,.card,.settings-card,.dashboard-card,.modal,.dialog,.drawer,.popover,[class$="-panel"],[class$="-card"],[class$="-modal"],[class$="-dialog"]){
  background-color:var(--scb-surface)!important;
  border-color:var(--scb-border)!important;
  color:var(--scb-text)!important;
}
#root :where(.panel,.card,.settings-card,.dashboard-card,[class$="-panel"],[class$="-card"]){
  border-radius:var(--scb-radius-lg)!important;
  box-shadow:0 8px 28px rgba(0,0,0,.16)!important;
}
#root :where(.modal,.dialog,.drawer,.popover,[class$="-modal"],[class$="-dialog"]){
  border-radius:var(--scb-radius-lg)!important;
  box-shadow:0 24px 70px rgba(0,0,0,.48)!important;
}
#root :where(.sidebar,[class$="-sidebar"],nav,[class$="-nav"]){border-color:var(--scb-border)!important}
#root :where(.toolbar,.topbar,.header,[class$="-toolbar"],[class$="-topbar"]){border-color:var(--scb-border)!important;color:var(--scb-text)!important}

/* Controls */
#root :where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),select,textarea){
  background:#0e1318!important;
  color:var(--scb-text)!important;
  border:1px solid var(--scb-border-strong)!important;
  border-radius:8px!important;
  outline:none!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.015)!important;
}
#root :where(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),select,textarea):focus{
  border-color:rgba(223,150,52,.78)!important;
  box-shadow:0 0 0 3px rgba(223,150,52,.11)!important;
}
#root :where(input[type="checkbox"],input[type="radio"],input[type="range"]){accent-color:var(--scb-accent)!important}
#root :where(input,select,textarea)::placeholder{color:#69727d!important}

#root button:not([class*="danger" i]):not([class*="destructive" i]){
  background:#1a2027!important;
  color:#e7eaee!important;
  border-color:#303945!important;
  border-radius:9px!important;
  box-shadow:0 1px 1px rgba(0,0,0,.16)!important;
  transition:background .14s ease,border-color .14s ease,color .14s ease,transform .14s ease!important;
}
#root button:not([class*="danger" i]):not([class*="destructive" i]):hover:not(:disabled){background:#222a33!important;border-color:#414c59!important;color:#f4f5f6!important}
#root button:focus-visible{outline:2px solid rgba(223,150,52,.8)!important;outline-offset:2px!important}
#root button:disabled{opacity:.48!important}
#root :where(button.primary,button[class*="primary" i],button[class*="save" i],button[class*="test-button" i]){
  background:var(--scb-accent)!important;
  border-color:#e3a044!important;
  color:#17120a!important;
}
#root :where(button.primary,button[class*="primary" i],button[class*="save" i],button[class*="test-button" i]):hover:not(:disabled){background:var(--scb-accent-hover)!important;border-color:#efae52!important;color:#17120a!important}
#root :where(button[class*="danger" i],button[class*="destructive" i]){background:#2a1719!important;border-color:#613035!important;color:#efb4b7!important;border-radius:9px!important}
#root :where(button[class*="danger" i],button[class*="destructive" i]):hover:not(:disabled){background:#351b1e!important;border-color:#7a3940!important}

/* Selection / tabs / nav */
#root :where(.active,[aria-selected="true"],[aria-current="page"],[data-active="true"]):not(input):not(option){border-color:rgba(223,150,52,.34)!important}
#root :where(.tab.active,[class*="tab" i][aria-selected="true"],nav button.active,.sidebar button.active){background:var(--scb-accent-soft)!important;color:#f1bd75!important;box-shadow:inset 3px 0 0 var(--scb-accent)!important}
#root :where(.badge,.chip,.pill,[class$="-badge"],[class$="-chip"],[class$="-pill"]){border-color:var(--scb-border)!important}
#root :where(hr){border-color:var(--scb-border)!important}
#root :where(code,kbd,pre){background:#0d1217!important;border-color:var(--scb-border)!important;color:#d8dde3!important}

/* Tables / lists */
#root table{border-color:var(--scb-border)!important;color:var(--scb-text)!important}
#root :where(th,td){border-color:var(--scb-border)!important}
#root th{background:#10151a!important;color:#cfd5dc!important}
#root tbody tr:hover{background:rgba(255,255,255,.018)!important}

/* Toggles and form labels */
#root :where(label,.settings-toggle){color:#cdd2d8}
#root .settings-toggle{border-color:var(--scb-border)!important}

/* AlertBox is intentionally stronger because it had an embedded Streamlabs-like theme. */
#root .sl-alertbox-parity{--sl-bg:#0a0d11!important;--sl-panel:#12171d!important;--sl-deep:#0d1116!important;--sl-border:#28303a!important;--sl-muted:#9299a3!important;--sl-accent:#df9634!important;background:#0a0d11!important;color:#e7eaee!important}
#root .sl-alertbox-parity .alertbox-hero{background:#0f1318!important;border-color:#28303a!important}
#root .sl-alertbox-parity .sl-parity-nav{background:#0d1116!important;border-color:#28303a!important}
#root .sl-alertbox-parity .alertbox-card{background:#12171d!important;border-color:#28303a!important;border-radius:12px!important}
#root .sl-alertbox-parity input,#root .sl-alertbox-parity select,#root .sl-alertbox-parity textarea{background:#0e1318!important;border-color:#303945!important;color:#e7eaee!important;border-radius:8px!important}
#root .sl-alertbox-parity .sl-test-menu,#root .sl-alertbox-parity .sl-test-submenu{background:#171d24!important;border-color:#37414d!important}

/* ChatBox page from R29.52 */
[data-scb-r2952="chatbox"]{background:#0a0d11!important;color:var(--scb-text)!important;border:1px solid var(--scb-border)!important;border-radius:13px!important;box-shadow:0 8px 28px rgba(0,0,0,.16)!important}
[data-scb-r2952="chatbox"] :where(h1,h2,h3,strong){color:var(--scb-text)!important}
[data-scb-r2952="chatbox"] :where(p,small){color:var(--scb-muted)!important}
[data-scb-r2952="chatbox"] iframe{background:#07090c!important;border:1px solid var(--scb-border)!important;border-radius:12px!important}

/* Scrollbars */
*{scrollbar-color:#39424d #0b0f13;scrollbar-width:thin}
*::-webkit-scrollbar{width:10px;height:10px}
*::-webkit-scrollbar-track{background:#0b0f13}
*::-webkit-scrollbar-thumb{background:#39424d;border:2px solid #0b0f13;border-radius:999px}
*::-webkit-scrollbar-thumb:hover{background:#46515e}
::selection{background:rgba(223,150,52,.28);color:#fff}
`

let alert = read(ALERT)
const conditionStart = alert.indexOf('const CONDITION_OPTIONS = {')
const conditionEnd = alert.indexOf('function conditionOptionsFor', conditionStart)
if (conditionStart < 0 || conditionEnd < 0) die('Conditions güvenlik bloğu bulunamadı; işlem durduruldu.')
const conditionsBefore = alert.slice(conditionStart, conditionEnd)
const conditionsHashBefore = hash(conditionsBefore)

const sectionAnchor = '<section className="alertbox-page sl-alertbox-parity">'
const sectionPos = alert.indexOf(sectionAnchor)
if (sectionPos < 0) die('AlertBox ana section bulunamadı.')
const styleStartToken = '<style>{`'
const styleEndToken = '`}</style>'
const styleStart = alert.indexOf(styleStartToken, sectionPos)
const styleEnd = alert.indexOf(styleEndToken, styleStart)
if (styleStart < 0 || styleEnd < 0) die('AlertBox gömülü tema bloğu bulunamadı.')

alert = alert.slice(0, styleStart) + ALERTBOX_THEME + alert.slice(styleEnd + styleEndToken.length)

// R29.52'de oluşan yalnızca okunabilir redundant TTS condition'ını temizle; davranış değişmez.
alert = alert.replace(
  "{((selectedFamily.id === 'subscription' || selectedFamily.id === 'kick_subscription') || selectedFamily.id === 'kick_subscription') ? (",
  "{(selectedFamily.id === 'subscription' || selectedFamily.id === 'kick_subscription') ? (",
)

const conditionStartAfter = alert.indexOf('const CONDITION_OPTIONS = {')
const conditionEndAfter = alert.indexOf('function conditionOptionsFor', conditionStartAfter)
const conditionsAfter = alert.slice(conditionStartAfter, conditionEndAfter)
if (hash(conditionsAfter) !== conditionsHashBefore) die('GÜVENLİK: Conditions bloğu değişmiş görünüyor; dosya yazılmadı.')
if (!alert.includes("selectedFamily.id === 'kick_subscription'")) die('GÜVENLİK: Kick subscription TTS bağlantısı kayboldu; dosya yazılmadı.')
for (const oldColor of ['#14242d','#172a34','#65e6c2','#5d6d75','#13232c','#10212a','#233740','#71818a']) {
  const newStyleStart = alert.indexOf(styleStartToken, sectionPos)
  const newStyleEnd = alert.indexOf(styleEndToken, newStyleStart)
  const styleOnly = alert.slice(newStyleStart, newStyleEnd)
  if (styleOnly.toLowerCase().includes(oldColor)) die(`GÜVENLİK: Eski AlertBox rengi kaldı: ${oldColor}`)
}
write(ALERT, alert)
write(GLOBAL_CSS, GLOBAL_THEME)

let main = read(MAIN)
if (!main.includes("./r2952-ui.css")) {
  const imports = [...main.matchAll(/^import[^\n]*$/gm)]
  if (imports.length) {
    const last = imports.at(-1)
    const pos = (last.index ?? 0) + last[0].length
    main = main.slice(0, pos) + "\nimport './r2952-ui.css'" + main.slice(pos)
  } else {
    main = "import './r2952-ui.css'\n" + main
  }
  write(MAIN, main)
}

const verifyAlert = read(ALERT)
const verifyCss = read(GLOBAL_CSS)
if (!verifyAlert.includes('--sl-accent:#df9634')) die('Doğrulama: yeni AlertBox teması yazılmadı.')
if (!verifyCss.includes('--scb-accent:#df9634')) die('Doğrulama: global tema yazılmadı.')
if (!read(MAIN).includes("./r2952-ui.css")) die('Doğrulama: global CSS importu bulunamadı.')

console.log(`\n=== ShakeChatBot ${VERSION} UNIFIED MODERN THEME TAMAM ===`)
console.log('Tema: koyu antrasit / düşük kontrast yüzey / sıcak amber vurgu')
console.log('AlertBox: Streamlabs turkuaz/ gri tema kaldırıldı')
console.log('ChatBox: aynı görsel sisteme bağlandı')
console.log('Uygulama geneli: panel, kart, input, buton, modal, tablo ve navigasyon aynı stile bağlandı')
console.log('Alert logic: değiştirilmedi')
console.log('Kick TTS: korundu')
console.log('Conditions: hash doğrulandı, değiştirilmedi')
console.log(`Yedek: ${BACKUP}`)
console.log('\nŞimdi npx tauri dev ile açıp görünümü kontrol et.')
