---
id: F06a
slug: forced-elevation
feature: D02
title: 結尾硬講大道理
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 結尾用「總結來說」把前文再講一遍，或用「這不僅是 X，更是 Y」把 Y 說得比 X 更偉大。先問 X 和 Y 是不是真的兩件不同的事；如果 Y 只是把 X 講得更大，就讓最後一個具體事實或決定自己收尾。
message_en: Forced elevation. The ending restates everything after "in conclusion", or lifts the point with "this is not just X, it is Y". Ask whether X and Y are really different claims; if Y only inflates X, let the last concrete fact or decision close the piece.
detector:
  engine: regex
  unit: document
  patterns:
    - name: zongjie
      regex: '(?<=[。！？」』）][ \t　]{0,8}|\n[ \t　]{0,8})(?:總結來說|綜上所述|總而言之|總的來說|綜合以上)[，,](?=[^。！？]{0,400}(?:[。！？]{1,4}[^。！？]{0,400})?(?:[。！？]{1,4}[^。！？]{0,400})?$)'
    - name: bujinshi-gengshi
      regex: '(?:這|它|那)不(?:僅|只)是[^，。！？\n]{2,20}[，,][ \t]*更是[^。！？\n]{0,24}(?:機會|轉變|改變|蛻變|革命|可能|未來|態度|精神|價值|思維|承諾|責任|使命|旅程|起點|契機|里程碑|突破|升級|信念|文化|力量|智慧|藝術|哲學|象徵|縮影|體現|修行)[。！](?=[」』）\s]{0,8}(?:[^。！？]{1,200}[。！？]{1,4}[」』）\s]{0,8})?$)'
  exclude: []
provenance:
  derived_from: internal pilot checklist v2 F6 (2026-04-24)
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey rank 6: too complete / padded discourse (铺垫-包装-升华), 8 authors (pattern zongjie only)"
    direction: up
    variant: both
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey rank 9: 「不仅是 X，更是 Y」 named directly by 6 authors; the qualifying rows that name it are zh-CN posts (pattern bujinshi-gengshi only)"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: practitioner, measured: false }
  zh-cn: { evidence: practitioner, measured: false }
false_positives:
  - context: 正式報告具體交代結語內容
    fixtures: [F06a-pass-001]
  - context: 事實陳述的「不僅是…也是…」
    fixtures: [F06a-pass-003, F06a-pass-004]
  - context: 「不僅是 X，更是 Y」的 Y 是具體類別，兩半確實不同（民事糾紛／刑事案件）
    fixtures: [F06a-pass-008, F06a-pass-009]
  - context: 「不僅是…更是…」出現在文章中段，不是收尾
    fixtures: [F06a-pass-010]
  - context: 總結標記出現在開頭或文章中段
    fixtures: [F06a-pass-005, F06a-pass-006, F06a-pass-007]
measurement: null
---

## 抓什麼

- 收尾位置的總結標記：「總結來說、綜上所述、總而言之、總的來說、綜合以上」出現在全文最後兩句之內，而且前面已經有內容。放在開頭或文章中段的不提出。
- 收尾位置（全文最後兩句之內）的升華句「這不僅是 X，更是 Y」，而且 Y 收在「機會、轉變、可能、未來、價值、精神」這類抽象大詞上。Y 是具體的東西（「更是刑事案件」）、或句子出現在文章中段，都不提出。「不僅是 X，也是 Y」多半是在並列兩個事實，不提出。

## 證據

實務調查中有 8 位作者提到過度完整或填充式篇章結構（S177 第 6 名，C 級），對應總結標記；「不僅是 X，更是 Y」則有 6 位作者直接點名（S177 第 9 名，C 級），點名的貼文都來自中國大陸使用者。這些句型目前沒有文章樣本的統計，偵測規則的精確率也還沒檢驗，因此維持 hypothesis 與 warn。

## 什麼時候不算

正式報告與演講稿可能需要明確的結語，尤其需要讓讀者清楚知道決議和接下來要做的事時。這條規則只提示句型，不代表所有總結句都該刪除。

## 怎麼改

刪掉總結標記，讓最後一個具體發現、決定或動作直接收尾。遇到「不僅是 X，更是 Y」，先問 X 和 Y 是不是兩件不同的事。「這不僅是民事糾紛，更是刑事案件」兩半意思不同，可以保留；若 Y 只是把 X 講得更大，就只留下 Y，或直接寫出具體後果。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
