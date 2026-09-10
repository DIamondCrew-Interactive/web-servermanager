# DiamondCrew Server Manager — reskin Pterodactyl 1.15.1

## Výchozí zdroj a rozsah

Verze v `config/app.php`: **1.15.1**. Dodaný adresář je release snapshot bez `.git`,
proto nelze doložit commit/tag. Záloha před úpravami je
`.diamondcrew-backup/stock-frontend.tar.gz` (resources, public, package.json,
yarn.lock, tailwind.config.js a webpack.config.js; neobsahuje `.env`).

Klient: React 16.14, React Router 5, TypeScript 5.1, Tailwind 3, twin.macro,
styled-components 5, CSS modules, Formik, Easy Peasy, SWR. Build: Babel + Webpack 5,
PostCSS, Terser, WebpackAssetsManifest se SHA-384 integritou. Lockfile instaloval
Webpack 5.105.2. Administrace: Laravel Blade, AdminLTE 2, Bootstrap 3, jQuery,
Select2 a SweetAlert; její CSS se nekompiluje v React bundlu.

Node **22+** podle package.json, Yarn Classic **1.22.22**. Údaj Node 14 v původním
BUILDING.md je pro tento snapshot zastaralý.

Nezměnily se routes, API klienti, kontrolery, middleware, autentizační handlery,
permissions, modely, databáze, konfigurace backendu ani `.env`. Interní identifikátory
`PterodactylUser`, `Pterodactyl.*`, namespace, package name a interní jméno okna konzole
jsou zachované. Zachované jsou také upstream odkazy na dokumentaci, aktualizace,
autory eggs a licenční soubory. Název instalace v nastavení/mailových konfiguracích se
nepřepisuje; viditelný brand frontendových layoutů je pevně DiamondCrew Server Manager.

## Mapa frontendu a pokrytí

| Oblast | Původní zdroj / způsob reskinu |
| --- | --- |
| Header a brand klienta | `resources/scripts/components/NavigationBar.tsx`, nová `components/branding/Brand.tsx` |
| Navigace klienta/serveru | `components/elements/SubNavigation.tsx`; původní routery a podmínky oprávnění beze změny |
| Přihlášení, 2FA, recovery, reset hesla | `components/auth/LoginFormContainer.tsx`; společný tmavý obal původních formulářů |
| Dashboard a seznam serverů | `components/dashboard/DashboardContainer.tsx`, původní `ServerRow.tsx` přes `GreyRowBox` |
| Server detail a konzole | `components/server/console/`; xterm pozadí bere theme black; ANSI stavové barvy zachovány; network graf blue/pink |
| Files, databases, schedules, users, backups, network, startup, settings | původní `components/server/` obrazovky přes Tailwind/twin paletu a sdílené prvky |
| Karty | `elements/GreyRowBox.tsx`, `TitledGreyBox.tsx`, ostatní přes theme paletu |
| Tlačítka a formuláře | `elements/Button.tsx`, `elements/button/`, `Input.tsx`, `Label.tsx`, `Select.tsx`, `elements/inputs/`; obě generace UI používají stejné tokeny |
| Tabulky a seznamy klienta | utility/CSS modules, sdílené řádky a přemapování gray/neutral |
| Modály a menu | `elements/Modal.tsx`, `elements/dialog/style.module.css`, `DropdownMenu.tsx`; beze změny událostí/focus managementu |
| Notifikace/chyby | `components/MessageBox.tsx`, `FlashMessageRender.tsx`, `elements/ScreenBlock.tsx`; semantic stavy zachovány |
| Admin header/sidebar/footer | `resources/views/layouts/admin.blade.php`; všechny menu položky a collapse zachovány |
| Admin obrazovky | `resources/views/admin/`: overview, servers, users, nodes, locations, nests, eggs, databases, mounts, settings a API přes `admin.css` |
| Admin tabulky/formuláře/dialogy | společná vrstva Bootstrap/AdminLTE včetně Select2, SweetAlert, alerts, pagination, tabs, dropdown, readonly/disabled/error/hover |
| Title/favicon/manifest | `templates/wrapper.blade.php`, `layouts/admin.blade.php`, partial `diamondcrew/head`, `PageContentBlock.tsx` |

