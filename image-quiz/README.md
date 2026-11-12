# LUMEN · 组胚看图填空 v3 · 视觉质量复审

从用户提供的《组胚看图填空_修订版.html》保留 364 张原图并统一为 WebP，数据与页面分离，接入 LUMEN 设计体系。

## 当前结果

- **364 道题 / 364 张 WebP** 全部保留，原始题号稳定。
- **305 道**可参与自动练习及模拟考试（原 316 题中新增 11 道图片疑义暂停）。
- **43 道**原图多标注目标尚待确认，另有 **11 道**视觉裁切/目标不明新暂停题；**6 道**补充范围题（有 1 道重叠），仅在题库中查阅，不自动判分。
- **Q0044** 替换为同题库 Q0045 更完整的肾上腺低倍图，原 Q0044.webp 仍保留。
- **8 题**提供可开关的高对比目标定位环，原图 WebP 像素不改动。
- **Q0318** 从「卵原细胞」修订为「初级卵母细胞」，原来的错误名称不再作为正确答案。
- 题干改为非泄题的分类型指令；支持严格中英文同义判分、错题强化、图片缩放、结果记录和导出。
- 使用用户声明已许可公开托管的源图片；原页面署名「25CM3小林」保留。

## 本地打开

解压后保持目录完整，推荐从根目录启动普通静态服务器：

```bash
python -m http.server 4173
```

访问 http://127.0.0.1:4173/ 。也可尝试直接双击 `index.html`，具体受本机浏览器文件安全规则影响。 **不要将解压后的某一张图片单独移动到其他文件夹，否则 WebP 相对路径将失效。**

## 文件说明

- `index.html`、`style.css`、`app.js`：模块独立工作页。
- `data/bank.json`：完整题库及 `scope`、`scopeReason`、`prompt`、`autoEligible`、`reviewReason`。
- `data/bank.js`：可离线直接加载的同一份数据。
- `data/questions.csv`：全量题库表格。
- `images/Q0001.webp` 至 `Q0364.webp`：源 JPEG 原像素尺寸转换的 WebP。
- `qa/scope_decisions.csv`、`qa/question_audit.csv`：考纲决策与题目审核追踪。
- `qa/COURSE_SCOPE_REVIEW_V2.md`：修改依据、测试边界和已知问题。
- `qa/browser-visual-v3/ 和 qa/browser-evidence-v2/`：Chromium 真实 DOM 交互测试截图与 results.json。
- `tools/revise_bank_v2.py`：从首次拆解的 JSON 可重放的结构化修订。

## 测试

```bash
node qa/validate_project.mjs
node qa/runtime_smoke.mjs
python qa/validate_images.py
python qa/browser_inline_v2.py
# 另有 v3 的真实 Chromium 四档交互验收记录：qa/browser-visual-v3/results.json
```

`browser_inline_v2.py` 使用系统 Chromium 通过内联源码页面执行四屏宽的真实交互；这是为执行环境不允许访问 localhost 的条件设计的安全替代，不能代替在真实 GitHub Pages URL 上复测资源 404 和导航路径。

## LUMEN 集成

可将整个目录放到仓库 `image-quiz/`；新模块使用 `lumen_image_lab_progress_v1` 本机键，不覆盖主站 `lumen_histology_recall_v1`。详情见 `INTEGRATION.md`。

**发布说明：公开托管许可由用户确认；上线仍需完成 GitHub 端的路径/资源/移动端复测。**
## PR #5 可靠性修订

- 练习中的未提交答案会随轮次记录暂存；刷新后通过「继续上次练习」恢复原题及输入。
- 提交后键盘焦点移向「下一题」，支持连续按 Enter；图片预览 Esc 关闭时清理资源与交互状态。
- 320px / 390px 手机端练习中隐藏固定全局导航，避免遮住提交与下一题操作；练习顶部返回按钮保留，回到设置页后恢复导航。
- 切换可见定位环不会意外清除放大倍数；关闭预览后练习页同步展示状态。
- 备份导入先进行结构、题号、数据量与会话校验；只有确认且浏览器写入成功才替换本机记录，异常文件不覆盖原数据。
- 导出的 CSV 中疑似电子表格公式的单元格自动转义，防止作为公式执行。
- 浏览器拒绝存储时显示持久警示，明确当前进度可能在刷新后丢失。
- 开启新的轮次替换未完成练习前会提示风险；未完成的模拟考试不计成绩。
- 发布验收和未解决的医学图像目标问题参见 `qa/PR5_RELEASE_GATE.md`。
