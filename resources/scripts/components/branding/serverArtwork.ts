import { Server } from '@/api/server/getServer';

export type GameType = 'minecraft' | 'fivem' | 'rust' | 'source' | 'generic';
// Optional overrides use a server UUID and local branding assets. No extra API or credentials.
export const serverArtworkOverrides: Record<string, { game: GameType; image?: string }> = {};

export function serverArtwork(server: Pick<Server, 'uuid' | 'name' | 'dockerImage' | 'invocation' | 'eggFeatures'>) {
    const override = serverArtworkOverrides[server.uuid];
    const hint = `${server.dockerImage || ''} ${server.invocation || ''} ${(server.eggFeatures || []).join(' ')} ${
        server.name
    }`.toLowerCase();
    const game: GameType =
        override?.game ||
        (/fivem|fxserver|cfx/.test(hint)
            ? 'fivem'
            : /minecraft|paper(?:mc|\.jar)|purpur|spigot|bungeecord|velocity|bedrock|forge|fabric/.test(hint)
            ? 'minecraft'
            : /rust(?:dedicated|\b)/.test(hint)
            ? 'rust'
            : /srcds|counter.strike|csgo|cs2|garry/.test(hint)
            ? 'source'
            : 'generic');
    const labels = { minecraft: 'Minecraft', fivem: 'FiveM', rust: 'Rust', source: 'Source', generic: 'Game server' };
    return { game, label: labels[game], image: override?.image || `/branding/diamondcrew/games/${game}.svg` };
}
