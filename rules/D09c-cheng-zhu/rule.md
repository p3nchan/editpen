---
id: D09c
slug: cheng-zhu
feature: D09
title: 「撐住」「撐得住」「撐不住」
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的用字偏好：「撐住／撐得住／撐不住」可以改成「能不能維持」「夠不夠用」，把要維持的是什麼寫清楚。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House wording in the 小企鵝模式 profile. Consider 能不能維持 or 夠不夠用 in place of 撐住 / 撐得住 / 撐不住, and name what has to hold. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: cheng-zhu
      regex: '[撐撑](?:不[撐撑])?[得不]?住'
provenance:
  derived_from: Penchan's editing observation (2026-10-08)
  author: penchan
evidence:
  - source: S201
    role: basis
    grade: C
    claim: "Maintainer editing preference (Penchan, 2026-10-08): avoid 撐住／撐得住／撐不住, use 能不能維持／夠不夠用; an editor's preference, not a measured AI excess"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer observation", measured: false }
false_positives:
  - context: 「撐」的其他用法（撐傘、支撐、撐起、撐腰）
    fixtures: [D09c-pass-001, D09c-pass-002, D09c-pass-003]
  - context: 引文裡的例句
    fixtures: [D09c-pass-004]
measurement: null
---

## 抓什麼

「撐住」「撐得住」「撐不住」「撐不撐得住」，簡體字形「撑」也算。例如「這樣的流量，伺服器撐得住嗎？」。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

目前只有維護者的編修偏好（S201，C 級）：Penchan 在 2026-10-08 決定對外文字不用「撐住」這一組詞，改寫成「能不能維持」「夠不夠用」。這是一位編輯的偏好，不是量測結果，也沒有證據顯示 AI 用得比人多。狀態是 hypothesis。

## 什麼時候不算

- 「撐傘」「支撐」「撐起」「撐腰」這類後面沒有「住」的用法，不提出。
- 「」『』“”‘’引文與行內程式碼裡的例句由保護機制排除。
- 已知會標出：字面上的支撐，例如「用木條撐住屋簷」。這種句子如果是作者刻意的寫法，就保留。

## 怎麼改

- 伺服器撐得住嗎 → 伺服器的容量夠不夠用
- 估值撐住了 → 估值維持住了／估值沒有掉
- 撐不住 → 維持不下去、不夠用

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
