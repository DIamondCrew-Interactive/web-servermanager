import { serverArtwork, serverArtworkOverrides } from './serverArtwork';

const server = { uuid: 'test', name: 'My server', dockerImage: '', invocation: '', eggFeatures: [] };
it('recognizes game runtime hints and safely falls back for an unknown game', () => {
    expect(serverArtwork({ ...server, invocation: './FXServer +exec server.cfg' }).game).toBe('fivem');
    expect(serverArtwork({ ...server, invocation: 'java -jar paper.jar' }).game).toBe('minecraft');
    expect(serverArtwork({ ...server, dockerImage: 'games/rust' }).game).toBe('rust');
    expect(serverArtwork(server).game).toBe('generic');
});
it('lets an explicit UUID override win over ambiguous names', () => {
    serverArtworkOverrides.test = { game: 'minecraft', image: '/branding/diamondcrew/games/custom.png' };
    try {
        expect(serverArtwork({ ...server, name: 'FiveM' }).image).toBe('/branding/diamondcrew/games/custom.png');
        expect(serverArtwork(server).game).toBe('minecraft');
    } finally {
        delete serverArtworkOverrides.test;
    }
});
