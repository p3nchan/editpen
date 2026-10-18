---
id: D04b
slug: mainland-jargon
feature: D04
title: 中國大陸常見的空泛職場用語
scope: zh-tw
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 「賦能、閉環、抓手」是中國大陸寫作者點名的空泛職場用語，台灣的使用情況還沒有量測；先確認台灣讀者看得懂，再決定要不要換。
message_en: 賦能/閉環/抓手 were named as corporate stock phrases by mainland Chinese writers; their Taiwan usage is unmeasured, so check whether Taiwan readers will follow before replacing.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: practitioner-ai-term
      regex: '(?<!(?:說的|叫做|稱為|稱作|寫成|寫作|所謂的?|說|稱|叫)[『“"]?|機械)(?:(?<![天稟])賦能|(?<![關密封緊倒自幽])閉環(?![境保節島狀繞球評線道形]|回收|控制|系統)|(?<=[的個種為找當]|找到)抓手(?![機臂把腕套指心掌帕]))'
  exclude: []
provenance:
  derived_from: split from D04a 2026-09-27 (Pingu ruling r2); punctuation-only 抓手 branch removed
  author: penchan
evidence:
  - source: S177
    role: basis
    grade: C
    claim: "Practitioner survey rank 5: 赋能/闭环/抓手 named as AI tells by 8 zh-CN authors; no zh-TW practitioner flagged them; not in the MOE table (S148)"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: "practitioner, zh-CN posts only", measured: false }
false_positives:
  - context: 引用大陸來源（「」引號）
    fixtures: [D04b-pass-001, D04b-pass-022]
  - context: 詞彙剛好跨在兩個台灣常用詞中間（抓手機、密閉環境、天賦能力）
    fixtures: [D04b-pass-003, D04b-pass-004, D04b-pass-005, D04b-pass-006, D04b-pass-007, D04b-pass-008, D04b-pass-009, D04b-pass-010, D04b-pass-011, D04b-pass-012, D04b-pass-013]
  - context: 台灣也用的技術詞（閉環回收、閉環控制）與機械抓手
    fixtures: [D04b-pass-014, D04b-pass-015, D04b-pass-017]
  - context: 不加引號討論用詞本身（大陸說的抓手、稱為『抓手』）
    fixtures: [D04b-pass-016, D04b-pass-018, D04b-pass-019]
  - context: 「抓」當動詞、後面接「手」或以「手」開頭的東西（請抓手、抓手帕、抓手套）
    fixtures: [D04b-pass-020, D04b-pass-021, D04b-pass-023, D04b-pass-024, D04b-pass-025]
measurement: null
---

## 抓什麼

實務調查裡被中國大陸寫作者點名為 AI 腔的「賦能」「閉環」「抓手」。

每個詞都加了前後文檢查，避免把跨在兩個台灣常用詞中間的字串當成這類職場用語，例如「抓手機」「抓手帕」「密閉環境」「天賦能力」。「抓手」只在前面是「的、個、種、為、找、找到、當」時提出，這些位置的「抓手」是名詞；「請抓手」這種動詞加受詞的寫法不提出。

## 證據

出自實務調查（S177，C 級）：8 位作者點名，全部是中國大陸使用者的貼文，沒有台灣作者提到。這組詞不在教育部對照表（S148）裡，台灣的使用情況沒有量測，所以訊息只請你確認讀者看不看得懂，不說它是錯的。

精確率尚未量測，狀態維持 hypothesis。

## 什麼時候不算

- 「大陸說的抓手」「所謂閉環」「稱為『抓手』」這類討論用詞本身的寫法不提出。
- 「閉環回收」「閉環控制」「閉環系統」是台灣也用的技術詞；「機械抓手」是夾爪，都不提出。
- 「」『』“”‘’引文與行內程式碼裡的詞由保護機制排除。
- 已知漏網：「建立工作抓手，才能分配責任」這種前面直接接名詞的「抓手」不會提出。

## 怎麼改

「抓手」可改成「著力點」或「具體做法」，「閉環」可改成「完整流程」，「賦能」可改成「幫助」「讓…能夠」。不要只做逐字替換。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
