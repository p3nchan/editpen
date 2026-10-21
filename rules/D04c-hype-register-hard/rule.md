---
id: D04c
slug: hype-register-hard
feature: D04
title: 中國大陸網路流行語與宣傳用語（嚴格名單）
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的用字偏好：這是中國大陸常見的網路流行語或宣傳用語，換成台灣常用的說法，或直接寫出具體意思。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House wording in the 小企鵝模式 profile. A common mainland Chinese internet or promotional buzzword; use the Taiwan wording or say the concrete meaning. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: hard-terms
      regex: '降本增效|出道即巔峰|賦能萬物|賦能千行百業|強迫症(?:福音|狂喜|救星)|通用AI智能體|數智化|新質生產力|智能向善|顯眼包|數字游民|絕絕子|妥妥的|保姆級(?!別)'
    - name: yyds
      regex: 'yyds'
      flags: i
provenance:
  derived_from: "internal pilot checklist v2 V1/V2 (2026-06 register audit: agent-assisted scans + Penchan's native-speaker rulings)"
  author: penchan
evidence:
  - source: S200
    role: basis
    grade: C
    claim: "Maintainer's curated mainland/AI-register term list (2026-06), filtered by native-speaker rulings; a preference list, not a measured AI excess"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer term list", measured: false }
false_positives:
  - context: 「保姆級別」這類正常的複合詞
    fixtures: [D04c-pass-001]
  - context: 引文裡的用詞（引述對岸說法）
    fixtures: [D04c-pass-002]
  - context: 其他含部分字的台灣說法（數位遊牧、保姆、賦能以外的字串）
    fixtures: [D04c-pass-003, D04c-pass-004]
measurement: null
---

## 抓什麼

一份固定的嚴格名單，都是中國大陸的網路流行語或宣傳用語：降本增效、出道即巔峰、賦能萬物、賦能千行百業、強迫症福音／狂喜／救星、通用AI智能體、數智化、新質生產力、智能向善、顯眼包、數字游民、絕絕子、妥妥的、保姆級，以及 yyds（大小寫都算）。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

名單來自小企鵝 2026 年 6 月整理對外用詞時的稽核（S200，C 級）：先用工具輔助掃描，再由母語編輯逐條裁定，`zhtw-mcp` 已經處理的簡繁用詞不列入。這是一位編輯的用字偏好，沒有量測過 AI 是否比人更常用這些詞，不能拿來判斷作者。狀態是 hypothesis。

## 什麼時候不算

- 「保姆級別」是正常的複合詞，不提出。
- 「」『』“”‘’引文與行內程式碼裡的詞由保護機制排除，引述對岸說法時可以加引號。
- 已知會標出：「穩穩妥妥的」裡面的「妥妥的」。
- 「賦能萬物」「賦能千行百業」同時符合 D04b 的「賦能」，兩條都會標出。

## 怎麼改

換成台灣常用的說法（數字游民 → 數位遊牧，保姆級教學 → 手把手教學），或直接寫出具體做了什麼：「降本增效」寫成「省下多少成本、快了多少」。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
