# LUMEN · Histology Recall Lab (v2.0)

An offline-first Chinese/English histology terminology study web app. 1,269 deduplicated terminology entries. Multiple-choice exercises, letter-by-letter English spelling, chapter filtering, local SRS practice and exportable progress.

## Open
- Open `index.html` directly in Chrome/Edge/Safari. The entire app and word data are embedded in this file.
- When GitHub Pages is explicitly enabled for this repository, `index.html` is the static site entrypoint.
- No API keys, analytics, external fonts, external images or CDN requests are required for the app.
- Progress is saved to the browser's **localStorage**; it is not synced across devices.

## Editable source
`source-project/LUMEN_Histology_Recall_v2/src/` contains source code and course vocabulary mapping. For rebuild steps consult `source-project/LUMEN_Histology_Recall_v2/README.md`.

## Source traceability
This study app includes terminology derived from the user's R10 histology source material and 14 chapter glossary files. Its study scope is not teacher-certified.

## Important privacy / publishing warning
The repository is presently **private**. GitHub Pages may make the published site publicly accessible even from a private repository, depending on account/org configuration. Do not enable Pages until you accept that others may be able to access the terminology and bundled application data.

## Deploy via GitHub Pages (after owner approval)
1. Upload/push these files to the specified repository `caiwu557-ai/-` on `main`.
2. In repository **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save (if supported by the repository).
3. Check GitHub's reported published URL and whether it is publicly accessible. Do not assume a URL until Pages confirms deployment.

No changes to repository visibility or access rules are made automatically by this package.
