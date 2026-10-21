---
id: M01c
slug: double-em-dash
feature: D03
title: 雙長橫線「——」
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的標點偏好：「——」改用逗號、冒號、句號或括號；真的需要破折號，就寫成手冊的「──」。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House punctuation in the 小企鵝模式 profile. Replace —— with a comma, colon, full stop or brackets; where a dash is really needed, use the MOE handbook dash ──. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: double-em-dash
      regex: '—{2,}'
provenance:
  derived_from: internal pilot checklist v2 M1, punctuation section (2026-04-24)
  author: penchan
evidence:
  - source: S147
    role: basis
    grade: B
    claim: "MOE handbook prints the Chinese dash as 「──」 (h10.htm); 「——」, the common IME form, is not the handbook form. Flagging every 「——」 is this profile's house choice, stricter than the handbook requires"
    direction: unknown
    variant: zh-TW
  - source: S197
    role: support
    grade: B
    claim: "Own sweep: dash marks (──/—— runs and single —) 0.10 per 1k CJK chars in 172 human chunks vs 1.72 in 32 Claude social-post drafts and 0 in 32 GPT-6 drafts; small sample, two model families"
    direction: up
    variant: zh-TW
variants:
  zh-tw: { evidence: "house punctuation choice", measured: false }
false_positives:
  - context: 手冊的破折號「──」與單一的「—」（單一長橫線由 M01a 處理）
    fixtures: [M01c-pass-001, M01c-pass-002]
  - context: 引文與行內程式碼裡的「——」
    fixtures: [M01c-pass-003, M01c-pass-004]
measurement: null
---

## 抓什麼

正文裡的「——」（兩個以上連在一起的長橫線），例如「他走了——再也沒回來」。一串長橫線只回報一次。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

教育部《重訂標點符號手冊》修訂版（S147）印的破折號是「──」；一般輸入法打出的「——」不是手冊的寫法。公開的 M01a 接受「——」，小企鵝模式更嚴格：發文前一律把「——」改掉。這是一位編輯的標點偏好，不是手冊的硬性規定。

我們自己的小規模實測（S197）裡，破折號在 Claude 社群貼文草稿每千字 1.72 個，人寫的文字每千字 0.10 個，GPT-6 草稿是 0。樣本小、只有兩家模型，只能看方向，不能拿來判斷作者。精確率尚未量測，狀態維持 hypothesis。

## 什麼時候不算

- 手冊的破折號「──」不提出。
- 單一的「—」不在這條的範圍（中文句子裡的單一長橫線由 M01a 處理）。
- 「」『』“”‘’引文與行內程式碼裡的「——」由保護機制排除。

## 怎麼改

看前後的關係改用逗號、冒號、句號或括號；語氣真的需要停頓轉折，就寫成「──」。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
