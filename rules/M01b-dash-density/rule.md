---
id: M01b
slug: dash-density
feature: D03
title: 破折號太密
scope: zh-tw
status: hypothesis
detector_validity: untested
kind: density
severity:
  default: info
message: 破折號用得很密，挑一兩個保留，其他改成逗號、冒號或括號。
message_en: Dashes are dense. Keep one or two; turn the rest into commas, colons, or parentheses.
detector:
  engine: regex
  unit: document
  patterns:
    - name: dash-mark
      regex: '[—─]{2}|(?<![0-9０-９])(?:(?<!(?:^|[\s，。、；：！？（「『]|從|由)\p{Script=Han}{2,3})—|—(?!\p{Script=Han}))(?![0-9０-９])'
  threshold:
    per: 1000
    han: true
    max: 2.0
    min: 3
provenance:
  derived_from: Pingu ruling r2 (2026-09-27), from the editpen false-positive sweep dash counts
  author: penchan
evidence:
  - source: S197
    role: basis
    grade: B
    claim: "Own measurement, small sample: human pre-2022 zh-TW text 0.10 dash marks per 1k CJK chars (26 marks in 256,756 chars, 22 once digit ranges are excluded as this detector does; 1 of 172 chunks above 2/1k); Claude social-post drafts 1.72/1k (26 marks in 15,157 chars; 11 of 32 above 2/1k, 5 of 32 with the 3-mark minimum); GPT-6 drafts 0/1k (32 drafts)"
    direction: up
    variant: zh-TW
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey rank 3: 破折號/em dash named by 11 authors (mostly zh-CN); zh-TW pushback says 破折號不是元兇"
    direction: mixed
    variant: both
variants:
  zh-tw: { evidence: measured, measured: true }
false_positives:
  - context: 只用一兩個破折號
    fixtures: [M01b-pass-001, M01b-pass-003]
  - context: 數字之間的連接號（1811—1872、81—93）
    fixtures: [M01b-pass-002]
  - context: 兩個地名之間的單一連接號（礁溪—頭城、北投—淡水、瑞芳—猴硐）
    fixtures: [M01b-pass-002, M01b-pass-005]
  - context: 引號內的引文
    fixtures: [M01b-pass-004]
  - context: 短句裡集中出現的破折號，例如表示聲音延續（嗚——嗚——嗚——）；這類仍會提出，所以預設只是提示（info）
    fixtures: [M01b-fail-001]
measurement: null
---

## 抓什麼

整篇文章裡的破折號數量。「──」或「——」連寫兩個算一個，單一「—」也算一個；數字之間的「—」（1811—1872、81—93 頁）和兩個地名之間的「—」（礁溪—頭城、臺北—左營）是連接號，不算。地名的判斷方式跟 M01a 一樣：「—」前面是句首、標點或「從、由」之後的兩三個漢字，後面接著漢字。全文至少 3 個、而且每千個漢字超過 2 個，才對整篇文章提出一次提示。只用一兩個破折號永遠不會提出。

這條規則的預設嚴重度是提示（info），不是警告：目前只統計過 Claude 寫的社群貼文草稿，還沒量過規則標得準不準。

## 證據

這條規則的依據是本專案自己的量測（S197，B 級，樣本小）：

- 2022 年以前的台灣中文（PTT、總統府新聞稿、中文維基百科，共 172 段、256,756 個漢字）：每千字 0.10 個破折號，172 段裡只有 1 段超過每千字 2 個。
- Claude 寫的社群貼文草稿（32 篇）：每千字 1.72 個，32 篇裡 11 篇超過每千字 2 個；加上「至少 3 個」的條件後是 5 篇。
- GPT-6 寫的草稿（32 篇）：一個破折號都沒有。

實務調查也有 11 位作者點名破折號（S177，C 級，多為中國大陸使用者），但台灣有作者認為破折號不是關鍵。這個差距只量到 Claude 草稿，不代表所有 AI，也不能用來推定作者身分。偵測器的精確率尚未另外量測，狀態維持 hypothesis。

## 什麼時候不算

- 全文 3 個以內、或長文裡平均每千字不到 2 個，不提出。
- 數字範圍的連接號不算；「」『』“”‘’引文與行內程式碼裡的破折號由保護機制排除。
- 兩個地名之間的單一「—」不算，所以「礁溪—頭城、北投—淡水、瑞芳—猴硐都能搭火車。」不會提出。
- 已知仍會提出：短文裡刻意連用的破折號（例如「嗚——嗚——嗚——」表示聲音延續）。這時可以忽略提示。
- 也因為地名判斷只看字數，句首兩三個字後面接單一「—」的子句（例如「其實—這件事…」）不會被算進去。

## 怎麼改

挑一兩個真正需要停頓或轉折的地方保留破折號，其他依前後關係改成逗號、冒號或括號。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
