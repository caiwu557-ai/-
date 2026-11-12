# LUMEN 单词记忆衔接 · v2

目标仓库 `caiwu557-ai/-`，现有功能 `index.html`（术语记忆）、`atlas/`（组织图谱）。

1. 非破坏性将本包应用目录中的 `index.html`、`style.css`、`app.js`、`data/`、`images/` 放到仓库新建 `image-quiz/` 目录。
2. 主站全局导航增加「看图填空」链接至 `./image-quiz/`；保留主站 `?view=library`、`?view=review` 深链接。
3. 保留独立进度键 `lumen_image_lab_progress_v1`，不触碰术语 SRS `lumen_histology_recall_v1`。主题与图谱共用 `lumen_atlas_theme_v1`。
4. 本模块可复制当前术语并在新标签进入主站词库，**尚未实现跨模块相同题目的 SRS 进度自动合并**；避免把「认图」自动视为「会拼词」。
5. GitHub Pages 公开发布需要依赖用户声明获许可的 364 张 WebP；保留原页署名「25CM3小林」。
6. 上线验收：在真实 Pages 域名复测 JPG→WebP 路径、主站/图谱互跳、移动端导航、答题及本机导入导出、图片放大与 reduced-motion；这一步不同于 `qa/browser_inline_v2.py` 已通过的本机 Chromium DOM 测试。

发布前请独立检查 PR 与公共仓库内容；本包未执行合并或推送。

## v3 视觉质量门禁
- 自动抽题仅 305 题；43 道原多标注目标待核验 + 11 道新增视觉审核暂停，另有 6 道补充范围题（其中有重叠）。
- Q0044 改用更完整的 Q0045 低倍图，原始 Q0044.webp 不删除。
- 8 道题使用无答案文字的 SVG 聚焦标记，可在练习与放大查看中切换显示。
- 详细依据在 `qa/VISUAL_TARGET_AUDIT_V3.md`。