---
id: F26b
slug: short-paragraph-uniformity
feature: F26
title: 段落長度太整齊（短段落也算）
scope: house
status: hypothesis
detector_validity: untested
kind: metric
severity:
  default: warn
message: 小企鵝模式的節奏檢查：段落長度太整齊（7 字以上的短段落也算進來）。讓段落跟著內容呼吸，不必維持相同尺寸。這是一位編輯的設定，不代表文字出自 AI。
message_en: House rhythm check in the 小企鵝模式 profile. Paragraph lengths are unusually uniform (paragraphs of 7 characters or more count). Let paragraph size follow the content. One editor's setting, not a sign of AI authorship.
detector:
  engine: builtin
  builtin: paragraph-length-cv
  params:
    min_paragraphs: 3
    min_chars: 7
  threshold:
    min: 0.3
provenance:
  derived_from: internal pilot checklist v2 F3 paragraph-CV heuristic (2026-04-24); house calibration of the short-paragraph floor (2026-10-21)
  author: penchan
evidence:
  - source: S203
    role: basis
    grade: C
    claim: "House calibration: a 7-character floor reproduces the internal pilot checklist's F3 decisions on the maintainer's published posts (its 20-byte floor is about 7 Han characters); a setting chosen to match one editor's checklist, not a measured AI signal"
    direction: unknown
    variant: zh-TW
  - source: S116
    role: support
    grade: A
    claim: Translation studies describe levelling-out as reduced stylistic variance
    direction: up
    variant: none
variants:
  zh-tw: { evidence: "house calibration", measured: false }
false_positives:
  - context: FAQ、規格文、清單與詩可能刻意維持等長段落
    fixtures: [F26b-pass-002]
  - context: 短於 7 字的段落不算
    fixtures: [F26b-pass-003]
measurement: null
---

## 抓什麼

和 F26a 用同一個量法：至少三段夠長的段落，而且每段字數過於接近時才提醒（段落字數的標準差除以平均值低於 0.3）。差別在門檻：F26a 只算 20 字以上的段落，這條從 7 字算起，所以「成功了。」以上、一行就結束的短段落也算進節奏裡。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑，而且這個 profile 會關掉 F26a；`zh`、`zh-tw` 不會載入。

## 證據

量法和 F26a 相同，證據也一樣只是間接的。7 字的門檻是這個 profile 的設定：在維護者自己已發布的貼文上，它和內部檢查清單的段落節奏判斷最一致（S203）。這是對齊一位編輯習慣的校準，不是 AI 寫作的量測結果，狀態維持 hypothesis。

## 什麼時候不算

- FAQ、規格、清單或詩可能刻意維持固定版型。
- 短於 7 字的段落不算。
- 引文、程式碼與 frontmatter 不算進段落長度。

## 怎麼改

依內容拆段。有些轉折只要一句，有些例子需要多寫幾句。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
