# GitHub Pages 公開手順

1. Repository Settings → Pages → Build and deployment → Source を **GitHub Actions** にする。
2. Repository の Code 画面で **Add file → Upload files** を選び、`site.tar.xz` を repository root にアップロードして main に commit する。
3. `.github/workflows/pages.yml` が自動で `site.tar.xz` を展開し、GitHub Pages にデプロイする。
4. 公開先は通常 `https://shokobeeee.github.io/linux-kiban-lab/`。

更新時は新しい `site.tar.xz` で既存ファイルを置き換えて commit すれば再デプロイされる。
