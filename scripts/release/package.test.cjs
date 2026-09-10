const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { validatePath, sensitiveContent, regularFile, validateContents, context, pack } = require('./package.cjs');
const temporary = () => fs.mkdtempSync(path.join(os.tmpdir(), 'diamondcrew-release-test-'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

test('rejects secrets, dependency, cache, archive and traversal paths', () => {
    for (const file of ['.env', '.env.example', 'resources/.env.production', 'vendor/a.php', 'node_modules/a.js',
        'storage/logs/a.log', 'resources/cache/a.php', '.git/config', 'public/assets/../../.env',
        'public/assets/secret.pem', 'docs/diamondcrew-backup.tar.gz', '/tmp/file', 'C:\\file',
        '-option', 'resources/a\n.env', 'resources//a', 'resources/./a', 'app/Models/User.php']) {
        assert.throws(() => validatePath(file), undefined, file);
    }
});

test('accepts actual frontend package paths and metadata', () => {
    for (const file of ['diamondcrew-build.json', 'public/assets/bundle.12345678.js',
        'resources/views/layouts/admin.blade.php', 'public/branding/diamondcrew/diamond-logo.png',
        'docs/diamondcrew-upstream.patch', 'scripts/diamondcrew-theme.cjs']) assert.doesNotThrow(() => validatePath(file));
});

test('requires a safe v-prefixed release tag', () => {
    assert.equal(context('.', os.tmpdir(), 'v1.2.3-rc.1').tag, 'v1.2.3-rc.1');
    for (const tag of ['', 'main', 'v../../x', 'v1;echo', 'v1\nother']) assert.throws(() => context('.', os.tmpdir(), tag));
});

test('detects populated application keys, panel tokens and private keys', () => {
    assert(sensitiveContent('APP_KEY=base64:' + 'x'.repeat(43) + '='));
    assert(sensitiveContent('ptla_' + 'a'.repeat(32)));
    assert(sensitiveContent('-----BEGIN ' + 'OPENSSH PRIVATE KEY-----'));
    assert(!sensitiveContent('APP_KEY=\n'));
    assert(!sensitiveContent("env('APP_KEY')"));
});

test('validates content hashes and rejects an extra file added after scanning', () => {
    const root = temporary();
    const body = JSON.stringify({ product: 'DiamondCrew Server Manager', basedOn: 'Pterodactyl 1.15.1', version: 'v1.0.0' });
    fs.writeFileSync(path.join(root, 'diamondcrew-build.json'), body);
    const expected = { 'diamondcrew-build.json': hash(body) };
    assert.doesNotThrow(() => validateContents(root, expected));
    fs.writeFileSync(path.join(root, '.env'), 'not-for-release');
    assert.throws(() => validateContents(root, expected), /file list changed/);
});

test('rejects files changed after their hashes were recorded', () => {
    const root = temporary();
    fs.writeFileSync(path.join(root, 'diamondcrew-build.json'), 'modified');
    assert.throws(() => validateContents(root, { 'diamondcrew-build.json': hash('original') }), /content changed/);
});

test('rejects a symlinked parent directory', () => {
    const root = temporary(), outside = temporary();
    fs.writeFileSync(path.join(outside, 'test.txt'), 'fixture');
    fs.symlinkSync(outside, path.join(root, 'resources'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => regularFile(root, 'resources/test.txt'), /Symlink/);
});

test('refuses to pack when a scan contains findings', () => {
    const root = temporary(), ctx = context('.', root, 'v1.0.0');
    fs.mkdirSync(ctx.work);
    fs.writeFileSync(ctx.state, JSON.stringify({ metadata: { version: 'v1.0.0' }, files: {} }));
    fs.writeFileSync(path.join(root, 'history-scan.json'), JSON.stringify([{ Description: 'test finding' }]));
    assert.throws(() => pack(ctx), /Secret scan is not clean/);
});
