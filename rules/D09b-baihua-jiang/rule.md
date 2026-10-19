---
id: D09b
slug: baihua-jiang
feature: D09
title: 「白話講」
scope: zh-tw
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: info
message: 編修建議：「白話講」可以改成「簡單說」，讀起來更自然。這不代表文字出自 AI；如果這是作者刻意的口語風格，就保留。
message_en: Editing suggestion. Consider 簡單說 in place of 白話講. This is not a sign of AI authorship; keep it if it is the author's deliberate colloquial style.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: baihua-jiang
      regex: '白話講'
  exclude: []
provenance:
  derived_from: Penchan's editing observation (2026-10-19)
  author: penchan
evidence:
  - source: S199
    role: basis
    grade: C
    claim: "Maintainer editing preference (Penchan, 2026-10-19): replace 白話講 with 簡單說; an editor's preference, not a measured AI excess"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer observation", measured: false }
false_positives:
  - context: 「白話文」「講白話」「白話來說」等其他含「白話」的說法
    fixtures: [D09b-pass-001, D09b-pass-002, D09b-pass-003]
  - context: 引號裡的例句
    fixtures: [D09b-pass-004]
measurement: null
---

## 抓什麼

只抓「白話講」這三個字，例如「白話講就是…」「用白話講，…」。

## 證據

目前只有維護者的編修偏好（S199，C 級）：Penchan 在 2026-10-19 編修時把「白話講」改成「簡單說」。這是一位編輯的偏好，不是量測結果，樣本裡也沒有證據顯示 AI 用得比人類多。狀態是 hypothesis，只給 info 級的編修建議，預設為 experimental。

## 什麼時候不算

- 「白話文」「講白話」「白話來說」等其他含「白話」的說法，不提出。
- 「」『』“”‘’引文與行內程式碼裡的例句由保護機制排除。
- 如果「白話講」是作者刻意的口語風格，請直接保留。

## 怎麼改

- 白話講 → 簡單說

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