Referenční screenshot slouží jako výtvarná předloha. Reskin nepřidává nepodporované
dashboard statistiky, nové API, nové menu nebo fiktivní data. Klient ponechává původní
horní navigaci; administrace svůj sidebar. Výsledkem je reskin skutečného panelu.

## Theme systém a assets

```text
resources/diamondcrew/tokens.json       jediný zdroj základní palety
tailwind.config.js                     mapuje gray/neutral/blue/primary/black
scripts/diamondcrew-theme.cjs           generátor browser CSS variables
public/branding/diamondcrew/
  tokens.css                           generované --dc-* proměnné
  brand.css                            společný logo lockup a gradient
  client.css                           React shell, auth, focus, mobil
  admin.css                            AdminLTE/Bootstrap compatibility layer
  diamond-logo.png                     nezměněné originální logo 1024x1024
  diamond-circle-logo.png              nezměněná varianta 768x768 + favicon
  manifest.webmanifest                 název, ikona a metadata
resources/scripts/components/branding/Brand.tsx
resources/views/partials/diamondcrew/{brand,head}.blade.php
```

Originály pocházejí z lokálního `Downloads/fivem-txadmindc-main.zip`,
`panel/public/images/`. Samostatný diamant odpovídá příloze. V UI je použita kruhová
varianta ze stejného txAdminu. Žádné base64 logo ani AI náhrada. Favicon a Apple touch
icon odkazují přímo na originální PNG; prohlížeč ho škáluje.

Přesný gradient převzat z txAdmin `panel/src/layout/Header.tsx`, `AuthShell.tsx`
a `MainSheets.tsx`: **to right, #2ec7ff 0%, #f43cb2 50%, #f3d36b 100%**.
Primary tlačítka používají tmavší modré odstíny kvůli kontrastu textu.
Success/error/warning zůstávají zelené/červené/žluté. Terminal ANSI barvy a barevné
upozornění na limity serveru se nepřeznačují růžovou nebo zlatou.

Po změně tokenů spusťte build. `tokens.css` neupravujte ručně. Kompatibilitní CSS
obsahuje i lokální transparentní dekorace a kontrastní semantic povrchy. Při změně
background aktualizujte také theme-color v `head.blade.php` a manifest metadata.
Blade stylesheet URL používají `filemtime`, aby se po aktualizaci změnila cache URL.

## Změněné soubory

Úplný strojově čitelný seznam je `docs/diamondcrew-files.json`: `modified` jsou upstream
soubory, `added` nové theme soubory, `productionAssets` přesné aktuální hashované build
výstupy. `baseline` obsahuje SHA-256 před úpravami. Čitelný upstream diff je
`docs/diamondcrew-upstream.patch`; obsahuje pouze změny existujících souborů.

Hlavní změny: package.json (theme build hook a přenositelný production build bez mazání),
tailwind.config.js, NavigationBar, LoginFormContainer, PageContentBlock, GreyRowBox,
TitledGreyBox, SubNavigation, Input, Label, DropdownMenu, ScreenBlock,
DashboardContainer, dialog/style.module.css, console/StatGraphs, oba Blade layouty,
admin/index, admin/nests/index, tři admin/settings šablony a lang/en/strings.

Nové dokumenty: tento soubor, `diamondcrew-files.json`, `diamondcrew-baseline.sha256`
a `diamondcrew-upstream.patch`. `.diamondcrew-backup/` jsou jen lokální zálohy,
kontrolní skripty, logy, screenshoty a distribuční balíček; nepatří na webový server
ani do budoucího Git commitu.

## Build a ověření

```bash
node --version
npx --yes --package=yarn@1.22.22 yarn install --frozen-lockfile
npm run tsc
npm run lint
npm run build:production
npm test
```

