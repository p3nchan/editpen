---
id: F08a
slug: nested-clauses
feature: D08
title: 一句話串太多層因果
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: info
message: 原因、條件和結果連著寫到「進而／從而」（由於…加上…因此…進而…），或用「在…的基礎上，進一步…」起頭。確認每一步都必要：都必要就可以保留，或拆成短句讓因果更清楚；有哪一步只是墊話，就刪掉。
message_en: Long reasoning chain. A cause-and-addition chain that runs on into "thereby/and further", or "on the basis of X, further Y". Check that each link is needed; keep real causal steps (or split them into short sentences) and drop links that only pad.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: causal-chain
      regex: '(?:由於|因為)[^，。！？]{2,20}[，,]\s*(?:再加上|加上|而且|並且|同時)[^，。！？]{2,20}[，,]\s*(?:(?:因此|所以|因而)[^，。！？]{2,24}[，,]\s*)?(?:進而|從而)[^。！？]{2,30}'
    - name: jichuzhishang
      regex: '在[^，。]{2,15}(的基礎上|的前提下)[，,](進一步|進而|從而)'
  exclude: []
provenance:
  derived_from: internal pilot checklist v2 F8 (2026-04-24)
  author: penchan
evidence:
  - source: S049
    role: support
    grade: A
    claim: "Indirect (did not measure this construction): Hu et al. 2018 discriminate translated vs original Chinese from aggregate syntactic features (F1 89-94%); the paper does not identify this construction and does not compare AI with human text"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: indirect, measured: false }
  zh-cn: { evidence: indirect, measured: false }
false_positives:
  - context: 因果拆成兩句
    fixtures: [F08a-pass-001]
  - context: 口語與新聞常用的「因為 A，加上 B，所以 C」
    fixtures: [F08a-pass-004, F08a-pass-005, F08a-pass-006, F08a-pass-007]
  - context: 真實的物理因果（仍會以 info 提示，請作者確認每一步）
    fixtures: [F08a-fail-004]
measurement: null
---

## 抓什麼

- 「由於／因為 A，加上／而且 B，（因此 C，）進而／從而 D」：原因、附加原因之後，再往下推一層結果。
- 「在……的基礎上（前提下），進一步／進而……」的墊話式開頭。

「因為下雨，加上塞車，所以我遲到了」這種三段因果是台灣口語和新聞的常見句型，不提出；要一路推到「進而／從而」才算。

## 證據

句法特徵整體上能區分翻譯中文與原生中文（S049），但研究用的是整體句法特徵，沒有單獨辨識這個句型，也不是比較 AI 與人類，所以只算間接證據。這兩個正規表示式尚未通過精確率量測，因此維持 hypothesis 與 info。

## 什麼時候不算

需要完整呈現推論步驟的因果分析可以保留。「因為昨晚下大雨，加上排水溝堵住，因此地下室淹水，進而造成電梯故障」每一步都是真實的因果，規則分不出來，仍會以 info 提示；確認每一步都需要，就不必改。

## 怎麼改

先把原因寫成一句，再寫新增條件，最後交代結果。若三者不能各自站穩，刪掉不影響結論的那一層。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
