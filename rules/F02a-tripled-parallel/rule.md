---
id: F02a
slug: tripled-parallel
feature: D05
title: 整齊的三項排比
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: info
message: 三項排比很整齊。確認三項都必要；只有一項真正有份量時，就只留那一項。食譜、須知這類本來就是三個步驟的，可以保留。
message_en: Tripled parallel structure. Check that all three items earn their place; if only one carries weight, keep that one. Genuine three-step instructions can stay.
detector:
  engine: regex
  unit: paragraph
  patterns:
    - name: repeated-prefix-triad
      regex: '(?<!(?:提醒|呼籲|建議|要求|叮嚀|規定|告訴)[^，。！？、\n]{0,8})(?<!(?:需要|是|讓|願|要|代表|意味著|帶來|成為|展現)[^，。！？、\n]{2,12}[、，])(需要|是|讓|願|要|代表|意味著|帶來|成為|展現)([^，。！？、\n]{2,12})[、，]\1([^，。！？、\n]{2,12})[、，]\1([^，。！？、\n]{2,12})[。！]'
    - name: abstract-verb-object-triad
      regex: '(?<!、\p{Script=Han}{1,8})\p{Script=Han}{4}、(?:提升|提高|拓展|拓寬|增強|強化|優化|激發|培養|促進|推動|打造|深化|釋放|啟發|開拓|增進|凝聚|降低|增加|改善|擴大|加速)\p{Script=Han}{2}、(?:提升|提高|拓展|拓寬|增強|強化|優化|激發|培養|促進|推動|打造|深化|釋放|啟發|開拓|增進|凝聚|降低|增加|改善|擴大|加速)\p{Script=Han}{2}(?=[。！；，]|$)'
    - name: adverb-verb-triad
      regex: '(?<!、\p{Script=Han}{1,8})(?:深入|積極|共同|持續|全面|不斷|有效|充分|切實|努力|攜手|主動|勇於|大力|深度)\p{Script=Han}{2}、(?:深入|積極|共同|持續|全面|不斷|有效|充分|切實|努力|攜手|主動|勇於|大力|深度)\p{Script=Han}{2}、(?:深入|積極|共同|持續|全面|不斷|有效|充分|切實|努力|攜手|主動|勇於|大力|深度)\p{Script=Han}{2}(?=[。！；，]|$)'
  exclude:
    - name: markdown-heading-or-list-item
      regex: '^[ \t]*(?:#{1,6}|[-*+]|\d+[.)])[ \t]'
    - name: enumeration-list
      regex: '^(?:[（(]?[一二三四五六七八九十]{1,3}[、．.)）]|[（(]?\d{1,2}[、．.)）]|[①-⑳])'
provenance:
  derived_from: internal pilot checklist v2 F2 (2026-04-24)
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey rank 7: forced parallel / rule of three, 7 authors; every qualifying row that names it is a zh-CN post, and none of the seven zh-TW rows mentions it (Taiwan support unverified)"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: none (zh-CN practitioner posts only), measured: false }
  zh-cn: { evidence: practitioner, measured: false }
false_positives:
  - context: 編號清單、Markdown 標題與項目符號
    fixtures: [F02a-pass-001, F02a-pass-004, F02a-pass-005]
  - context: 引述中的口號
    fixtures: [F02a-pass-002]
  - context: 轉述提醒或規定（提醒民眾要…、要…、要…）
    fixtures: [F02a-pass-003]
  - context: 四項以上的清單
    fixtures: [F02a-pass-006]
  - context: 轉述叮嚀（提醒孩子要…、要…、要…）
    fixtures: [F02a-pass-007]
  - context: 食譜與須知的三個步驟（句型分不出來，仍以 info 提示）
    fixtures: [F02a-fail-007]
  - context: 以「一」或數字起頭的一般段落不應整段跳過
    fixtures: [F02a-fail-005, F02a-fail-006]
measurement: null
---

## 抓什麼

兩種剛好三項的整齊排比：

- 三個分句用同一個前綴，例如「需要創新、需要勇氣、需要堅持」。四項以上的清單不算。
- 三個四字動賓短語，後兩項是「提升、拓展、優化、激發……」這類抽象動詞，例如「整理思路、提升效率、拓展視野」。
- 三個「副詞＋動詞」四字短語，例如「深入探討、積極協作、共同創造」。

這種刻意湊成三項的節奏容易讓論點像在套用固定句型。

## 證據

實務調查中有 7 位作者提到強迫排比或三段式結構（S177，C 級），點名的貼文都來自中國大陸使用者；台灣作者的貼文沒有提到這一項，所以在台灣中文的支持尚未確認。目前沒有文章樣本的統計能證明三項排比本身足以辨識文本來源，因此維持 hypothesis，並只提供 info 級提示。

## 什麼時候不算

- 編號清單（「一、」「1.」「①」起頭的段落）、Markdown 標題與項目符號行不提出。
- 轉述提醒或規定：「衛福部提醒民眾要勤洗手、要戴口罩、要避免群聚」。
- 「」『』“”‘’裡的口號與行內程式碼由保護機制排除。
- 已知仍會提出：食譜與申請須知這類刻意的三項指示（「煎牛排要大火、要少翻、要靜置」）。句型上和 AI 的三項排比分不開，所以規則只給 info 級提示。

## 怎麼改

先確認三項是否都不可少。能合併的就合併，剩下的依重要性改寫成自然長短；若三項確實各自承擔不同論點，保留排比也可以。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
