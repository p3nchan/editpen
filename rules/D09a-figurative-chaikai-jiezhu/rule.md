---
id: D09a
slug: figurative-chaikai-jiezhu
feature: D09
title: 比喻用的「拆開」「接住」
scope: zh-tw
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: info
message: 編修建議：「把問題拆開」「接住你的情緒」「情緒被接住」是常見的比喻說法，用多了讀起來像制式說法。可以直接寫：把問題拆開 → 把問題分成幾塊；接住情緒 → 聽你說完、理解你的感受；情緒被接住 → 情緒被理解、有人聽你說。這不代表文字出自 AI；如果比喻是作者刻意的風格，就保留。
message_en: Editing suggestion. Figurative 拆開 ("break it down") and 接住 (emotional "holding") read as stock phrases when repeated; consider plain wording (把問題分成幾塊, 聽你說完, 情緒被理解). This is not a sign of AI authorship; keep the metaphor if it is the author's deliberate style.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: chaikai-abstract-object
      regex: '[把將](?:(?:這個|這些|整個|每個|這件事的?)?(?:問題|重點|概念|觀念|流程|想法|邏輯|議題|觀點|論點|決定|目標|任務|挑戰|現象|原因|難題|困難|需求|情緒|感受|焦慮|擔心|壓力|煩惱|恐懼|不安)|這件事|這句話|這段話)(?!卡|錶|表|球|板|瓶|罐|盒|箱|袋|包|單|紙|片|牌|模型|樣本)[^，。！？；：、「」\n]{0,6}拆開'
    - name: bei-jiezhu
      regex: '(?<=情緒|感受|脆弱|心情|傷痛|痛苦|眼淚|不安|焦慮|難過|委屈|恐懼|無助|崩潰)被接住'
    - name: jiezhu-emotion
      regex: '接住(?:了)?(?:(?:你|妳|我|他|她|大家|孩子|對方)們?的)?(?:情緒|感受|脆弱|不安|眼淚|崩潰|心情|難過|痛苦|焦慮|悲傷|低潮|疲憊|委屈|恐懼|失落|無助)(?!卡|錶|表|球|板|瓶|罐|盒|箱|袋|包|單|紙|片|牌|模型|樣本)'
  exclude: []
provenance:
  derived_from: Penchan's editing observation (2026-09) and the internal pilot checklist ban on 「重點拆開／拆開來看」 (2026-09-26)
  author: penchan
evidence:
  - source: S198
    role: basis
    grade: C
    claim: "Maintainer impression (Penchan, 2026-09) that figurative 拆開 (把問題拆開) and emotional 接住 (被接住, 接住你的情緒) read as stock phrases in AI drafts; an editor's impression, not a measured excess: in the 2026-09-27 sweep corpus (S197) figurative 拆開 appeared 3 times in 172 human chunks and 1 time in 192 AI drafts; 接住 appeared 0 times in either, so the sample shows no AI excess"
    direction: unknown
    variant: zh-TW
  - source: S177
    role: support
    grade: C
    claim: "Tangential: one zh-TW editor named monosyllabic AI verbs such as 拆 and 扛; that is the verb 拆 alone, not the figurative 拆開 or 接住 this rule matches"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer observation", measured: false }
false_positives:
  - context: 拆開實際的東西，包括「把紙箱拆開來講解」這類後面接說明動詞的字面用法
    fixtures: [D09a-pass-001, D09a-pass-002, D09a-pass-003, D09a-pass-004, D09a-pass-005, D09a-pass-006, D09a-pass-007, D09a-pass-008, D09a-pass-009, D09a-pass-010, D09a-pass-021, D09a-pass-022, D09a-pass-023, D09a-pass-024, D09a-pass-025, D09a-pass-026, D09a-pass-027, D09a-pass-028, D09a-pass-029, D09a-pass-030, D09a-pass-031, D09a-pass-032, D09a-pass-033, D09a-pass-034, D09a-pass-035]
  - context: 接住實際的東西或人（球、鑰匙、杯子、接力棒、帽子、互相接住的表演者、從高處掉下來的人）
    fixtures: [D09a-pass-011, D09a-pass-012, D09a-pass-013, D09a-pass-014, D09a-pass-015, D09a-pass-016, D09a-pass-017, D09a-pass-018, D09a-pass-019, D09a-pass-020]
  - context: 抽象或情緒名詞開頭的物品名稱（壓力錶、問題卡、情緒卡、目標板、情緒球、感受球、眼淚樣本瓶）與其他實物
    fixtures: [D09a-pass-049, D09a-pass-050, D09a-pass-051, D09a-pass-052, D09a-pass-053, D09a-pass-054, D09a-pass-055, D09a-pass-056, D09a-pass-057, D09a-pass-058, D09a-pass-059]
  - context: 引號裡的例句
    fixtures: [D09a-pass-036]
  - context: 台灣常用的「拆解問題」
    fixtures: [D09a-pass-037]
