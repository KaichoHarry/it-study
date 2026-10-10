// Marp CLI の設定ファイル
// ```mermaid のコードブロックを <pre class="mermaid"> に変換し、
// ブラウザ側の Mermaid（scripts/build.mjs で HTML に差し込む）で図として描画できるようにする。

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const mermaidPlugin = (md) => {
  const defaultFence = md.renderer.rules.fence
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (token.info.trim() === 'mermaid') {
      return `<pre class="mermaid">${escapeHtml(token.content)}</pre>\n`
    }
    return defaultFence(tokens, idx, options, env, self)
  }
}

export default {
  // スライド内で HTML タグ（<div> など）を使えるようにする
  html: true,
  engine: ({ marp }) => marp.use(mermaidPlugin),
}
