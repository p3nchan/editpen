# editpen practitioner survey (S177)

> Licence: CC BY 4.0 (see `../LICENSE-RESEARCH`). This is a summary of the practitioner survey cited as S177 in `ledger.md`. It publishes counts only; the underlying posts are not redistributed.

## Method

- **Where**: public posts on X (formerly Twitter).
- **When searched**: 2026-09-06, covering posts dated 2025-01-01 to 2026-09-06.
- **What was searched**: Chinese and English keyword searches for posts that name a specific tell of AI-written Chinese (quoted phrases such as 「不是…而是」, 破折號, 翻譯腔, AI味, plus follow-up searches for Traditional Chinese posts, editor and teacher voices, and pushback). The search was LLM-assisted; every post in the tallies was returned with its post ID.
- **Inclusion rule**: a post qualifies only if it names a concrete linguistic or formatting tell. Posts that only said a text "looks like AI" were dropped.
- **Size**: 58 distinct posts cited in total; 35 qualifying posts form the main table (section 1 below). The distinct-author counts in section 2 draw on all qualifying posts found, including some cited only as examples.
- **Spot check**: 6 posts were opened and read by hand; all 6 were real and on-topic. The other posts were not individually re-verified, so treat every count as approximate.
- **Variant labels**: zh-TW = Traditional Chinese, zh-CN = Simplified Chinese, EN = English posts about Chinese output. The label is the script of the post, not the author's location.

## 1. Qualifying posts by layer and variant

| Layer | zh-TW | zh-CN | EN | Total |
|---|---:|---:|---:|---:|
| lexicon | 1 | 6 | 0 | 7 |
| syntax | 2 | 9 | 1 | 12 |
| discourse | 1 | 3 | 0 | 4 |
| punctuation | 0 | 2 | 1 | 3 |
| register | 2 | 2 | 1 | 5 |
| format | 1 | 3 | 0 | 4 |
| **Total** | **7** | **25** | **3** | **35** |

Keyword search returned far more Simplified than Traditional Chinese posts. That imbalance comes from the live feed, not from a sampling choice, and it limits every zh-TW conclusion below.

## 2. Ten most-named tells (distinct authors)

| Rank | Tell | Distinct authors | Variants among named examples |
|---|---|---:|---|
| 1 | 「不是 A，而是 B」 / "not X, but Y" | 18 | zh-CN and zh-TW |
| 2 | Filler frames: 值得注意的是, 綜上所述, 簡而言之, 首先 | 12 | zh-CN (survey notes both sides use the complaint) |
| 3 | Em dash / 破折號 | 11 | mostly zh-CN; zh-TW posts mainly push back |
| 4 | 翻譯腔 / English syntactic skeleton | 9 | zh-CN and EN |
| 5 | 賦能 / 閉環 / 抓手 (mainland corporate-internet lexicon) | 8 | zh-CN only |
| 6 | Too complete: set-up, packaging, forced elevation; theme spelled out | 8 | zh-CN and zh-TW |
| 7 | Forced 排比 / rule of three | 7 | zh-CN only |
| 8 | Bold, lists, uniform line breaks, heading habit | 7 | zh-CN |
| 9 | 「不僅是 X，更是 Y」 (sibling of #1) | 6 | zh-CN |
| 10 | Too neat, too smooth, too correct | 5 | zh-TW and zh-CN |

Named by fewer authors: 「將」 overuse, dense 被-passives, fake-elevated nouns (底蘊, 維度, 格局) (all zh-CN); monosyllabic verbs such as 拆, 扛 (zh-TW).

Per-variant author counts per tell were not recorded; the last column lists which variants appear among the posts cited for that tell.

## 3. Taiwan vs mainland

- **Shared**: 「不是…而是」, filler transitions, and prose that is "too smooth" or "too complete".
- **zh-TW only**: monosyllabic verb choice, dummy deictics used to pad long sentences, straw-man padding with an invented number, over-polished 「塑膠味」 prose, grant-proposal voice, stories that resolve too neatly.
- **zh-CN only**: mainland corporate-internet lexicon, fake-elevated nouns, 「將」 and 被-passive overuse, English calques, chat-model layout habits (bold, lists, line breaks).

## 4. Pushback recorded

- Humans also write 「不是……而是」; its presence proves nothing.
- Surface tells are the wrong layer: a tuned model avoids them and still sounds generic; stripping them barely changes detector scores.
- The em dash is a weak signal on its own.
- "AI voice" can come from the writer's own template, or from a human who reads a lot of AI text.

## Limitations

- Practitioner opinion, not measurement (evidence grade C). No count here says how often a pattern occurs in AI or human text.
- Search results depend on keywords and on what X surfaced on one day; the sample is not random.
- zh-TW is under-represented (7 of 35 qualifying posts).
- Only 6 posts were verified by hand.
- The posts themselves, their authors, and links to individual posts are not published here: X's terms do not allow redistribution, and the authors did not write for this project.
