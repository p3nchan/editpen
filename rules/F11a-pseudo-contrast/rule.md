---
id: F11a
slug: pseudo-contrast
feature: D01
title: 重複主詞的反轉句
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: info
message: 「他不是在 X，他是在 Y」：確認 X 和 Y 真的是兩件事。如果 Y 只是把 X 換句話說，直接寫 Y。
message_en: Possible pseudo-contrast. Check that X and Y are really different; if Y only restates X, just write Y.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: repeated-subject-contrast
      regex: '([他她它我你]們?)不是在[^，。]{2,15}[，,]\1是在[^。]{2,15}[。！]'
  exclude:
    - name: quoted
      regex: '^「.*」[。！？]?$'
provenance:
  derived_from: internal pilot checklist v2 F11 (2026-04-24)
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: "Subset of contrastive frames; disguised form"
    direction: up
    variant: both
variants:
  zh-tw: { evidence: practitioner, measured: false }
  zh-cn: { evidence: practitioner, measured: false }
false_positives:
  - context: 引述中的原話
    fixtures: [F11a-pass-001]
  - context: 主詞不重複的更正句
    fixtures: [F11a-pass-002]
  - context: 兩半真的是不同動作（他不是在睡覺，他是在裝睡）；句型分不出來，仍以 info 請作者確認
    fixtures: [F11a-fail-005]
measurement: null
---

## 抓什麼

前後分句重複同一個主詞（含「我們」「他們」），用「不是在……，是在……」做出反轉。規則只認得句型，分不出兩半是否真的不同：「他不是在睡覺，他是在裝睡」是真正的區分，「她不是在哀悼過去，她是在告別童年」則可能只是換個說法。所以提示是請你檢查，不是斷定。

## 證據

這是「不是 X，而是 Y」句型裡較固定的一種寫法。實務觀察把這類假反轉列為 AI 寫作常見的特徵，但還沒有獨立的文章樣本統計，因此維持 hypothesis 與 info。

## 什麼時候不算

引述中的原話不歸到作者名下。兩半確實是不同的動作（澄清誤會、揭穿假象）時，句子本身沒有問題，可以保留。文學散文也可能刻意重複主詞製造節奏。

## 怎麼改

保留後半真正要說的動作，直接寫成一句。若兩個動作確實需要比較，就具體說明差異，不要只靠「不是在……，是在……」撐出反轉。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
