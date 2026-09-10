# DiamondCrew branding

`diamond-logo.png` (1024x1024) and `diamond-circle-logo.png` (768x768) are unchanged originals from
`fivem-txadmindc-main.zip`, `panel/public/images/`, supplied in the local Downloads directory.
The first matches the conversation attachment. The circular variant is used in the header,
login, favicon, Apple touch icon and web manifest, just as in the custom txAdmin ecosystem.
Browsers scale the original PNG for favicon/touch-icon use; no generated or base64 substitute.

Gradient reference: txAdmin `panel/src/layout/Header.tsx`, `AuthShell.tsx` and `MainSheets.tsx`:
`bg-gradient-to-r from-[#2ec7ff] via-[#f43cb2] to-[#f3d36b]`.

Edit `resources/diamondcrew/tokens.json`, then run `npm run theme:diamondcrew`.
Do not edit the generated `tokens.css`. Client/Blade share `brand.css`; the two compatibility
layers are `client.css` and `admin.css`. Semantic success/error/warning states remain distinct.
See `docs/diamondcrew-reskin.md` for build, deployment and rollback.
