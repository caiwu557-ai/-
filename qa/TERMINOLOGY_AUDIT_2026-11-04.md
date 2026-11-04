# LUMEN 组织学术语审校记录（2026-11-04）

> 分支：`audit/histology-terminology-2026-11-04`  
> 状态：第一轮 **数据库结构全量扫描 + 高风险术语定点核对 + 确认错误修正**。**不是** 1,283 个词条逐一获得权威认证。

## 1. 审核范围与方法

- 源文件：仓库根目录 `index.html` 的 `window.LUMEN_DATA.cards`，共 **1,269** 条基础数据；页面运行时另加入 `EXAM_EXTRA_CARDS` 的 **14** 条，故运行时共有 **1,283** 条卡片。
- 已扫描字段：`id`, `en`, `cn`, `courseIds`, `cnByCourse`, `sourceCnByCourse`, `aliases`, `origin`, `sourceIds`, `spellingEligible` 等。核对了双语指称、英文主术语、重名/别名及课程语境。
- 采取“标准名称 / 概念层级 / 具体语境”三级判断，特别排除“上位词当精确别名”和“不相干学科的同形异义”。
- 完整保留原 `id` 及 `sourceCnByCourse` 原始值，保持课堂原文的可追溯性和浏览器学习进度。对外展示用 `cn` 及 `cnByCourse` 是校正后的学习释义。
- 考试高优先范围 `EXAM_FOCUS_ENTRIES` 和“Classwork 排除”规则未调整。

## 2. 已修订的 19 个术语

| 原英文 | 原中文 | 修订后的英文 | 修订后的中文 | 说明 |
|---|---|---|---|---|
| renal capsule | 肾小囊 | renal capsule | 肾被膜 | 肾的纤维被膜 ≠ Bowman's capsule 肾小囊 |
| proximal straight tubule | 近直精小管 | 同原文 | 近端直小管 | 肾单位结构误写成精小管 |
| distal straight tubule | 远直精小管 | 同原文 | 远端直小管 | 同上 |
| varicosity | 静脉曲张 | 同原文 | 轴突膨体（神经纤维串珠状膨大） | 神经组织中的轴突 varicosity ≠ 静脉曲张 |
| dendrite spine | 树突棘 | dendritic spine | 树突棘 | 标准搭配使用形容词 dendritic |
| embryotic hematopoiesis | 胚胎造血 | embryonic hematopoiesis | 胚胎造血 | embryonic 是学术通用词形 |
| diad | 二联体 | dyad | 二联体 | 心肌二联体标准拼法 |
| cellulitis-anatomy | 蜂窝织炎 | cellulitis | 蜂窝织炎 | 删除自造的非医学术语后缀 |
| parietal | 顶骨的 | 同原文 | 壁侧的（上皮／浆膜语境） | 该章节重在 parietal vs visceral，不能以“顶骨的”作为默认释义 |
| serous | 浆膜的 | 同原文 | 浆液性的（腺体分泌语境） | 腺泡/浆液性分泌语境；其他解剖语境可指浆膜 |
| molecular | 分子层 | 同原文 | 分子的 | molecular 是形容词，molecular layer 才是“分子层” |
| axis | 枢椎 | 同原文 | 轴；轴线（具体结构需结合上下文） | 女性生殖系统语境不应默认解释成 C2 枢椎 |
| radial | 桡侧的 | 同原文 | 放射状的（女性生殖系统语境） | 该语境与上肢桡侧定位不同；仍需核对讲义原句 |
| primary | 第一的 | 同原文 | 初级的 | primary follicle / primary lymphoid follicle 等语境 |
| secondary | 第二的 | 同原文 | 次级的 | secondary follicle 等语境 |
| ciliary | 睫状的 | 同原文 | 纤毛的（呼吸上皮语境） | 眼部睫状体与呼吸道上皮纤毛不可混译 |
| index | 示指 | index finger | 示指 | 用完整解剖学名称避免泛化为“索引” |
| typeⅠalveolar cell | Ⅰ型肺泡细胞 | type I alveolar cell | Ⅰ型肺泡细胞 | 英文规范空格 + 罗马数字字母 |
| typeⅡalveolar cell | Ⅱ型肺泡细胞 | type II alveolar cell | Ⅱ型肺泡细胞 | 同上 |

## 3. 已删除的不精确别名

**18 条词目、21 个别名**；仅影响“认可拼写”，未删除任何卡片：