measurement: null
---

## 抓什麼

只收三種寫法，都是「動詞前後接抽象或情緒名詞」。名詞後面如果緊接「卡、錶、表、球、板、瓶、罐、盒、箱、袋、包、單、紙、片、牌、模型、樣本」這類物品字（例如「問題卡」「壓力錶」「情緒球」），就不提出。這只擋掉常見的物品名稱，不保證字面用法都不會提出：其他複合物品名稱和真的眼淚（「用紗布接住他的眼淚」）仍可能被提出，遇到字面用法請直接忽略這則提示。

- 「把／將＋抽象或情緒名詞＋拆開」：「把問題拆開」「把重點拆開」「把焦慮拆開」「把這件事拆開」「把這句話拆開」。「把」後面只收抽象名詞（問題、重點、概念、流程、需求……）或情緒名詞（情緒、焦慮、壓力、不安……），和「拆開」之間最多 6 個字，不跨過標點。
- 「接住＋（你／我／對方…的）＋情緒名詞」：「接住你的情緒」「接住了我的委屈」「接住對方的不安」。
- 「情緒名詞＋被接住」：「情緒被接住」「脆弱被接住」。

## 證據

目前只有維護者的印象（S198，C 級）：Penchan 在 2026-09 覺得 AI 草稿裡比喻的「拆開」「接住」讀起來像制式說法，內部試用檢查表也在 2026-09-26 禁用「重點拆開／拆開來看」。這是一位編輯的印象，不是量測結果：2026-09-27 的誤判掃描語料（S197）裡，172 段人類文字出現 3 次比喻的「拆開」，192 篇 AI 草稿出現 1 次「拆開」、2 次「拆解」，「接住」兩邊都是 0 次，樣本裡看不出 AI 用得比人類多。狀態是 hypothesis，只給 info 級的編修建議，預設為 experimental。

實務調查（S177）裡有一位台灣編輯提到 AI 愛用「拆」「扛」這類單音動詞，但那講的是單字「拆」，不是這條規則抓的比喻用法，只當旁證。

## 什麼時候不算

- 拆開實際的東西：「拆開包裹」「把紙箱拆開來分析每一層」「把月餅拆開來說明內餡」「拆開來看，這個便當盒裡有三個隔層」。
- 接住實際的東西或人：「接住高飛球」「接住每一個人」（消防員）「接住自己三歲的孩子」「演員在落地前接住彼此」「傳歪的球終於被接住」「新生兒被接住的時候」。
- 「」『』“”‘’引文與行內程式碼裡的例句由保護機制排除。
- 「拆解問題」在台灣技術與商業文章很常見，不提出。
- 比喻是作者刻意的風格時（例如整篇都用拆裝的意象），請直接保留；規則沒辦法自動判斷這一點。
- 範圍說明：單獨的「拆開來看」「拆開來講」「拆開來理解」不會提出；只有前面是「把＋抽象或情緒名詞」時才提出，例如「把這件事拆開來理解」會在「把這件事拆開」這段提出。
- 已知誤判：真的眼淚仍會提出，例如「護理師用紗布接住他的眼淚」「她把紙巾攤開，接住眼淚後立刻丟進垃圾桶」「她掉下的眼淚被接住了，紙巾上留下一圈水痕」「攝影棚裡，假眼淚被接住」；物品字清單以外的複合物品名稱也可能被提出。這些是字面用法，請忽略提示。
- 已知漏網：以下說法字面用法也常見，為了避免誤判不提出，包括「拆開來看，…」「我們拆開來講」「我們把這個拆開來看」「學會接住自己」「接住彼此」「值得被接住」「有被接住的感覺」「我會在你崩潰的時候接住你」「有人願意接住你」「接住每一個人心裡的難過」「接得住」「接不住」。

## 怎麼改

- 把問題拆開 → 把問題分成幾塊
- 接住你的情緒 → 聽你說完、理解你的感受
- 情緒被接住 → 情緒被理解、有人聽你說

換掉之後如果句子變空，通常代表原句沒有具體內容，直接補上要分析的項目或要做的事。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
