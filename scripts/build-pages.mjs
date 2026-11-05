import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'docs');
const localCatalog = join(root, 'data/catalog.json');
let catalog;
try {
  catalog = JSON.parse(await readFile(localCatalog, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  catalog = JSON.parse(await readFile(join(root, 'data/catalog.example.json'), 'utf8'));
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, 'public/assets'), join(output, 'assets'), { recursive: true });
await rm(join(output, 'assets/js/admin.js'));
await cp(join(root, 'scripts/admin-preview.js'), join(output, 'assets/js/admin-preview.js'));

const published = structuredClone(catalog);
published.editions = published.editions.filter(edition => edition.published);
for (const edition of published.editions) {
  const asset = async value => {
    if (typeof value !== 'string' || !value) return value;
    if (value.startsWith('/assets/')) return `.${value}`;
    if (!/^\/media\/[a-f0-9-]+\.(?:png|jpg|webp)$/.test(value)) return value;
    const file = value.slice('/media/'.length);
    await mkdir(join(output, 'media'), { recursive: true });
    await cp(join(root, 'uploads', file), join(output, 'media', file));
    return `.${value}`;
  };
  edition.images = await Promise.all(edition.images.map(asset));
  edition.artImage = await asset(edition.artImage);
}
await writeFile(join(output, 'catalog.json'), JSON.stringify(published, null, 2) + '\n');
await writeFile(join(output, 'assets/js/config.js'), "export const API = Object.freeze({ catalog: new URL('../../catalog.json', import.meta.url).href });\n");

let html = await readFile(join(root, 'public/index.html'), 'utf8');
html = html.replaceAll('href="/assets/', 'href="./assets/')
  .replaceAll('src="/assets/', 'src="./assets/')
  .replaceAll('href="/"', 'href="./"')
  .replaceAll('href="/admin/"', 'href="./admin/"');
await writeFile(join(output, 'index.html'), html);
await mkdir(join(output, 'admin'));
let adminHtml = await readFile(join(root, 'public/admin/index.html'), 'utf8');
adminHtml = adminHtml.replaceAll('href="/assets/', 'href="../assets/')
  .replaceAll('href="/admin/"', 'href="./"')
  .replaceAll('href="/"', 'href="../"')
  .replace('src="/assets/js/admin.js"', 'src="../assets/js/admin-preview.js"')
  .replace('관리자만 자료를 수정할 수 있어요.', 'GitHub Pages에서는 화면만 검수할 수 있어요.')
  .replace('저장 후 사용자 화면을 새로고침하면 변경 내용을 볼 수 있어요.', '로컬에서 수정한 뒤 GitHub Pages 검수본을 갱신해주세요.');
await writeFile(join(output, 'admin/index.html'), adminHtml);
await writeFile(join(output, '.nojekyll'), '');
console.log(`GitHub Pages files ready: ${output}`);
