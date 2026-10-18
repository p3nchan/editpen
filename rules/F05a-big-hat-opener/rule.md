---
id: F05a
slug: big-hat-opener
feature: D02
title: 開頭先講空泛的大背景
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 段落一開頭先搭大時代背景（「在當今…時代」「隨著科技的發展」）。刪掉它再讀，意思不變就直接從重點開始。
message_en: Big-hat opener. The paragraph opens with a generic era backdrop ("in today's digital age", "with the development of technology"). Start with what you want to say.
detector:
  engine: regex
  unit: paragraph
  patterns:
    - name: zaidangjin
      regex: '^在(?:當今|當前|現今|如今|今日)[^，。！？；\n]{0,24}(?:時代|年代|環境|背景|脈絡|社會|世界)[下中裡]?[，,]'
    - name: zaizhege-shidai
      regex: '^在這個[^，。！？；\n]{2,16}的(?:時代|年代)[裡中]?[，,]'
    - name: suizhe
      regex: '^隨著[^，。！？；\n]{0,12}(?:科技|技術|AI|人工智慧|網路|網際網路|數位|全球化|社會|時代|社群媒體|生成式|資訊|工具|模型)[^，。！？；\n]{0,10}的(?:快速|不斷|持續|蓬勃|迅速|飛速|高速|日益|全面)?(?:發展|普及|進步|興起|崛起|演進|變革|成熟|進化)[，,]'
    - name: langchao
      regex: '^在[^，。！？；\n]{2,20}的(?:大)?浪潮(?:之)?下[，,]'
    - name: macro-backdrop
      regex: '^在(?:全球化|數位化|數位轉型|AI|人工智慧|科技)[^，。！？；\n]{0,12}的(?:大)?(?:背景|趨勢|時代)(?:之)?下[，,]'
  exclude: []
provenance:
  derived_from: internal pilot checklist v2 F5 (2026-04-24)
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey: discourse framing tells"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: practitioner, measured: false }
  zh-cn: { evidence: practitioner, measured: false }
false_positives:
  - context: 新聞導言直接交代事件
    fixtures: [F05a-pass-001]
  - context: 具體情節或病程的「隨著…發展」
    fixtures: [F05a-pass-003, F05a-pass-004, F05a-pass-005]
  - context: 具體處境的「在…下」
    fixtures: [F05a-pass-006, F05a-pass-007]
  - context: 段落中間的「隨著…」
    fixtures: [F05a-pass-008]
  - context: 新聞裡交代具體因果的「隨著經濟發展」
    fixtures: [F05a-pass-009, F05a-pass-010]
measurement: null
---

## 抓什麼

段落第一句先搭一個可以套在任何主題上的大背景，再進入真正要說的事：

- 「在當今／當前／如今……的時代（環境、社會）」、「在這個……的時代」
- 「隨著科技／AI／網路／數位工具……的（快速）發展（普及、興起）」：要有「的」這種套語形狀，主詞也要是可以套在任何主題上的科技或時代大詞。
- 「在……的浪潮下」、「在全球化／數位轉型……的背景下」

只看段落開頭。「隨著」「在……下」後面接的是具體的人或事（劇情、病情、孩子、這樣的環境、少子化）時不提出。「隨著經濟發展」「隨著產業轉型」常是新聞在交代具體因果，也不提出。

## 證據

實務調查把空泛的篇章框架列為 AI 寫作線索（S177，C 級）。這組開頭句型與偵測規則還沒用文章樣本檢驗精確率，因此狀態維持 hypothesis，預設為 warn。

## 什麼時候不算

新聞導言或時評前言有時確實需要先交代時代背景。若開頭提供具體時間、事件或資料，而不是可套在任何主題上的背景句，就不必為了避開句型而刪除。

## 怎麼改

把逗號前的背景拿掉，直接讀後半句。如果意思不變，就從具體的人、事件或判斷開始；若背景不可少，補上可核對的時間與變化。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
