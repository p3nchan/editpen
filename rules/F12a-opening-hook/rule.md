---
id: F12a
slug: opening-hook
feature: D02
title: 開頭的「最重要的是你」句型
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的開頭偏好：開頭用「最重要的是你…」「關鍵是你…」「煞得住車」這類句子帶入，讀起來像硬套的金句。直接從要講的事情開始。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House opening style in the 小企鵝模式 profile. An opening hook such as 最重要的是你… / 關鍵是你… / 煞得住車 reads as a forced punchline; start with the actual subject. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: hook
      regex: '最重要的[，,]?就?是你|(?:關鍵|重點)就?是你|煞[得不]?住車'
  within:
    paragraphs: 3
provenance:
  derived_from: Penchan's editing observation (2026-09-30)
  author: penchan
evidence:
  - source: S202
    role: basis
    grade: C
    claim: "Maintainer editing preference (Penchan, 2026-09-30): no forced-metaphor or 最重要的是你… hook in an article opening; one editor's cut of one draft, not a measured AI excess"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer observation", measured: false }
false_positives:
  - context: 第三個正文段落之後的同樣句子
    fixtures: [F12a-pass-001]
  - context: 標題、清單、引文不算正文段落，也不提出
    fixtures: [F12a-pass-002]
  - context: 「最重要的是」後面不是「你」
    fixtures: [F12a-pass-003]
measurement: null
---

## 抓什麼

文章前三個正文段落裡的這幾種開場句：

- 「最重要的是你…」「最重要的，就是你…」
- 「關鍵是你…」「重點就是你…」
- 「煞得住車」「煞不住車」「煞住車」

frontmatter、標題、清單、表格、引文、程式碼、只有圖片或只有 HTML 的段落都不算正文段落，也不提出。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

目前只有維護者的編修偏好（S202，C 級）：Penchan 在 2026-09-30 改稿時刪掉一個「最重要的是你煞得住車」式的開場句。這是一位編輯刪改一篇草稿的決定，不是量測結果，也沒有證據顯示 AI 用得比人多。狀態是 hypothesis。

## 什麼時候不算

- 第三個正文段落之後出現的同樣句子不提出。
- 標題、清單、引文不算正文段落，也不提出。
- 「最重要的是時間」這類「最重要的是」後面不是「你」的句子不提出。
- 「」『』“”‘’引文與行內程式碼由保護機制排除。

## 怎麼改

刪掉金句，直接從具體的事情開始：先寫發生了什麼、你做了什麼，讀者自己會看出重點。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
