---
id: F26a
slug: paragraph-uniformity
feature: F26
title: 段落長度太整齊
scope: core-candidate
status: measured-AI
detector_validity: untested
kind: metric
severity:
  default: warn
message: 段落長度太整齊。讓段落跟著內容呼吸，不必維持相同尺寸。
message_en: Paragraph lengths are unusually uniform. Let paragraph size follow the content instead of a template.
detector:
  engine: builtin
  builtin: paragraph-length-cv
  params:
    min_paragraphs: 3
    min_chars: 20
  threshold:
    min: 0.3
provenance:
  derived_from: internal pilot checklist v2 F3 paragraph-CV heuristic
  author: penchan
evidence:
  - source: S028
    role: support
    grade: A
    claim: Generated prose shows greater formality and reduced literary quality
    direction: up
    variant: zh-CN
  - source: S116
    role: support
    grade: A
    claim: Translation studies describe levelling-out as reduced stylistic variance
    direction: up
    variant: none
variants:
  zh-tw: { evidence: indirect, measured: false }
  zh-cn: { evidence: measured, measured: true }
false_positives:
  - context: FAQ、規格文、清單與詩可能刻意維持等長段落
    fixtures: [F26a-pass-002]
measurement: null
---

## 抓什麼

至少三段有 20 字以上，而且每段字數過於接近時才提醒（段落字數的標準差除以平均值低於 0.3）。短於 20 字的段落不算。

## 證據

AI 文字風格趨於一致，有文章樣本的研究支持；用段落字數來看只是粗略判斷，還沒驗證，所以預設只到 warn。

## 什麼時候不算

FAQ、規格、清單或詩可能刻意維持固定版型。規則只指出節奏整齊，不判定文本來源。

## 怎麼改

依內容拆段。有些轉折只要一句，有些例子需要多寫幾句。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
