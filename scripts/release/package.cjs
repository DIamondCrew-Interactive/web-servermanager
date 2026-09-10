const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ARCHIVE = 'diamondcrew-server-manager-1.15.1.tar.gz';
const PRODUCT = 'DiamondCrew Server Manager';
const BASED_ON = 'Pterodactyl 1.15.1';
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const hashFile = file => sha(fs.readFileSync(file));
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
    return result.stdout.trim();
}
function validatePath(file) {
    if (typeof file !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(file) || path.posix.isAbsolute(file) || file.startsWith('-')) {
        throw new Error(`Invalid release path: ${file}`);
    }
    const parts = file.split('/');
    if (parts.some(p => !p || p === '.' || p === '..' || p.startsWith('.env') ||
        ['.git', '.cache', 'cache', 'vendor', 'node_modules', 'storage', '.diamondcrew-backup'].includes(p))) {
        throw new Error(`Forbidden release path: ${file}`);
    }
    if (/\.(?:log|zip|tar|gz|tgz|rar|7z|bak|sql|pem|key)$/i.test(file)) throw new Error(`Forbidden release file: ${file}`);
    const allowed = file === 'package.json' || file === 'tailwind.config.js' || file === 'diamondcrew-build.json' ||
        file === 'scripts/diamondcrew-theme.cjs' || file.startsWith('resources/') || file.startsWith('docs/diamondcrew-') ||
        file.startsWith('public/branding/diamondcrew/') || file.startsWith('public/assets/');
    if (!allowed) throw new Error(`Not a deployment file: ${file}`);
}
function sensitiveContent(text) {
    return /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|\b(?:ptla|ptlc|ptdl)_[A-Za-z0-9]{16,}|\bAPP_KEY\s*=\s*['"]?base64:[A-Za-z0-9+/=]{20,}/.test(text);
}
function regularFile(root, file) {
    let current = root;
    for (const part of file.split('/')) {
        current = path.join(current, part);
        if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink in release path: ${file}`);
    }
    if (!fs.lstatSync(current).isFile()) throw new Error(`Not a regular file: ${file}`);
    return current;
}
function fileList(root, prefix = '') {
    return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
        const name = prefix + entry.name;
        if (entry.isSymbolicLink()) throw new Error(`Symlink in release: ${name}`);
        return entry.isDirectory() ? fileList(root, name + '/') : [name];
    }).sort();
}
function validateContents(root, expected) {
    const files = fileList(root);
    if (JSON.stringify(files) !== JSON.stringify(Object.keys(expected).sort())) throw new Error('Release file list changed');
    for (const file of files) {
        validatePath(file);
        const full = regularFile(root, file);
        if (hashFile(full) !== expected[file]) throw new Error(`Release content changed: ${file}`);
        if (sensitiveContent(fs.readFileSync(full, 'utf8'))) throw new Error(`Sensitive release content: ${file}`);
    }
}
function context(source = process.cwd(), temporary = process.env.RUNNER_TEMP, tag = process.env.RELEASE_TAG) {
    if (!temporary) throw new Error('RUNNER_TEMP is required');
    if (!tag || !/^v[A-Za-z0-9][A-Za-z0-9._-]*$/.test(tag)) throw new Error('Invalid or missing v* release tag');
    const work = path.join(path.resolve(temporary), 'diamondcrew-release');
    return { source: path.resolve(source), temporary: path.resolve(temporary), tag, work,
        stage: path.join(work, 'stage'), output: path.join(work, 'output'), state: path.join(work, 'state.json') };
}
function audit(ctx) {
    const git = args => run('git', args, ctx.source);
    const commit = git(['rev-parse', 'HEAD']);
    if (git(['rev-parse', `refs/tags/${ctx.tag}^{commit}`]) !== commit) throw new Error('HEAD is not the release tag');
    if (!/'version'\s*=>\s*'1\.15\.1'/.test(fs.readFileSync(path.join(ctx.source, 'config/app.php'), 'utf8'))) {
        throw new Error('Only the reviewed Pterodactyl 1.15.1 packaging is supported');
    }
    for (const revision of git(['rev-list', 'HEAD']).split('\n')) {
        const files = git(['ls-tree', '-r', '--name-only', revision]).split('\n');
        for (const file of files) {
            if ((/(^|\/)\.env(?:\.|$)/.test(file) && file !== '.env.example') ||
                /^(?:vendor|node_modules|\.diamondcrew-backup)\/|^storage\/.*\.log$|^bootstrap\/cache\/.*\.php$/.test(file)) {
                throw new Error(`Forbidden tracked history file: ${file}`);
            }
            if (/\.(?:zip|tar|gz|tgz|rar|7z|bak|sql)$/i.test(file)) {
                const reviewed = {
                    'public/favicons/df4b367461890fa5fd0d9339d3c3f9c6.ico.zip': 'fa41e2fa3649644c3ab52c730860b6eeb827e0d940fe862bfa983b8ed202131e',
                    'database/schema/mysql-schema.sql': '68140ae9f8cb94ed334b5efdc6fdcd15fea6d683e0e8885be659ac6685cabd24',
                };
                const blob = spawnSync('git', ['show', `${revision}:${file}`], { cwd: ctx.source, maxBuffer: 20 * 1024 * 1024 });
                if (blob.status !== 0 || sha(blob.stdout) !== reviewed[file]) throw new Error(`Unreviewed archive/schema: ${file}`);
            }
        }
        const example = git(['show', `${revision}:.env.example`]);
        if (/^(?:APP_KEY|DB_PASSWORD|MAIL_PASSWORD|AWS_SECRET_ACCESS_KEY)=.+$/m.test(example)) throw new Error('Credentials in environment example');
        const recaptcha = git(['show', `${revision}:config/recaptcha.php`]) + '\n';
        if (sha(recaptcha) !== '3fed769417a75c57e0bdb726e262e58070ddf35891d09cfa983fbeaf5a64d50d') throw new Error('Reviewed public defaults changed');
    }
    console.log('PASS: tag checkout, panel version, tracked history and reviewed public defaults.');
    return commit;
}
function stage(ctx) {
    const commit = audit(ctx);
    if (fs.existsSync(ctx.work)) throw new Error('Release workspace already exists; use a fresh temporary directory');
    const list = json(path.join(ctx.source, 'docs/diamondcrew-files.json'));
    const manifest = json(path.join(ctx.source, 'public/assets/manifest.json'));
    const assets = [...new Set(Object.values(manifest).map(entry => 'public' + entry.src))].sort();
    for (const file of assets) {
        validatePath(file);
        if (!file.startsWith('public/assets/')) throw new Error('Asset outside build directory');
        const entry = Object.values(manifest).find(value => 'public' + value.src === file);
        const integrity = 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(regularFile(ctx.source, file))).digest('base64');
        if ((entry.integrity && entry.integrity !== integrity) || (file.endsWith('.js') && !entry.integrity)) throw new Error(`Invalid SRI: ${file}`);
    }
    const files = [...new Set([...list.modified, ...list.added, 'public/assets/manifest.json', ...assets,
        'docs/diamondcrew-reskin.md', 'docs/diamondcrew-files.json', 'docs/diamondcrew-baseline.sha256', 'docs/diamondcrew-upstream.patch'])].sort();
    for (const file of files) {
        validatePath(file);
        const from = regularFile(ctx.source, file), to = path.join(ctx.stage, file);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
    }
    list.productionAssets = ['public/assets/manifest.json', ...assets];
    fs.writeFileSync(path.join(ctx.stage, 'docs/diamondcrew-files.json'), JSON.stringify(list, null, 2) + '\n');
    const metadata = { product: PRODUCT, basedOn: BASED_ON, version: ctx.tag, sourceCommit: commit };
    fs.writeFileSync(path.join(ctx.stage, 'diamondcrew-build.json'), JSON.stringify(metadata, null, 2) + '\n');
    files.push('diamondcrew-build.json');
    const hashes = Object.fromEntries(files.sort().map(file => [file, hashFile(path.join(ctx.stage, file))]));
    validateContents(ctx.stage, hashes);
    fs.writeFileSync(ctx.state, JSON.stringify({ metadata, files: hashes }, null, 2));
    console.log(`PASS: staged ${files.length} allowlisted files, build metadata and SRI.`);
}
function pack(ctx) {
    const state = json(ctx.state);
    if (state.metadata.version !== ctx.tag) throw new Error('Staged tag differs from requested tag');
    for (const name of ['history-scan.json', 'asset-scan.json']) {
        const report = json(path.join(ctx.temporary, name));
        if (!Array.isArray(report) || report.length !== 0) throw new Error(`Secret scan is not clean: ${name}`);
    }
    validateContents(ctx.stage, state.files);
    fs.mkdirSync(ctx.output, { recursive: false });
    const archive = path.join(ctx.output, ARCHIVE);
    const names = Object.keys(state.files).sort();
    const listFile = path.join(ctx.work, 'files.txt');
    fs.writeFileSync(listFile, names.join('\n') + '\n');
    run('tar', ['-czf', archive, '-C', ctx.stage, '-T', listFile]);
    const archiveFiles = run('tar', ['-tzf', archive]).split(/\r?\n/).sort();
    if (JSON.stringify(archiveFiles) !== JSON.stringify(names)) throw new Error('Archive file list differs from staged files');
    if (run('tar', ['-tvzf', archive]).split(/\r?\n/).some(line => !line.startsWith('-'))) throw new Error('Non-regular archive entry');
    const extracted = path.join(ctx.work, 'verified');
    fs.mkdirSync(extracted);
    run('tar', ['-xzf', archive, '-C', extracted]);
    validateContents(extracted, state.files);
    const hash = hashFile(archive);
    fs.writeFileSync(archive + '.sha256', `${hash}  ${ARCHIVE}\n`);
    const report = { ...state.metadata, asset: ARCHIVE, bytes: fs.statSync(archive).size, sha256: hash,
        secretScan: 'clean', contentValidation: 'passed', scanner: 'Gitleaks 8.30.1', reviewedPublicDefaults: 4, files: names.length };
    fs.writeFileSync(path.join(ctx.output, 'release-verification.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
}
module.exports = { validatePath, sensitiveContent, regularFile, validateContents, context, audit, stage, pack };
if (require.main === module) {
    try {
        const action = { audit, stage, pack }[process.argv[2]];
        if (!action) throw new Error('Expected audit, stage or pack');
        action(context());
    } catch (error) { console.error(error.message); process.exitCode = 1; }
}
