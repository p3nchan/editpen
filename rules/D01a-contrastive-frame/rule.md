---
id: D01a
slug: contrastive-frame
feature: D01
title: 「不是 X，而是 Y」對比句
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 「不是 X，而是 Y」句型。先確認讀者真的會誤解 X；不會的話，直接寫 Y。
message_en: Contrastive frame "not X but Y". Keep it only if a reader would assume X; otherwise state Y.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: basic
      regex: '(不是|並非|並非是)[^，。！？—─]{2,20}[，,]\s*(而是|是|才是)[^。！？]{2,24}'
    - name: not-only
      regex: '不只是[^，。！？—─]{2,20}[，,]\s*而是[^。！？]{2,24}'
    - name: dash
      regex: '(不是|並非|並非是|不只是)[^，。！？—─\n]{2,20}(?:[—─]{2}|[ \u3000]?—[ \u3000]?)(而是|才是)[^。！？]{2,24}'
    - name: key-not-in
      regex: '(關鍵|重點|問題)[^，。！？]{0,8}不在(於)?[^，。！？]{2,16}[，,]\s*(而在於|而是)[^。！？]{2,20}'
    - name: yuqi
      regex: '(與其說|與其)[^，。！？]{2,20}[，,]?\s*不如(說)?[^。！？]{2,24}'
  exclude:
    - name: quoted-sentence
      regex: '^「[^「」]*」[。！？]?$'
provenance:
  derived_from: internal pilot checklist v2 F1 high-precision bucket (2026-04-24)
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: '#1 tell; 18 distinct X authors, zh-CN and zh-TW'
    direction: up
    variant: both
  - source: S137
    role: support
    grade: C
    claim: English contrastive calque; not a translationese feature per se
    direction: unknown
    variant: zh-TW
variants:
  zh-tw: { evidence: practitioner, measured: false }
  zh-cn: { evidence: practitioner, measured: false }
false_positives:
  - context: 引述中的原話
    fixtures: [D01a-pass-001, D01a-pass-008, D01a-pass-009]
  - context: 「不是 X」放句尾做必要釐清
    fixtures: [D01a-pass-002]
  - context: 編輯性的實質比較
    fixtures: [D01a-pass-003]
  - context: 「不只是…，還／也是／更是…」遞進句（「不只是…，更是」屬 F06a）
    fixtures: [D01a-pass-004, D01a-pass-005]
  - context: 破折號後面是補充說明、沒有「而是」，或跨句
    fixtures: [D01a-pass-006, D01a-pass-007]
measurement: null
---

## 抓什麼

「這不是工具，而是方法。」先否定一個讀者沒想過的 X，再端出 Y，製造反轉感。整篇靠這類句型推進，就是 AI 腔。

這幾種相近的句型都算：
- 「不是／並非 X，而是／是／才是 Y」
- 「不只是 X，而是 Y」
- 用破折號代替逗號：「這不是一個普通的筆記 App——而是你的第二大腦」（「──」「——」或單一「—」，後面必須緊接「而是」或「才是」，而且不跨句）
- 「關鍵不在 X，而在於 Y」、「與其 X，不如 Y」

## 證據

- 實務端：調查裡 18 位不同作者把它列為 AI 寫作最常見的特徵（S177，C 級）。
- 語言學端：余光中把它歸為英文 not X but Y 的直譯（S137，C 級）。
- 文章樣本統計：還沒有。目前狀態是 hypothesis，預設只到 warn。

## 什麼時候不算

讀者真的會誤解 X 的時候留；「不是 X」放在主張之後補釐清的時候留。引述內容也不歸到作者名下：整個句型都在引號裡才不算，X 或 Y 裡只有一個詞加了引號，照樣提出。「不只是 X，還／也是／更是 Y」是一般的遞進句，這條不抓（「更是」的硬升華歸 F06a）；破折號後面只是補充說明、沒有「而是」，也不抓。

## 怎麼改

刪掉「不是 X」，直接寫 Y。改完問：少了否定前半，主張有沒有更清楚？

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
