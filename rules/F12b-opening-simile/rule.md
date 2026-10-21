---
id: F12b
slug: opening-simile
feature: D02
title: 第一句就打比方（「就像」「好比」「宛如」）
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的開頭偏好：文章第一句就用「就像／好比／宛如」打比方，讀起來像硬套的開場。先寫具體的事，比喻真的有幫助再放後面。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House opening style in the 小企鵝模式 profile. The first sentence opens with a simile (就像 / 好比 / 宛如), which reads as a forced hook; start with the concrete subject and keep a helpful comparison for later. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: paragraph
  patterns:
    - name: first-sentence-simile
      regex: '(?<=^[^。！？.!?…]{0,200})(?:就像|好比|宛如)'
  within:
    paragraphs: 1
provenance:
  derived_from: Penchan's editing observation (2026-09-30)
  author: penchan
evidence:
  - source: S202
    role: basis
    grade: C
    claim: "Maintainer editing preference (Penchan, 2026-09-30): no forced-metaphor hook in an article opening; one editor's cut of one draft, not a measured AI excess"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer observation", measured: false }
false_positives:
  - context: 第一個正文段落的第二句以後才打比方
    fixtures: [F12b-pass-001]
  - context: 第二個正文段落以後的比喻
    fixtures: [F12b-pass-002]
  - context: 標題、圖片、HTML 不算第一個正文段落
    fixtures: [F12b-pass-003]
measurement: null
---

## 抓什麼

文章第一個正文段落的第一句（到第一個「。！？.!?…」為止，最多 200 字）裡的「就像」「好比」「宛如」，例如「寫程式就像煮菜，火候最重要。」

frontmatter、標題、清單、表格、引文、程式碼、只有圖片或只有 HTML 的段落都不算正文段落；第一個正文段落是跳過這些之後的第一段。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

目前只有維護者的編修偏好（S202，C 級）：Penchan 在 2026-09-30 改稿時刪掉一個硬套比喻的開場句。這是一位編輯刪改一篇草稿的決定，不是量測結果，也沒有證據顯示 AI 用得比人多。狀態是 hypothesis。

## 什麼時候不算

- 第一句之後才打比方，不提出。
- 第二個正文段落以後的比喻不提出。
- 「」『』“”‘’引文與行內程式碼由保護機制排除。
- 第一句超過 200 字時，200 字以後的比喻不提出。

## 怎麼改

第一句先寫具體的事：發生了什麼、要談的是什麼。比喻真的能幫讀者理解，再放到後面。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
