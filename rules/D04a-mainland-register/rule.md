---
id: D04a
slug: mainland-register
feature: D04
title: 中國大陸用語
scope: zh-tw
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 「軟件、硬件、數據庫」是教育部對照表列出的大陸用語，台灣說軟體、硬體、資料庫。
message_en: Taiwan's MOE lists 軟件/硬件/數據庫 as mainland terms; Taiwan uses 軟體/硬體/資料庫.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: moe-mainland-term
      regex: '(?<!(?:說的|叫做|稱為|稱作|寫成|寫作|所謂的?|說|稱|叫)[『“"]?)(?:軟件|硬件|數據庫)'
  exclude: []
provenance:
  derived_from: internal pilot checklist v2 V1/V2 + 對岸腔 95-term list (2026-06); cut 2026-09-27 to the terms an external source names; practitioner terms split into D04b 2026-09-27
  author: penchan
evidence:
  - source: S148
    role: basis
    grade: B
    claim: "MOE 常見大陸地區語詞對照表 lists 軟件→軟體, 硬件→硬體, 數據庫→資料庫"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: official, measured: false }
false_positives:
  - context: 引用大陸來源（「」引號、行內程式碼）
    fixtures: [D04a-pass-004]
  - context: 不加引號討論用詞本身（大陸說軟件）
    fixtures: [D04a-pass-002, D04a-pass-003]
measurement: null
---

## 抓什麼

教育部對照表列為大陸用語的「軟件」「硬件」「數據庫」（台灣說軟體、硬體、資料庫）。實務調查點名的「賦能」「閉環」「抓手」證據等級不同，拆到 D04b。

## 證據

「軟件」「硬件」「數據庫」出自教育部《重編國語辭典修訂本》常見大陸地區語詞對照表（S148，B 級）。原本詞表裡的其他 12 個詞（拉通、降本增效、私域、公域、觸達、剛需、提效、親測、硬核、妥妥的、復盤、顆粒度、鏈路）在教育部對照表與實務調查都找不到，已經移除。

精確率尚未量測，狀態維持 hypothesis。

## 什麼時候不算

- 「中國大陸說軟件」「寫成數據庫」「所謂硬件」這類討論用詞本身的寫法不提出。
- 「」『』“”‘’引文與行內程式碼裡的詞由保護機制排除。
- 已知漏網：因為「說」後面的詞一律視為討論用詞，「他說軟件太貴」這種一般敘述也不會提出。

## 怎麼改

軟件→軟體、硬件→硬體、數據庫→資料庫。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
