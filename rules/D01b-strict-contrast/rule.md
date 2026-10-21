---
id: D01b
slug: strict-contrast
feature: D01
title: 「從來不是／其實不是」與「表面上…，實際上…」對比句
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 對比句型：先否定一個說法，或先講表面再翻出「其實」。確認讀者真的會這樣以為；不會的話，直接寫你要說的那一面。
message_en: Contrast frame (從來不是 / 其實不是 / 表面上…實際上…). Keep it only if a reader would assume the first half; otherwise state your point directly.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: conglai-qishi
      regex: '(從來(?:都)?不是|其實不是)[^，。！？]{2,20}(?:[，,]\s*(?:而是|是|才是)[^。！？]{2,20})?'
    - name: surface-vs-actual
      regex: '表面上看?[^，。！？]{2,20}[，,]\s*(?:實際上|實則|其實|骨子裡)[^。！？]{2,20}'
provenance:
  derived_from: internal pilot checklist v2 F1 medium-precision bucket (2026-04-24)
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: "Contrastive frames are the #1 named tell (18 distinct X authors, zh-CN and zh-TW); the survey counts the 不是…而是 family, not these two variants separately"
    direction: up
    variant: both
variants:
  zh-tw: { evidence: practitioner, measured: false }
false_positives:
  - context: 「從來不」「其實是」這類沒有「不是」的說法
    fixtures: [D01b-pass-001, D01b-pass-002]
  - context: 「表面上」後面沒有「實際上／實則／其實／骨子裡」翻轉
    fixtures: [D01b-pass-003]
  - context: 引文裡的原話
    fixtures: [D01b-pass-004]
measurement: null
---

## 抓什麼

D01a 之外、同一個家族的兩種對比句：

- 「從來（都）不是 X」「其實不是 X」，後面接不接「，而是／是／才是 Y」都算，例如「他從來不是好人」「其實不是價格問題，而是信任問題」。
- 「表面上（看）X，實際上／實則／其實／骨子裡 Y」，例如「表面上看是漲價，實際上是變相降價」。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。D01a 是預設開啟的公開規則，這兩種寫法先放在 house，不改動公開預設。

## 證據

和 D01a 同一個家族：實務調查裡 18 位不同作者把「不是 X，而是 Y」列為最常見的 AI 寫作特徵（S177，C 級）。調查沒有分開統計這兩種變體，也還沒有文章樣本的量測，狀態是 hypothesis。

## 什麼時候不算

- 「從來不說謊」「其實是好事」這類沒有「不是」的句子不提出。
- 「表面上」後面沒有「實際上、實則、其實、骨子裡」的翻轉，不提出。
- 「」『』“”‘’引文與行內程式碼由保護機制排除。
- 已知會標出：字面上的「表面」，例如「桌子表面上有灰塵，其實擦一下就乾淨」。
- 「其實不是價格問題，而是信任問題」同時符合 D01a，兩條都會標出。

## 怎麼改

直接寫 Y：「問題在信任」「這是變相降價」。讀者真的會誤會的時候，才保留前半句。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
