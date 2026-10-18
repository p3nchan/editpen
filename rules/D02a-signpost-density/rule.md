---
id: D02a
slug: signpost-density
feature: D02
title: 連接詞太密
scope: core-candidate
status: hypothesis
detector_validity: untested
kind: density
severity:
  default: warn
message: 「首先」「此外」這類連接詞用得太密。逐步說明或公告需要順序詞，可以保留；其他文章，拿掉能靠前後文自然銜接的連接詞再讀一次。
message_en: Signpost words are dense. Step-by-step instructions and notices may need them; elsewhere, remove transitions that the surrounding meaning already supplies.
detector:
  engine: regex
  unit: document
  patterns:
    - name: signpost
      regex: '(?<=(?:^|[。！？；：\n」』）])[ \t　]{0,8})(?:首先|其次|此外|然而|因此|換句話說|另一方面|總結來說|總而言之|綜上所述|值得注意的是|最後(?![一二三兩幾的階關期天週年名位個次段章節頁行篇回輪集場刻秒分]))'
  threshold:
    per: 1000
    chars: true
    max: 3.0
    min: 5
provenance:
  derived_from: internal pilot checklist v2 F4 signpost-density heuristic
  author: penchan
evidence:
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey rank 2: filler frames (值得注意的是, 综上所述, 首先) named by 12 authors; no measured word list or threshold"
    direction: up
    variant: both
  - source: S129
    role: support
    grade: C
    claim: "Indirect (source graded A, not this word list or threshold): Xiao 2010 finds more conjunctions overall in translated than in native Chinese, with genre exceptions; it compares translation with original writing, not AI with humans"
    direction: up
    variant: zh-CN
variants:
  zh-tw: { evidence: practitioner, measured: false }
  zh-cn: { evidence: practitioner, measured: false }
false_positives:
  - context: 教科書、法規與逐步教學需要清楚標示順序
    fixtures: [D02a-pass-002, D02a-pass-006, D02a-pass-007]
  - context: 「最後」當形容詞（最後一段、最後的機會）
    fixtures: [D02a-pass-003]
  - context: 短文裡只出現一兩個這類連接詞
    fixtures: [D02a-pass-004]
  - context: 句中的「因此」「然而」不在句首，不算
    fixtures: [D02a-pass-005]
measurement: null
---

## 抓什麼

「首先、其次、此外、最後、總結來說、值得注意的是」這類連接詞放在句首或分號後，一篇裡反覆出現。全文至少 5 個、而且每千字超過 3 個，才對整篇文章提出一次警告。短篇的公告或步驟說明常用「首先、其次、最後」排順序，4 個以內不提出。「最後」後面接「一段、的、幾天」這類名詞時是形容詞，不算連接詞。

## 證據

實務調查有 12 位作者點名「值得注意的是、綜上所述、首先」這類可有可無的連接詞（S177，C 級）。翻譯中文研究發現連接詞整體用量較多（S129），但沒有量測這份詞表或門檻，比較的也是翻譯與原創中文，不是 AI 與人類，所以只算間接證據（C 級）。詞表和門檻還沒用文章樣本檢驗精確率，狀態維持 hypothesis。

## 什麼時候不算

逐步教學、公告、法規或教科書需要清楚標示順序。短篇（4 個以內）不提出；更長的步驟說明仍可能被提出，這時保留順序詞即可。這條規則不能用來推定作者身分。

## 怎麼改

刪掉連接詞再讀一次。前後句仍能接起來，就不必保留。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
