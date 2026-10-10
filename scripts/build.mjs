// ルート直下の各カテゴリ（web / infra / security など）にある Marp スライドを
// dist/ に HTML として書き出し、一覧ページ（dist/index.html）を生成する。
//
// - Front Matter に `marp: true` がある .md だけをスライドとして扱う
// - 画像などの .md 以外のファイルは同じパスで dist/ にコピーする
// - カテゴリのディレクトリを増やしても、このスクリプトの変更は不要

import fs from 'node:fs'
import path from 'node:path'
import { marpCli } from '@marp-team/marp-cli'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'scripts'])

const MERMAID_SCRIPT = `
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
  mermaid.initialize({ startOnLoad: false, theme: 'default' })
  // スライドは縮小表示されるため、図は body 直下で描画してから差し込む
  const blocks = document.querySelectorAll('pre.mermaid')
  for (const [i, el] of blocks.entries()) {
    try {
      const { svg } = await mermaid.render('mermaid-' + i, el.textContent)
      el.outerHTML = '<div class="mermaid-diagram">' + svg + '</div>'
    } catch (e) {
      // 文法エラー時はソースを残したまま、エラー内容をコンソールに出す
      console.error('Mermaid の描画に失敗しました:', e)
    }
  }
</script>
`

const categories = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !EXCLUDE_DIRS.has(d.name))
  .map((d) => d.name)
  .sort()

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (d.name.startsWith('.')) return []
    const p = path.join(dir, d.name)
    return d.isDirectory() ? walk(p) : [p]
  })

const frontMatter = (src) => src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
const isMarp = (src) => /^marp:\s*true\s*$/m.test(frontMatter(src))
const titleOf = (src, fallback) =>
  frontMatter(src).match(/^title:\s*(.+)$/m)?.[1].trim() ??
  src.match(/^#\s+(.+)$/m)?.[1].trim() ??
  fallback

fs.rmSync(DIST, { recursive: true, force: true })

const index = {}
for (const category of categories) {
  index[category] = []
  for (const file of walk(path.join(ROOT, category))) {
    const rel = path.relative(ROOT, file)
    const out = path.join(DIST, rel)
    fs.mkdirSync(path.dirname(out), { recursive: true })

    if (!file.endsWith('.md')) {
      fs.copyFileSync(file, out)
      continue
    }
    const src = fs.readFileSync(file, 'utf8')
    if (!isMarp(src)) continue

    const htmlPath = out.replace(/\.md$/, '.html')
    const code = await marpCli(['--config', path.join(ROOT, 'marp.config.mjs'), file, '-o', htmlPath])
    if (code !== 0) process.exit(code)

    if (src.includes('```mermaid')) {
      const html = fs.readFileSync(htmlPath, 'utf8')
      fs.writeFileSync(htmlPath, html.replace('</body>', `${MERMAID_SCRIPT}</body>`))
    }
    index[category].push({ title: titleOf(src, path.basename(file, '.md')), href: rel.replace(/\.md$/, '.html') })
  }
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sections = Object.entries(index)
  .map(([category, slides]) => {
    const items = slides.length
      ? slides.map((s) => `<li><a href="${s.href}">${escape(s.title)}</a></li>`).join('\n')
      : '<li class="empty">まだスライドはありません</li>'
    return `<section><h2>${escape(category)}</h2><ul>${items}</ul></section>`
  })
  .join('\n')

fs.mkdirSync(DIST, { recursive: true })
fs.writeFileSync(
  path.join(DIST, 'index.html'),
  `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>it-study</title>
<style>
  :root { --bg: #ffffff; --fg: #1f2328; --muted: #656d76; --link: #0969da; --line: #d0d7de; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0d1117; --fg: #e6edf3; --muted: #8d96a0; --link: #4493f8; --line: #30363d; }
  }
  body { margin: 0 auto; max-width: 720px; padding: 32px 16px; background: var(--bg); color: var(--fg);
         font-family: system-ui, -apple-system, "Hiragino Sans", sans-serif; line-height: 1.7; }
  h1 { margin-top: 0; }
  h2 { border-bottom: 1px solid var(--line); padding-bottom: 4px; text-transform: capitalize; }
  a { color: var(--link); }
  .empty { color: var(--muted); }
</style>
</head>
<body>
<h1>it-study</h1>
<p>IT 学習・LT 発表スライド一覧</p>
${sections}
</body>
</html>
`,
)

console.log(`Built: ${Object.values(index).flat().length} slide(s) -> dist/`)
