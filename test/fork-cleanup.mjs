// Self-hosted fork cleanup regression test.
// Run: node test/fork-cleanup.mjs
// Verifies that no analytics entry points or promotional links remain in
// sources or rebuilt bundles, while attribution and resource links stay.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
function check(desc, ok) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${desc}`);
    if (!ok) failures++;
}
function read(rel) {
    return readFileSync(join(root, rel), 'utf8');
}

for (const html of ['index.html', 'save.html', 'wiki.html']) {
    const content = read(html);
    check(`${html} has no googletagmanager script`, !content.includes('googletagmanager.com'));
    check(`${html} has no inline gtag/dataLayer bootstrap`, !content.includes('dataLayer') && !content.includes('gtag('));
}

for (const src of ['src/functions.js', 'src/vars.js', 'src/index.js']) {
    check(`${src} has no gtag call`, !read(src).includes('gtag('));
}

check('src/functions.js tagEvent is an explicit no-op', /export function tagEvent\(event, data\)\{\}/.test(read('src/functions.js')));

for (const bundle of ['evolve/main.js', 'wiki/wiki.js']) {
    const content = read(bundle);
    check(`${bundle} has no analytics references`, !content.includes('googletagmanager.com') && !content.includes('dataLayer'));
}

const indexSrc = read('src/index.js');
check('footer keeps Wiki link', indexSrc.includes('href="wiki.html"'));
check('footer keeps GitHub link', indexSrc.includes('https://github.com/pmotschmann/Evolve'));
check('footer keeps author credit', indexSrc.includes('Demagorddon'));
for (const promo of ['reddit.com/r/EvolveIdle', 'discord.gg/dcwdQEr', 'patreon.com/demagorddon', 'paypal.com/cgi-bin/webscr']) {
    check(`footer drops ${promo}`, !indexSrc.includes(promo));
}

if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
}
console.log('fork cleanup checks passed');
