# Game thumbnails

Original local SVG illustrations for this reskin: Minecraft-style voxel grass block,
FiveM city/car scene, Rust survival scene, Source action scene and a generic server tile.
These are illustrative category images, not official game cover art or screenshots.
No external image service, tracking request or embedded base64 asset is used.

Selection is centralized in
`resources/scripts/components/branding/serverArtwork.ts`. It checks runtime/image/name
hints exposed by the existing client API. When hints are unavailable, it uses the generic
tile. `serverArtworkOverrides` can map a server's UUID to a known game and an optional
local image (for example `/branding/diamondcrew/games/prismatic.png`). Add custom
assets to `docs/diamondcrew-files.json` and rebuild before making a release.

The existing client API does not expose a reliable egg name for every server. A renamed
server with hidden runtime details may require an explicit override. Never infer a
player count from the game thumbnail or from a server name.
