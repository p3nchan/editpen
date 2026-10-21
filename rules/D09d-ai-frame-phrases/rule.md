---
id: D09d
slug: ai-frame-phrases
feature: D09
title: 套話與模糊感覺詞（「拆開來看」「放回桌上」「很真」）
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 小企鵝模式的用字偏好：這是讀起來像套話或說得很模糊的寫法，直接寫出你要說的內容或具體的感受。這是一位編輯的偏好，不代表文字出自 AI。
message_en: House wording in the 小企鵝模式 profile. A stock frame or vague feeling word; say the content or the concrete impression directly. One editor's preference, not a sign of AI authorship.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: put-on-table
      regex: '放回桌[上面]|放一起看'
    - name: chaijie-offer
      regex: '拆解一下|我來拆解|讓我拆解|我幫你拆解'
    - name: chaikai-frame
      regex: '重點拆開|問題拆開|拆開來看|拆開講'
    - name: vague-trial
      regex: '還在試|還在摸索|線要畫在哪'
    - name: hen-zhen
      regex: '很真(?![實誠心情切])'
provenance:
  derived_from: "internal pilot checklist v2 V1/V2 (2026-06 register audit: agent-assisted scans + Penchan's native-speaker rulings) + Penchan ruling 2026-09-26"
  author: penchan
evidence:
  - source: S200
    role: basis
    grade: C
    claim: "Maintainer preference items in the curated term list (2026-06; 拆開 frames and closing hedges added 2026-09-26): stock frames and vague feeling words; an editor's preference, not a measured AI excess"
    direction: unknown
    variant: zh-TW
  - source: S198
    role: support
    grade: C
    claim: "Maintainer impression that figurative 拆開 reads as a stock phrase; sweep recount shows no measured AI signal"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: "maintainer observation", measured: false }
false_positives:
  - context: 「很真實」「很真誠」「很真心」「很真情」「很真切」
    fixtures: [D09d-pass-001, D09d-pass-002, D09d-pass-003, D09d-pass-004, D09d-pass-005]
  - context: 「拆開」「拆解」的字面用法（拆開包裹、拆解引擎）
    fixtures: [D09d-pass-006, D09d-pass-007]
  - context: 引文裡的例句
    fixtures: [D09d-pass-008]
measurement: null
---

## 抓什麼

幾組小企鵝改稿時固定刪掉的寫法：

- 套話框架：「放回桌上」「放回桌面」「放一起看」；「拆解一下」「我來拆解」「讓我拆解」「我幫你拆解」；「重點拆開」「問題拆開」「拆開來看」「拆開講」。
- 模糊的收尾與感覺詞：「還在試」「還在摸索」「線要畫在哪」；單獨的「很真」（「很真實」「很真誠」等不算）。

這條是小企鵝模式（`-p penchan`）的 house 規則，只在這個 profile 裡跑；`zh`、`zh-tw` 不會載入。

## 證據

這些是維護者的編修偏好（S200，C 級）：2026 年 6 月整理對外用詞時列入，「拆開」框架和模糊收尾在 2026-09-26 補上。比喻用的「拆開」另見 S198：維護者覺得它像套話，但小規模實測沒有量到 AI 用得比人多。這些都是一位編輯的偏好，不能拿來判斷作者。狀態是 hypothesis。

## 什麼時候不算

- 「很真實」「很真誠」「很真心」「很真情」「很真切」不提出。
- 「拆開包裹」「拆解引擎」這類字面用法不提出（只抓上面列的固定組合）。
- 「」『』“”‘’引文與行內程式碼由保護機制排除。
- 已知會標出：字面意思的「把杯子放回桌上」，以及「還在試穿」「還在試算」裡的「還在試」。
- 「把問題拆開來看」同時符合 D09a，兩條都會標出。

## 怎麼改

- 拆開來看、我來拆解 → 直接列出第一點、第二點
- 放回桌上 → 寫出要討論的是什麼
- 還在試、還在摸索 → 寫出試了什麼、卡在哪裡
- 很真 → 寫出哪裡讓你覺得真實

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
