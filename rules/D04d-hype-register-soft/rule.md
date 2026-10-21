---
id: D04d
slug: hype-register-soft
feature: D04
title: 中國大陸網路用語與 AI 圈用語（一般名單）
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的用字偏好：這是中國大陸網路或 AI 圈常見的說法，換成台灣常用的說法，或直接寫出具體意思。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House wording in the 小企鵝模式 profile. A common mainland Chinese internet or AI-industry term; use the Taiwan wording or say the concrete meaning. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: register-terms
      regex: '復盤|顆粒度|凡爾賽|拔草|拉滿|沉浸式|劃重點|建議收藏|收藏起來|先收藏|寶藏工具|寶藏App|一鍵生成|一鍵成片|一鍵搞定|上下文工程|模型上下文協議|AI原生|全模態|原生多模態|滿血版|AI神器|零門檻|國產大模型|智駕|智能座艙|賽博對帳|活人感|硬核|硬控|水靈靈地|搭子|拉通|公域'
    - name: guarded-terms
      regex: '(?<!供應)鏈路(?!線)|(?<![重反])複用|智能體(?!驗)|(?:也太|很|超|太|夠)香(?!的)|手機號(?!碼)|信息(?!素)|(?<!隱)私域|剛需(?![要求])|(?<!接)觸達|(?<!前)提效'
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
  - context: 含這些字的台灣常用複合詞（供應鏈路、鏈路線、重複用、智能體驗、手機號碼、信息素、隱私域、剛需要、接觸達、前提效）
    fixtures: [D04d-pass-001, D04d-pass-002, D04d-pass-003, D04d-pass-004, D04d-pass-005, D04d-pass-006, D04d-pass-007, D04d-pass-008, D04d-pass-009, D04d-pass-010, D04d-pass-011]
  - context: 「很香的」「太香的」這類修飾名詞的「香」
    fixtures: [D04d-pass-012]
  - context: 引文裡的用詞
    fixtures: [D04d-pass-013]
measurement: null
---

## 抓什麼

一份比 D04c 寬的名單，都是中國大陸網路或 AI 圈常見的說法：

- 一般用語：復盤、顆粒度、凡爾賽、拔草、拉滿、沉浸式、劃重點、建議收藏、收藏起來、先收藏、寶藏工具、寶藏App、一鍵生成、一鍵成片、一鍵搞定、零門檻、賽博對帳、活人感、硬核、硬控、水靈靈地、搭子、拉通、公域。
- AI 與科技圈：上下文工程、模型上下文協議、AI原生、全模態、原生多模態、滿血版、AI神器、國產大模型、智駕、智能座艙。
- 要看前後文的詞：鏈路、複用、智能體、（很／超／太／也太／夠）香、手機號、信息、私域、剛需、觸達、提效。這些詞出現在台灣常用的複合詞裡時不提出（見「什麼時候不算」）。

「閉環」由 D04b 處理，這條不重複列。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

名單來自小企鵝 2026 年 6 月整理對外用詞時的稽核（S200，C 級）：先用工具輔助掃描，再由母語編輯逐條裁定，`zhtw-mcp` 已經處理的簡繁用詞不列入。這是一位編輯的用字偏好，沒有量測過 AI 是否比人更常用這些詞，不能拿來判斷作者。狀態是 hypothesis。

## 什麼時候不算

- 供應鏈路、鏈路線、重複用、反複用、智能體驗、手機號碼、信息素、隱私域、剛需要、剛需求、接觸達、前提效：詞剛好跨在台灣常用的複合詞裡，不提出。
- 「很香的花」「太香的湯」這種「香」接「的」、修飾名詞的寫法，不提出。
- 「」『』“”‘’引文與行內程式碼由保護機制排除。
- 已知會標出：字面意思的「拔草」（去田裡拔草）、「收復盤中跌點」裡跨詞的「復盤」。

## 怎麼改

換成台灣常用的說法：復盤 → 檢討、回顧；顆粒度 → 細節程度；手機號 → 手機號碼；信息 → 資訊；一鍵生成 → 按一下就產生。或直接寫出具體做了什麼。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
