# PR #5 · LUMEN 看图填空发布门禁

范围：`caiwu557-ai/-` → `feat/lumen-image-quiz-v3-mainline-integration` → `main`。

## 自动验收（必须全绿）

- `node qa/validate-terminology.mjs` / `validate-learning-flow.mjs` / `validate-round-prompt.mjs`：主站词汇与轮次回归。
- `node qa/validate-atlas.mjs` / `validate-unified-workspace.mjs`：图谱、来源链接和导航。
- `node image-quiz/qa/validate_project.mjs` / `runtime_smoke.mjs`：364 个题号与 WebP、305 自动可用、医学别名及答题状态、备份校验和防公式注入。
- `node qa/browser-lumen.mjs` / `validate-recall-resume.mjs` / `browser-image-quiz.mjs`：真实 Chromium，跨模块跳转、320–1440px 布局、手机端答题专注态（固定导航不遮挡主操作）、未提交输入在刷新后恢复、键盘连续答题、定位环缩放、Escape 关闭、备份损坏拒绝、浏览器存储失败告警。
- 工作流：`.github/workflows/lumen-browser-qa.yml`。验收须以**当前 PR HEAD** 对应的最新 run 为准，不能沿用早期通过的 CI。

## 保留的数据与医学边界

- 完整题库：364 题、364 张 WebP，Q0001–Q0364 不重编号。
- 自动练习与考试：305 题。43 道原多目标存疑、11 道新增视觉暂停、6 道补充范围（有 1 道重叠）；不可自动判分共 59 道，仍可浏览原图。
- Q0044 练习使用 Q0045 的完整低倍图，原 Q0044.webp 仍保留；8 道题的定位环可关闭。
- Q0318 使用初级卵母细胞（primary oocyte），不接受旧错误答案“卵原细胞”。
- 以上属于保守筛查，并非全部 364 张图已经过医学专家逐张核定。存疑清单见 `VISUAL_TARGET_AUDIT_V3.md`。
- 图片使用的是用户声明已获公开托管许可的来源文件，保留“25CM3小林”署名；没有逐件核对授权合同。

## 合并前必须完成

1. 确认当前 PR HEAD 对应的 CI 完整通过，审查截图与失败日志。
2. 仔细确认主站恢复训练功能（PR #4）和现有学习记录没有被旧分支代码覆盖。
3. 明确接受公开发布 364 张 WebP 的风险；未经用户明确确认不得合并至 `main` 或发布 Pages。
4. 逐一抽检恢复练习、图片目标、补充范围题筛选以及 320px / 390px 真实交互。

## 合并后必须在正式 Pages 域名验收

- `/`、`/atlas/`、`/image-quiz/` 均 HTTP 200；各端导航与深链接可互通。
- `/image-quiz/data/bank.js`、`/image-quiz/images/Q0001.webp`、`/image-quiz/images/Q0364.webp` 返回正确内容与 MIME 类型，不出现 404。
- 图片真实解码，放大、定位环、考试延迟反馈、本机备份的导入导出可正常工作。
- 主站 SRS 键 `lumen_histology_recall_v1` 不被识图模块覆盖；识图键独立为 `lumen_image_lab_progress_v1`。
- 刷新、手机窄屏、弱网络、暗色模式及有无本机存储权限均须有合理反馈。

## 仍有意识保留的限制

- **59 道未判定图** 暂不自动出题，后续取得更高质量原图或医学人工复核才恢复；不为了凑题量盲目开放。
- 两个模块仅互相引导，没有把“认图正确”自动折算成“会拼写医学英文”。
- 练习记录保存在当前浏览器，不提供跨设备同步；用户应定期导出备份。
- GitHub Pages 回滚可以撤销新代码，但已访问或缓存的公开图片无法保证被收回。
