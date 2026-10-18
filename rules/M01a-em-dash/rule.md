---
id: M01a
slug: em-dash
feature: D03
title: 中文句子裡的單一長橫線（—）
scope: zh-tw
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 單一「—」夾在中文句子之間，是英文 em dash 的用法。台灣標點的破折號是「──」（占兩格），單一「—」是只連接起止範圍的連接號。改用逗號、冒號、句號、括號，或改成破折號「──」。
message_en: A single em dash joining Chinese clauses is English typography. Taiwan's MOE handbook uses a two-cell dash (──) as the Chinese dash and reserves a single dash for ranges. Use Chinese punctuation or a proper two-cell dash.
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: spaced-em-dash
      regex: '(?<=\p{Script=Han}[，、；：」』）]?[ \u00A0\u3000]+)—(?=[ \u00A0\u3000]+[「『（]?\p{Script=Han})'
    - name: clause-em-dash
      regex: '(?<=\p{Script=Han}[，、；：」』）]?)(?<!(?:臺北|台北|新北|基隆|桃園|新竹|苗栗|臺中|台中|彰化|南投|雲林|嘉義|臺南|台南|高雄|屏東|宜蘭|花蓮|臺東|台東|澎湖|金門|馬祖|南港|板橋|左營|松山|小港)|站|(?:^|[\s，。、；：！？（「『]|從|由)\p{Script=Han}{2,3})—(?!(?:臺北|台北|新北|基隆|桃園|新竹|苗栗|臺中|台中|彰化|南投|雲林|嘉義|臺南|台南|高雄|屏東|宜蘭|花蓮|臺東|台東|澎湖|金門|馬祖|南港|板橋|左營|松山|小港)|(?:週|周|星期|禮拜)[一二三四五六日天末]|[一二三四五六七八九十]{1,3}[月日號點時])(?=\p{Script=Han}[^\s\d０-９，。、；：！？…（）()「」『』《》〈〉—─~∼]{5})'
provenance:
  derived_from: internal pilot checklist, punctuation section (2026-04-24)
  author: penchan
evidence:
  - source: S147
    role: basis
    grade: B
    claim: "MOE handbook: 破折號 is 「──」 occupying two cells (h10.htm); a single 「—」 is 連接號甲式, used only to join ranges such as 1811—1872 or 臺北—左營 (h15.htm). A lone dash joining clauses is neither. The handbook prints the dash as ──; also accepting —— (the common IME dash) is a product choice, not something S147 states."
    direction: unknown
    variant: zh-TW
  - source: S177
    role: support
    grade: C
    claim: "Practitioner survey rank 3: 破折號/em dash named by 11 authors (mostly zh-CN); zh-TW pushback says 破折號不是元兇"
    direction: mixed
    variant: both
variants:
  zh-tw: { evidence: official, measured: false }
false_positives:
  - context: 破折號「──」（手冊印的寫法）與「——」（本工具同樣接受）
    fixtures: [M01a-pass-004, M01a-pass-005, M01a-pass-006, M01a-pass-007]
  - context: 連接號「—」連接數字、地名、車站或星期的起止範圍（含沒有括號的「臺北—左營」）
    fixtures: [M01a-pass-008, M01a-pass-009, M01a-pass-010, M01a-pass-013, M01a-pass-014, M01a-pass-015]
  - context: 句首、標點後或「從、由」後面的兩三字範圍（礁溪—頭城、北投—淡水）
    fixtures: [M01a-pass-016, M01a-pass-017, M01a-pass-018, M01a-pass-019]
  - context: 英文段落、英文引文、程式碼
    fixtures: [M01a-pass-001, M01a-pass-002, M01a-pass-011]
measurement: null
---

## 抓什麼

中文子句之間只用一個「—」銜接，例如「專案延後了—原因是供應商還沒回覆」或「這個功能 — 雖然還不完美 — 已經可以用了」。這是英文 em dash 的寫法直接搬進中文。規則只看兩種形狀：前後留空格的單一「—」，以及緊貼中文、後面接著一整段子句的單一「—」。每個「—」只回報一次。

## 證據

教育部《重訂標點符號手冊》修訂版（S147）列出的破折號是「──」，占行中二格，用於語意轉變、聲音延續或補充說明；單一「—」是連接號甲式，只用來連接時空起止或數量範圍（例：西元1811—1872年、第81—93頁、臺北—左營）。所以單一「—」拿來接子句，兩種正式用法都不是。實務調查裡有 11 位作者把破折號列為 AI 寫作常見的特徵（S177，C 級，多為中國大陸使用者），但台灣也有作者認為破折號不是關鍵。這條規則因此不碰破折號本身，只抓英文式的單一長橫線。手冊印的破折號是「──」；一般輸入法打出的「——」手冊沒有印，本工具選擇一樣不提出，這是產品決定，不是手冊的規定。精確率尚未量測，狀態維持 hypothesis。

## 什麼時候不算

- 破折號「──」（手冊的寫法）與「——」（輸入法常見寫法，本工具接受）不提出。
- 連接號：數字之間（1811—1872、81—93）、縣市或常見車站名之間（臺北—左營、南港站—左營站，有沒有括號都一樣）、星期或日期範圍（週一—週五、三月—五月）不提出。
- 英文句子裡的 em dash：前後不是中文字，不提出。
- 句首的「—」（對話體）不提出。

- 「—」前面只有兩三個字、而且這兩三個字接在句首、標點或「從、由」後面（礁溪—頭城、北投—淡水、從瑞芳—猴硐）時，當成範圍不提出。

「」『』“”‘’引文與行內程式碼由保護機制排除。已知仍會標出：夾在句子中間、前面不是「從、由」的陌生地名範圍（例如「這班車行駛礁溪—頭城之間的路段」）。已知漏網：句首很短的子句接「—」（例如「結果—他遲到了」）會被當成範圍而不提出。

## 怎麼改

依前後關係改用逗號、冒號、句號或括號；真的需要破折號的語氣，就寫成「──」（本工具也接受「——」）。

## 量測

<!-- generated: measurement -->
尚未量測。
<!-- /generated -->
