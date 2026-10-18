---
id: F07a
slug: concessive-overuse
feature: D07
title: 讓步句太密
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: density
severity:
  default: warn
message: 「雖然…但」這類讓步句用得很密。每次都先退一步再轉回來，讀起來像在打安全牌。只留會改變結論的那幾句。
message_en: Dense concessives. Stepping back before every point ("although X, but Y") reads as hedging; keep only the concessions that change the conclusion.
detector:
  engine: regex
  unit: document
  patterns:
    - name: concessive
      regex: '(?:雖然|儘管|固然|(?<![理想所])當然(?![可沒好是啦囉耳])|誠然)[^，。！？]{2,30}[，,]\s*(?:但|不過|然而|卻)'
  threshold:
    per: 1000
    chars: true
    max: 25
    min: 4
provenance:
  derived_from: internal pilot checklist v2 F7 (2026-04-24)
  author: penchan
evidence:
  - source: S129
    role: support
    grade: C
    claim: "Indirect (source graded A, not this pattern): Xiao 2010 finds more conjunctions overall in translated Chinese (306.42 vs 243.23 per 10,000 tokens, LL=723.12), with genre exceptions, and lists 固然 among formal conjunctions more common in native Chinese. Concessive frames were not measured separately, the study compares translation with original writing (not AI with humans), and no AI-Chinese concessive frequency study exists (feature-map D07)"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: indirect, measured: false }
  zh-cn: { evidence: indirect, measured: false }
false_positives:
  - context: 議論文、學術文合法使用（三次以內）
    fixtures: [F07a-pass-001]
  - context: 非讓步的「當然」（理所當然、想當然耳、當然可以、當然沒問題）
    fixtures: [F07a-pass-004]
  - context: 長文裡零星出現的讓步句
    fixtures: [F07a-pass-005]
  - context: 引述裡的讓步句不計入次數（作者自己只寫一次）
    fixtures: [F07a-pass-003, F07a-pass-006]
measurement: null
---

## 抓什麼

讓步句型「雖然／儘管／固然／當然／誠然……，但／不過／然而／卻」在短篇幅裡擠在一起。兩個條件都成立才提出：

1. 全文至少 4 次（引號內、程式碼裡的不算，次數和密度都只計作者自己寫的部分）。
2. 每千字超過 25 次，也就是平均不到 40 個字就出現一次。

「當然」只在讓步用法時計入；「理所當然」「想當然耳」「當然可以」「當然沒問題」不算。

## 證據

翻譯中文研究發現連接詞整體用量較多（S129），但比較的是翻譯與原創中文，不是 AI 與人類；研究沒有單獨量測讓步句，還把「固然」列為原創中文較常用的連接詞。所以這裡只算間接證據（C 級），不沿用該研究本身的 A 級。門檻 25／千字是依樣例暫定，還沒根據文章樣本調整，狀態維持 hypothesis。

## 什麼時候不算

議論文與學術文可能需要逐項承認限制。三次以內、或長文裡分散出現的讓步句都不提出。引用內容不歸到作者名下。

## 怎麼改

保留真正會改變結論的讓步句。其餘句子直接說條件、結果或限制，不必每次先退一步。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
