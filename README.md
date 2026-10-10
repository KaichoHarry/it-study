# it-study

IT 関連の学習内容や、LT（ライトニングトーク）などの発表資料をまとめるリポジトリです。

資料は Markdown で作成し、GitHub Pages（github.io）でスライドとして公開します。

## 公開ページ

https://kaichoharry.github.io/it-study/

`main` ブランチに push すると、GitHub Actions がスライドを HTML に変換して自動で公開します。

## ディレクトリ構成

```
it-study/
├── web/        # Web 関連
├── infra/      # インフラ関連
├── security/   # セキュリティ関連
├── scripts/    # ビルドスクリプト
└── marp.config.mjs
```

- ルート直下のフォルダがそのままカテゴリになります（フォルダを増やせば一覧ページにも自動で追加）
- Front Matter に `marp: true` がある `.md` だけがスライドとして変換されます
- 画像はスライドと同じフォルダ（例：`security/images/`）に置き、相対パスで参照します

## スライドの書き方

[Marp](https://marp.app/) 形式で書きます。使える機能の一覧は `security/test.md` を参照してください。

Mermaid の図は ` ```mermaid ` のコードブロックで書けます（公開ページ・ローカルビルドで描画されます）。

## ローカルでの確認

```bash
npm install
npm run build     # dist/ に HTML を出力
npm run preview   # http://localhost:8080 でプレビュー（Mermaid は描画されない）
```

VS Code の拡張機能「Marp for VS Code」でもプレビューできます（Mermaid は描画されません）。