`build:production` nejdříve generuje CSS tokeny, potom spouští production Webpack.
Záměrně nemaže staré hashované assety: starší otevřené relace mohou dál načíst svůj
chunk. Autoritativní aktuální sada a SRI jsou v `public/assets/manifest.json`.
Žádné lint/typecheck pravidlo nebylo vypnuto. Závislosti ani yarn.lock se neměnily.

Výsledky na Node 22.14.0:

- `tsc --noEmit`: PASS, bez diagnostik.
- ESLint: PASS, bez diagnostik.
- Production Webpack 5.105.2: PASS (finální běh přibližně 40 sekund).
- Původní Jest testy: 4 sady, 46 testů PASS.
- Chromium: skutečný production React bundle, desktop 1440 a mobil 390 px; login
  validace a request payload, přechod na 2FA/recovery, reset validace, dashboard,
  title, logo, tmavé pozadí, žádné page errors nebo vodorovný overflow.
- AdminLTE smoke fixture používá skutečné header/sidebar značky, CSS a JS pluginy:
  výběr Select2 a otevření/zavření SweetAlert PASS. Nejde o Blade integrační test.
- Ověřena SHA-384 integrita všech JS souborů z produkčního manifestu; font má v
  upstream manifest generátoru prázdnou SRI hodnotu a byl ověřen jako existující asset.

Upstream upozornění: zastaralá Browserslist databáze, deprecace fs.Stats,
nadbytečný line-clamp plugin, peer dependency varování při instalaci a ts-jest
upozornění na TypeScript 5.1. Neřešeno vypínáním kontrol ani aktualizací lockfile.

PHP v lokálním PATH není. Nebyl spuštěn Laravel, skutečný login, odesílání reset emailů,
reCAPTCHA challenge, Wings websocket, akce nad soubory či databázemi. Pro browser smoke
byly backendové odpovědi lokálně zachycené. Nejde o potvrzení end-to-end funkčnosti
živého serveru. Logy a screenshoty jsou v `.diamondcrew-backup/`.

## Deployment na existující server

Nic nebylo nasazeno ani pushnuto. Adresa serveru, instalační cesta a systémový PHP
uživatel nebyly zadány. Následující postup předpokládá Linux, stejný zdroj **1.15.1**,
`/var/www/pterodactyl` a `www-data`; před použitím nastavte skutečné hodnoty.
Na server se nahrává připravený balíček, nikoli celý lokální adresář.

1. Nejprve celý postup proveďte na staging kopii. Přeneste
   `.diamondcrew-backup/diamondcrew-reskin-1.15.1.tar.gz` a sousední `.sha256`
   do `/tmp/dc-reskin-upload/` (SFTP/SCP dle vašeho přístupu).
2. Na serveru ověřte hash, rozbalte balíček do dočasné složky a ověřte výchozí soubory:

```bash
set -e
PANEL_ROOT=/var/www/pterodactyl
WEB_USER=www-data
UPLOAD=/tmp/dc-reskin-upload
cd "$UPLOAD"
sha256sum --check diamondcrew-reskin-1.15.1.tar.gz.sha256
STAGE=$(mktemp -d /tmp/dc-reskin.XXXXXX)
tar --no-same-owner -xzf "$UPLOAD/diamondcrew-reskin-1.15.1.tar.gz" -C "$STAGE"
cd "$PANEL_ROOT"
grep "'version'" config/app.php
sha256sum --check "$STAGE/docs/diamondcrew-baseline.sha256"
```

Při jiné verzi nebo jakémkoli mismatch se zastavte: lokální úpravy serveru se nemají
přepsat. Použijte níže popsané znovuaplikování a nový build na odpovídajícím zdroji.

3. Uložte zálohu aktuálního serverového frontendu mimo public a nasaďte pod maintenance:

```bash
BACKUP="/var/backups/diamondcrew-frontend-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" resources public package.json tailwind.config.js yarn.lock
printf 'Rollback archive: %s\n' "$BACKUP"
sudo -u "$WEB_USER" php artisan down
tar --no-same-owner -xzf "$UPLOAD/diamondcrew-reskin-1.15.1.tar.gz" -C "$PANEL_ROOT"
sudo -u "$WEB_USER" php artisan view:clear
sudo -u "$WEB_USER" php artisan view:cache
sudo -u "$WEB_USER" php artisan up
```

Spouštějte se serverovými právy potřebnými k zápisu instalace a `/var/backups`.
Nové soubory musí být čitelné uživatelem PHP/web serveru. Při selhání po `down` použijte
rollback; neobcházejte chybu cache kompilace. Balíček neobsahuje `.env`, backend,
vendor, node_modules, databázi nebo storage. Neprovádějte migrace ani update Composeru
kvůli tomuto reskinu. Wings ani běžící herní servery se nerestartují.

4. Ověřte login, chybné heslo, 2FA/recovery, reset, účet bez admin práv a s omezenými
   subuser permissions. Projděte všechny klientské záložky, websocket konzoli,
   file editor/upload, modály, zálohy a všechny admin menu položky, mobilní sidebar,
   Select2, potvrzovací dialogy a notifikace. Zkontrolujte 404 assetů/CSP v DevTools
   a favicon po hard reload. U CDN invalidujte HTML a branding CSS, ne celé API.

## Znovuaplikování po Pterodactyl update

1. Zazálohujte současný frontend a proveďte upstream update odděleně. Reskin verze
   1.15.1 nesmí vrátit staré routovací nebo bezpečnostní změny do novější verze.
2. V pracovní kopii nového upstreamu spusťte
   `git apply --check /cesta/k/docs/diamondcrew-upstream.patch`.
3. Pokud kontrola projde, aplikujte patch pomocí `git apply`. Přidejte nové soubory
   ze seznamu `added`: `resources/diamondcrew/`, `components/branding/`,
   `views/partials/diamondcrew/`, `scripts/diamondcrew-theme.cjs`,
   `public/branding/diamondcrew/`. Nepřepisujte celý resources/public starou verzí.
4. Při konfliktu ručně přeneste pouze theme importy, CSS třídy, brand a prezentační
   texty do nových upstream komponent; zachovejte novou logiku a menu. Ověřte nové
   utility názvy, strukturu AdminLTE/Blade a bundler konfiguraci.
5. Spusťte frozen install, typecheck, lint, production build, testy a staging smoke.
   Po aktualizaci se vždy generují nové JS assety i manifest; starý bundle nepoužívejte.
6. Obnovte seznam souborů, diff a baseline hashe podle nového upstreamu. Pro novou verzi
   vytvořte nový deployment balíček; tento balíček je určen pouze pro výchozí 1.15.1.

## Rollback

Na serveru obnovte zálohu vytvořenou těsně před deploymentem, včetně odpovídajícího
manifestu a JS chunků. Databázi ani `.env` nevracejte:

```bash
cd /var/www/pterodactyl
WEB_USER=www-data
BACKUP=/var/backups/diamondcrew-frontend-YYYYMMDD-HHMMSS.tar.gz
test -f "$BACKUP"
sudo -u "$WEB_USER" php artisan down
tar --no-same-owner -xzf "$BACKUP" -C "$PWD"
sudo -u "$WEB_USER" php artisan view:clear
sudo -u "$WEB_USER" php artisan view:cache
sudo -u "$WEB_USER" php artisan up
```

Nové branding soubory a nové hashované chunky mohou zůstat na disku neodkazované;
rollback nic nemaže. Pro návrat k původnímu lokálnímu stock designu 1.15.1 obnovte
`tar -xzf .diamondcrew-backup/stock-frontend.tar.gz` v kořeni projektu. Tím se obnoví
také původní build skript a paleta. Po budoucím upstream update používejte zálohu
stejné verze, nikdy starý archiv 1.15.1.
