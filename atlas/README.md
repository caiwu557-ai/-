# LUMEN · 组织切片图谱 (Histology Atlas)

LUMEN 的切片识别学习模块，入口为 `/atlas/`，沿用站点的深浅主题与导航；术语训练和复习数据保持独立。

## 页面与数据

- `index.html`、`atlas.css`、`atlas.js`：站内图谱页面、交互及主题样式
- `data/manual.json`：基础组织与器官系统的阅读内容、45组易混辨析及原对话图像链接
- `data/image-map.json`：组织／器官范围与图像的映射
- `data/term-image-links.json`：阅读节点和术语的图像关联
- `data/credits.json`：每张图片的可见来源名称、来源链接及原始引用信息
- `images/*.webp`：本地显微图像

图片来源在图卡与放大预览中逐项展示。Michigan SecondLook 图片署名链接至其[官方页面](https://secondlook.med.umich.edu/histology)；外部图及聊天原图保留各自原始来源链接。

## 数据校验

在仓库根目录运行：

```bash
node qa/validate-atlas.mjs
```

本站为静态资源，直接打开 `/atlas/` 页面需通过 HTTP(S) 服务以读取独立 JSON 文件。
