---
id: F09a
slug: nominalization
feature: F14
title: 把動作繞著說
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: info
message: 編修建議：「進行評估」可以直接寫「評估」，「凸顯…的重要性」可以改寫成具體後果。這不代表文字出自 AI；學術或公文慣用說法讀起來自然，就保留。
message_en: Editing suggestion. A light verb wraps the action ("conduct an evaluation"), or "highlights the importance of X" packages the point as an abstract noun; consider the plain verb or the concrete consequence. This is not a sign of AI authorship; keep established academic or official phrasing if it reads naturally.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: light-verb
      regex: '(?:進行|實現|達到|形成|作出|做出|予以|加以|給予|實施)了?(?:(?:全面|深入|初步|進一步|詳細|徹底|系統性?|有效|充分|具體|全方位|持續|綜合|整體|多方面)的?)?(?:評估|分析|研究|探討|討論|改革|優化|提升|整合|佈局|規劃|審查|檢討)(?![師員者室所區會組案計報團聯院中結告果機單小委能工方費題])'
    - name: highlight-importance
      regex: '(?:凸顯|突顯|彰顯|體現|顯示)(?:了|出)?[^，。！？；]{1,12}的(?:重要性|必要性|關鍵性|緊迫性|迫切性)'
  exclude: []
provenance:
  derived_from: internal pilot checklist v2 F9 (2026-04-24)
  author: penchan
evidence:
  - source: S144
    role: support
    grade: A
    claim: "Indirect (did not measure these patterns): Yan & Han 2021, table 6, student interpreters produced more nominalizations than professionals (1.48 vs 0.35 on average). Both groups are interpreting output; this is not a translated-vs-original or AI-vs-human measurement"
    direction: up
    variant: zh-CN
  - source: S137
    role: support
    grade: C
    claim: "Yu Guangzhong criticizes 作出/進行 + abstract noun (難度很高的技巧 = abstract-noun packaging) as an editorial matter; supports an editing suggestion, not an AI label"
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: practitioner, measured: false }
  zh-cn: { evidence: indirect, measured: false, note: "S144 counts nominalizations in interpreting output only" }
false_positives:
  - context: 學術內容直接用動詞
    fixtures: [F09a-pass-001]
  - context: 「進行」等字和名詞分屬不同詞組（進行中的研究、形成共識後再討論、給予學生討論的時間）
    fixtures: [F09a-pass-004, F09a-pass-005, F09a-pass-006, F09a-pass-007]
  - context: 名詞是複合詞的一部分（研究聯盟、分析師）
    fixtures: [F09a-pass-008, F09a-pass-009]
  - context: 日常的「的可能性」「的重要性」
    fixtures: [F09a-pass-010, F09a-pass-011]
  - context: 司法與新聞的「進行調查」（指正式調查程序）
    fixtures: [F09a-pass-013]
measurement: null
---

## 抓什麼

兩種形狀：

- 「進行」「作出」「達到」這類字直接帶抽象動作名詞：「進行評估」「作出初步分析」「達到優化」。這類字和名詞之間只允許「了」或一個常見修飾語（全面的、初步、進一步……），不跨過其他詞。
- 「凸顯／彰顯／體現／顯示……的重要性」這類把重點包成抽象名詞的句型。

## 證據

余光中把「作出／進行＋抽象名詞」列為英式中文的典型（S137，C 級），這支持的是編修建議，不是「出自 AI」的判斷。口譯研究發現學生口譯員比專業口譯員更常把動作寫成名詞（S144，A 級來源），但兩組都是口譯產出，不是翻譯與原創、也不是 AI 與人類的比較，所以只算間接證據。這個句型在台灣中文或 AI 文字裡都還沒有量測，狀態是 hypothesis，所以只給 info 級的編修建議。

## 什麼時候不算

- 「進行」等字和後面的名詞分屬不同詞組：「進行中的研究」「形成共識後再討論」「給予學生討論的時間」。
- 名詞是複合詞的一部分：「形成研究聯盟」「給予分析師」。
- 日常的「的可能性很高」「睡眠的重要性」不提出；只抓「凸顯／顯示……的重要性」這類包裝。
- 「進行調查」在司法與新聞報導裡指正式的調查程序，不提出。
- 「進行研究」「進行審查」在台灣學術文與公文很常見，仍會提示；如果改成「研究」「審查」讀起來不自然，就保留。

## 怎麼改

把名詞還原成動詞：「進行評估」→「評估」，「作出初步分析」→「初步分析」。「凸顯了備援電力的重要性」可以直接寫它帶來的後果，例如「停電時只有備援電力撐住了機房」。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