| 主术语 | 删除的别名 | 原因 |
|---|---|---|
| Simple squamous epithelium | Endothelium | 内皮是特殊位置的单层扁平上皮，并非任意单层扁平上皮 |
| Collecting tubule | Collecting duct | 在肾单位分段教学中需区分集合小管与集合管 |
| Myelinated nerve fascicle | Nerve fascicle | 神经束不一定均为“有髓” |
| Intercalated duct | Intralobular duct | 闰管只是小叶内导管的部分类型 |
| Palatine tonsil | Tonsil | 腭扁桃体只是扁桃体的一种 |
| Meibomian gland | Sebaceous gland | 睑板腺是特殊皮脂腺，不能相互完整替代 |
| Intrapulmonary bronchus | Bronchus, Small bronchus | 肺内支气管不等同于所有支气管/所有细小支气管 |
| Colon | Large intestine | 结肠 ≠ 整个大肠（包含盲肠、直肠等） |
| Early placenta | Placenta | 缺失时间范围限定 |
| Pseudostratified ciliated columnar epithelium | Pseudostratified epithelium | 遗漏“纤毛”与“柱状”限定 |
| Elastic fibers | Elastic lamellae | 弹性纤维与弹性板为不同形态 |
| Serous demilune cell | Serous demilune | 细胞与细胞群形成的结构不同 |
| Peyer's patches | Aggregated lymphoid nodules | 不能将所有集合淋巴小结都泛化为回肠 Peyer 斑 |
| Atrium | atrial myocardium, atrial wall | 心房整体 ≠ 心房心肌或房壁 |
| Ventricle | ventricular myocardium, ventricular wall | 心室整体 ≠ 心室心肌或室壁 |
| Early spermatid | spermatid | 缺失“早期”限定 |
| Mucosa-associated lymphoid nodule | Lymphoid nodule | 遗漏黏膜相关的位置限定 |
| Trabecula of lymph node | Trabecula | 淋巴结小梁 ≠ 任意器官小梁 |

## 4. 暂不自动判定的疑似词条

以下属于**需要学科语境或原始讲义核实**，未在本轮擅自删词：

- `zone of reserving cartilage`（软骨储备区）：正文是否应统一为 `zone of resting cartilage` / `resting zone`，需看课程原文；课件考试范围另含 `Zone of resting` 别名。
- `interstitial Cajal cell`：专业文章更常写 `interstitial cell of Cajal`，但原词形具可理解性，暂不判成无效。
- `phagocytin`：确有历史学术文献使用，但属于旧术语，不适合仅凭历史文献就宣称为当代常用考试术语。
- `axis`、`radial`、`serous`、`parietal`、`molecular`：已纠正明显错位的默认释义，但仍需有完整上下文才能唯一锁定意义；不应做脱离语境的“唯一翻译”认证。
- `primary follicle` / `secondary follicle` 在卵巢组织学中有不同教材分期约定；不能脱离课程图片按一种分期强制替换。
- 大量 `cell`、`layer`、`central`、`surface` 等普通或学术通用词：英文词本身正确，但不是独立、特异的组织学切片诊断结构，不能直接判为“已通过专有术语认证”。

## 5. 证据来源（可人工核对）

1. [NCI: renal capsule](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-capsule)；[NLM MeSH: Bowman capsule](https://www.ncbi.nlm.nih.gov/mesh/68050476)。
2. [NCBI Bookshelf: Kidneys — proximal/distal straight tubules](https://www.ncbi.nlm.nih.gov/books/NBK482385/)。
3. [NLM MeSH: Dendritic Spines](https://www.ncbi.nlm.nih.gov/mesh/68049229)。
4. [Cardiac dyad architecture, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7429583/)。
5. [Autonomic nervous system axon varicosities, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1959222/)。
6. [NCBI Bookshelf: embryonic hematopoiesis](https://www.ncbi.nlm.nih.gov/sites/books/NBK544245/)。
7. [SIU Histology: serous secretion](https://histology.siu.edu/intro/glands.htm)。
8. [Columbia Histology: cerebellar molecular layer](https://histologylab.ctl.columbia.edu/lab05/brain/)。
9. [NCBI Bookshelf: type I & II alveolar cells](https://www.ncbi.nlm.nih.gov/books/NBK26875/)。
10. [Leeds Histology: primary vs secondary lymphoid follicles](https://histology.leeds.ac.uk/home/lymphoid/lymphnodes/)。

## 6. 回归检查与剩余风险

- 已在修改阶段断言基础卡片数维持 **1,269**；英文主词条、`id` 均保持唯一。运行时额外加入 **14** 个课堂考点。
- 改动未覆盖 R10 旧题的 `id`、`sourceIds`、`clue`；保留 `sourceCnByCourse` 对照初始材料。
- 没有删除任何课程词条，也没有将 Classwork 内容加入考试优先范围。
- **主要遗留风险**：源项目只提供单文件打包网页，仓库未含独立的 14 份课程原始词表；本轮无法把每条原文句子逐个与老师课件和规范术语词典交叉认证。因此，**结构全量扫描 ≠ 逐条专家人工审定**。
- **合并建议**：先审阅本 PR 修订列表；若后续提供课程词表和课堂截图原文，再完成逐条“已核实/语境待定/普通词/错误”的可追踪等级审校。
