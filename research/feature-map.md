# editpen feature map v2

> Rows = candidate features from the translationese literature (F01–F26) and the practitioner survey (S177, top tells; D01–D08).
> Status: **measured-AI** (direct corpus measurement comparing AI-generated vs human Chinese) · **measured-translationese** (corpus measurement comparing translated vs original Chinese; supports the hypothesis indirectly, not direct AI evidence) · **replicable** (measured-AI + data public + method clear) · **hypothesis** (direction proposed by literature or practitioners, not measured in any corpus comparison) · **contradicted** (counter-evidence found).
> Evidence references use ledger stable IDs (S001–S197) from `ledger.md`.
> Direction arrows: ↑ more in AI/translated text · ↓ less · ≈ no significant difference · ? unknown direction.
> Variant evidence: zh-CN / zh-TW / both / none = not stated or not variant-specific.

## Feature map

| Feature ID | Feature name | Translationese source | AI-Chinese evidence (stable IDs, direction, variant) | Internal pilot checklist rule | Status | Variant evidence |
|---|---|---|---|---|---|---|
| F01 | Lexical density and content/function ratio | S119 (Laviosa lexical density); S129 (LCMC/ZCTC ratio 1.64 vs 2.08, p<.001); S131 (fewer content, more function words) | S026 ↓ lexical richness in ChatGPT vs human, CTAP 159 features (zh-CN); S001 ↓ density reported (zh-CN); S026 ↓ TTR/richness (zh-CN); S029 ↓ lexical richness in LLM simplification (zh-CN); S018 ↑ repetitive lexical selection (zh-CN); S080 STTR human 41.66 vs DeepSeek 44.32 vs GPT 43.27 (zh-CN, EN output); S073 ↑ TTR with simplification (zh-CN→EN) | none | measured-AI | zh-CN |
| F02 | High-frequency concentration and repetition | S119 (Laviosa high-freq items); S129 (40.47% vs 35.70% token share; repetition 3154 vs 2870) | S026 ↑ high-freq words in ChatGPT (zh-CN); S026 ↑ function words (zh-CN); S031 ↑ high-freq/common words, ↓ OOV in LLM jokes (zh-CN); S018 ↑ word-frequency repetition (zh-CN); S041 ↑ English-influenced vocabulary distribution (zh-CN) | none | measured-AI | zh-CN |
| F03 | Lexical variability / STTR | S119 (STTR method); S129 (STTR not significant overall in LCMC/ZCTC) | S026 ? (CTAP measured but direction unclear from page); S080 STTR human 41.66 vs DeepSeek 44.32 vs GPT 43.27 (translation task, not direct gen); S081 TTR ChatGPT .484 vs human .456 (zh-CN→EN) | none | measured-AI | zh-CN |
| F04 | Mean sentence length and splitting | S129 (difference p=0.17, not significant; genre-sensitive); S119 (sentence splitting evidence) | S027 ↓ ChatGPT max clause count vs human (95% human ≤6 clauses, ChatGPT ≤5); ↓ freq at 1–15 word full sentences (zh-CN); S048 ↓ both translated types simpler than native (zh-CN); S033 mean 26.88 simple vs 28.50 difficult (zh-CN); S036 ↓ human shorter/more vivid (zh-CN); S048 ↓ MDD/MHD both H and o3 vs native (EN→zh-CN); S081 mean SL ChatGPT 14.77 vs human 15.79 (zh-CN→EN) | none | measured-AI | zh-CN |
| F05 | Conjunction/connective frequency and type | S118 (Blum-Kulka explicitation); S121 (optional "that"); S129 (306.42 vs 243.23 per 10K tokens, LL=723, p<.001); S130 (connective type study) | S026 ↑ connectives in ChatGPT (CTAP, zh-CN); S026 ↑ connectives/function words (zh-CN); S076 ↑ adversative conjunctions in MT (zh-CN); S080 connective ratio 4.00% H vs 4.03% DS vs 4.01% GPT (translation, zh-CN→EN); S081 connective density 88.8 GPT vs 100.0 H per 1000 (zh-CN→EN); S070 ↑ function words (EN→zh-CN) | checklist F4 (路標詞密度 ≤3/1000 chars) | measured-AI | zh-CN |
| F06 | Overt 被 passive frequency and semantic range | S129 (LL=69.59, p<.001; more in expository prose); S137 (Yu: 被升為營長, neutral/positive passive); S151 (MDN guide: Chinese predominantly active) | S076 ↑ pronouns and particles in MT (zh-CN, indirect); S177 near-miss: 被字句過密 (a zh-CN practitioner); S041 ↑ English-oriented syntax (zh-CN) | none | measured-translationese | zh-CN |
| F07 | Preposition frequency, semantic subtype, disyllabic preference | S134 (LCMC/ZCTC: ↑ time/place and content/object preps; ↓ means/tools; disyllabic preferred) | no direct AI-Chinese preposition measurement found | none | measured-translationese | none |
| F08 | Personal pronouns, esp. subject and genitive | S132 (↑ all pronoun types in translated literary Chinese; ↑ 他 recurrence); S049 (subject/genitive pronouns most distinctive); S050 (Altaic-source: ↓ pronouns) | S026 ↑ pronouns in ChatGPT (CTAP, zh-CN); S026 ↑ pronouns (zh-CN); S029 ↑ pronoun density in human simplification (zh-CN); S036 human more vivid/complex (zh-CN, indirect); S070 ↑ pronouns (EN→zh-CN); S041 ↑ English pronoun patterns (zh-CN) | checklist F10 (主語零回代失效) | measured-AI | zh-CN |
| F09 | Determiners: 該, 這些, 那些, 任何 | S049 (DP/DT features; 該/這些/那些/任何 prominent in translated text) | no direct AI-Chinese determiner measurement found | none | hypothesis | none |
| F10 | NP modifier 的 and 的 stacking | S049 (DNP/DEG parses; translated text inserts 的 between NPs more); S137 (Yu: 灰暗的凄冷的天空; nested 的); S144 (long attributives annotated) | no direct AI-Chinese 的-frequency measurement found; S041 reports English-oriented syntax structures (zh-CN, indirect) | none | hypothesis | none |
| F11 | Noun repetition across source-language varieties | S050 (Altaic-source: ↑ noun repetition; English-source: fewer; machine learning classification) | no direct AI-Chinese noun repetition measurement found | none | hypothesis | none |
| F12 | Overt conjunction 和 vs list punctuation 、 | S049 (translated text uses 和 for coordination; original Chinese uses 、 or juxtaposition) | no direct AI-Chinese measurement found; S177: practitioners note 「不是A，而是B」uses overt conjunction (zh-CN, indirect) | none | hypothesis | none |
| F13 | Parenthetical source forms and translator notes | S049 (PRN parse structures in translated text) | no direct AI-Chinese parenthetical measurement found | none | hypothesis | none |
| F14 | Verb nominalization | S137 (Yu: 難度很高的技巧, 收入的減少); S144 (annotation: 395 student vs 19 professional, rate 1.48 vs 0.35) | S026 ? CTAP measures syntax complexity (zh-CN, indirect); S041 ↑ nominalized structures (zh-CN, indirect); S001 attributes ↑ nominalization to ChatGPT (zh-CN, number unverified) | checklist F9 (名詞化傾向: 進行/實現/達到 + abstract noun) | measured-translationese | zh-CN |
| F15 | 一 + 量詞 + 名詞 overuse | S144 (annotation: 172 student vs 14 professional, rate 0.64 vs 0.26) | no direct AI-Chinese measurement found | none | measured-translationese | none |
| F16 | Expanded plural suffix 們 | S137 (Yu: unnecessary 們 after collective nouns); S144 (annotation: 61 student vs 13 professional, ≈ not significant) | no direct AI-Chinese 們 measurement found | none | measured-translationese | none |
| F17 | Long prenominal modifiers and attributives | S049 (parse depth, prenominal clauses); S136 (Wang Li: 欧化的长句); S137 (Yu: long relative before head noun); S144 (annotation: 242 student vs 12 professional, rate 0.91 vs 0.22) | S048 ↓ syntactic complexity in translated Chinese vs native (EN→zh-CN); S026 ? parse-tree height human 0.484 vs ChatGPT 0.759 for >14 height (zh-CN); S029 ↓ LLM discourse cohesion (zh-CN, indirect) | none | measured-AI | zh-CN |
| F18 | Judgment/copular 是...的 or English be transfer | S144 (annotation: 139 student vs 15 professional, rate 0.52 vs 0.28) | no direct AI-Chinese 是…的 measurement found | none | measured-translationese | none |
| F19 | Added subjects and overt subject pronouns | S132 (↑ pronoun subjects); S049 (subject pronoun prominence); S136 (Wang Li: increased subjects and copula 是) | see F08 AI evidence (same feature family); checklist F10 covers this | checklist F10 (主語零回代失效) | hypothesis | none |
| F20 | Polysyllabic word creation and disyllabic preference | S134 (disyllabic prepositions preferred in translated Chinese); S136 (Wang Li: polysyllabic words) | S031 ↑ common/high-freq words (may correlate with disyllabic preference, zh-CN, indirect) | none | hypothesis | none |
| F21 | Suffix-like 性/化/度/品/家/者; widened 的/們/着 | S136 (Wang Li: 化/性/度/品/家/者 formations); S137 (Yu: 專業性的字眼) | no direct AI-Chinese suffix measurement found | none | hypothesis | none |
| F22 | Weak verb + abstract noun (進行/作出/予以/加以) | S137 (Yu: 造成…死亡; indirect packaging) | no direct AI-Chinese measurement found | checklist F9 (名詞化傾向, overlapping: 進行+abstract) | hypothesis | none |
| F23 | Tense/aspect marking and imported temporal packaging | S137 (Yu: 已/將/正在; Chinese has no obligatory tense) | S177 near-miss: 將字病 (a zh-CN practitioner) | none | hypothesis | zh-CN |
| F24 | English-like word order, inversion, prenominal vs postnominal | S049 (dependency order); S137 (Yu: long prenominal); S151 (MDN: avoid copying English inversion) | see F17 evidence (overlapping structural concern); S041 ↑ English-oriented structure (zh-CN) | none | hypothesis | none |
| F25 | Semantic prosody and sanitization | S122 (Kenny: conventional collocations); S124 (Mauranen: collocational atypicality) | S031 ↑ neutral sentiment in ChatGPT (zh-CN, indirect); S177: 太正確/太完整 (zh-CN/zh-TW) | none | hypothesis | none |
| F26 | Register levelling / reduced stylistic variance | S116 (Baker: levelling-out); S127 (Redelinghuys: reduced register variation); S129 (convergence = homogeneity) | S028 ↑ formality, ↓ literary quality in LLM prose/fiction (zh-CN); S177 rank 10: 太工整/太流暢/太正確 (zh-CN + zh-TW) | checklist F3 (段落長度過度均勻, paragraph-level uniformity) | measured-AI | zh-CN |
| D01 | Contrastive frames: 不是X而是Y / not-X-but-Y family | S137 (Yu: not a translationese feature per se, but English contrastive calque); translationese hypothesis: F05 conjunctions as a vehicle | S177 rank 1: 18 distinct authors cite this as #1 AI tell (zh-CN + zh-TW); also in the internal pilot checklist, compiled from community lists; no corpus frequency study found | checklist F1 (對比句型家族, 34 variants, 3 precision buckets) + checklist F11 (偽裝式對比, subset) | hypothesis | both |
| D02 | Filler discourse frames: 值得注意的是 / 綜上所述 / 首先…其次…最後 | S129 (↑ simple connective types in translated Chinese); S137 (Yu: structural conjunctions as scaffolding) | S177 rank 2: 12 authors; rank 6: 8 authors (too complete / padded discourse); S028 ↑ errors and machine-translation traces in generated styles (zh-CN); S026 ↑ connectives (zh-CN) | checklist F4 (路標詞密度) + checklist F5 (開頭大帽子) + checklist F6 (結尾強迫升華) | hypothesis | zh-CN |
| D03 | Em dash / 破折號 overuse | S147 (Taiwan punctuation handbook: official inventory, no em dash as standard); S151 (MDN: avoid English punctuation transfer) | S177 rank 3: 11 authors; pushback from zh-TW practitioners: 破折號不是元兇; the internal pilot checklist treats em dash as translationese | checklist punctuation rule (§三 標點: em dash → 。，：（）、) | hypothesis | both |
| D04 | Mainland corporate/internet lexicon: 賦能/閉環/抓手 | not a translationese feature; mainland register vocabulary | S177 rank 5: 8 authors (zh-CN only); no zh-TW practitioners flag this (different register) | checklist V1 (ERROR, 17 terms) + checklist V2 (WARN) + checklist §三 對岸腔 95-term list | hypothesis | zh-CN |
| D05 | Forced parallel / rule of three / 排比 | S129 (not directly; parallel structures are a discourse pattern) | S177 rank 7: 7 authors; rank 9: 6 authors (「不僅是X更是Y」sibling) | checklist F2 (三項排比對稱) | hypothesis | zh-CN |
| D06 | Formatting uniformity: bold, lists, headings, uniform line breaks | not a linguistic feature; formatting/layout | S177 rank 8: 7 authors (zh-CN); no academic measurement | checklist F3 (段落長度均勻, related but not identical) | hypothesis | zh-CN |
| D07 | Concessive overuse: 雖然X但Y | S129 (conjunctions); S137 (Yu: concessive structures) | no direct AI-Chinese concessive frequency measurement found; S177: implicit in filler frame complaints | checklist F7 (讓步句過用, >3/article → WARN) | hypothesis | none |
| D08 | Nested causal chains: 由於A加上B因此C進而D | S049 (syntactic depth); S136 (Wang Li: long sentences) | S026 ↑ parse-tree height in ChatGPT (zh-CN); S041 ↑ English syntactic structure (zh-CN) | checklist F8 (複句嵌套偏好) | hypothesis | zh-CN |
| D09 | Figurative stock verbs: 拆開 (break an idea down) / 接住 (emotional holding) | none; not a translationese feature | S198 maintainer observation (zh-TW, unmeasured; sweep corpus shows no AI excess); S177 near-miss: monosyllabic 拆 (a zh-TW editor) | checklist ban 「重點拆開／拆開來看」 (2026-09-26) | hypothesis | zh-TW |

## Unmapped practitioner tells

These practitioner observations do not map cleanly to a single measurable feature row:

1. **翻譯腔 / English syntactic skeleton** (S177 rank 4, 9 authors): This is the overarching project hypothesis (LLM Chinese carries translationese features), not a single feature. It encompasses F01–F26 collectively. Practitioner phrasings such as "字是中文，骨架是英文" and "譯制片味" describe the aggregate effect, not one measurable axis.

2. **太工整/太流暢/太正確** (S177 rank 10, 5 authors): A meta-observation about uniformity and completeness. Relates to F26 (levelling-out) and checklist F3 (paragraph uniformity) but is broader — it includes semantic completeness and discourse over-resolution. S028 (generated prose too formal, less literary) is the closest measured correlate.

3. **Taiwan-specific tells** (S177, zh-TW practitioners):
   - Disyllabic Taiwan verbs vs AI monosyllables 「拆、扛」 (a zh-TW editor): no feature row covers this; relates to F20 polysyllabic preference but in the opposite direction (AI using *shorter* verbs in zh-TW). Potential new feature axis.
   - Straw-man padding with fake numbers 「遠不只三次」 (a zh-TW editor): discourse-level; no translationese precedent.
   - 「塑膠味」prose and over-polish (zh-TW practitioners): overlaps with F26 / "too smooth."
   - Grant/proposal voice in universities (a zh-TW teacher): register-specific, not a general feature.

4. **Pushback / counter-evidence** (S177): Practitioners note that surface tells (D01, D03, D04) are easily circumvented by prompt tuning. The deeper tells (F26 uniformity, discourse completeness) are harder to fix. This suggests the feature map should weight discourse-level features above lexical tells for robustness.

## Evidence density summary

### Strong evidence (measured-AI, multiple independent search passes)

| Feature | Search passes | Key measured sources |
|---|---|---|
| F01 Lexical density | 4 | S026, S001, S029, S018 |
| F02 High-freq concentration | 3 | S026, S031, S018, S041 |
| F04 Sentence length | 4 | S027, S048, S033, S036 |
| F05 Connectives | 3 | S026, S076, S070 |
| F08 Pronouns | 3 | S026, S029, S041 |
| F17 Long prenominal mod | 2 | S026 (parse height), S048 (MDD/MHD) |

### Moderate evidence (measured-AI, 1–2 search passes)

| Feature | Sources |
|---|---|
| F03 STTR/lexical variability | S080 (translation task only) |
| F26 Register levelling | S028 (formality bias) |

### Measured-translationese only (no direct AI-Chinese measurement)

F06 (S129 被 passive), F07 (S134 prepositions), F14 (S144 nominalization), F15 (S144 一量名), F16 (S144 們, ≈ not significant), F18 (S144 是…的)

### Hypothesis only (no corpus measurement of any kind)

F09, F10, F11, F12, F13, F19, F20, F21, F22, F23, F24, F25, D01, D02, D03, D04, D05, D06, D07, D08, D09

### Key gap

D01 (contrastive frames, 「不是X而是Y」) is the #1 practitioner tell (18 authors across zh-CN and zh-TW) and the flagship rule of the internal pilot checklist (F1, 34 variants), but **no corpus frequency study measures its rate in AI vs human Chinese**. This is the highest-priority target for a corpus measurement.

## Notes

### Pilot checklist F-numbering vs feature-map F-numbering

The internal pilot checklist (2026-04) and this map's translationese inventory (F01–F26) use **independent F-numbering systems**. This table maps between them.

| Checklist rule | Checklist name | Feature map row(s) | Notes |
|---|---|---|---|
| checklist F1 | 對比句型家族 (34 variants) | D01 | Not in the translationese inventory; practitioner + community origin |
| checklist F2 | 三項排比對稱 | D05 | Not in the translationese inventory; discourse/rhetoric pattern |
| checklist F3 | 段落長度過度均勻 | F26, D06 | Related to Baker's levelling-out (S116) |
| checklist F4 | 路標詞密度 | D02, F05 | Overlaps with connective frequency |
| checklist F5 | 開頭大帽子 | D02 | Discourse opener; no translationese precedent |
| checklist F6 | 結尾強迫升華 | D02 | Discourse closer; no translationese precedent |
| checklist F7 | 讓步句過用 | D07 | Concessive structures; minor in translationese lit |
| checklist F8 | 複句嵌套偏好 | D08, F17 | Overlaps with syntactic depth / prenominal length |
| checklist F9 | 名詞化傾向 | F14, F22 | Maps to verb nominalization + weak verbs |
| checklist F10 | 主語零回代失效 | F08, F19 | Maps to pronoun/subject features |
| checklist F11 | 偽裝式對比 | D01 | Subset of checklist F1 contrastive family |
| checklist V1 | ERROR-level vocabulary (17 terms) | D04 | Mainland/AI register; not translationese |
| checklist V2 | WARN-level vocabulary | D04 | Mainland/AI register; not translationese |

### Coverage assessment

- **Checklist rules with translationese foundation**: F4 (connectives → S129), F8/F9/F10 (syntax/nominalization/pronouns → S129/S132/S049/S137/S144). These are the strongest candidates for evidence-graded provenance.
- **Checklist rules without translationese foundation**: F1/F2/F5/F6/F7/F11 (contrastive frames, parallel structures, discourse openers/closers, concessive). These originated from community consensus and vendor/tool evidence (grade B/C). editpen can add a translationese perspective but should not force-fit them into the translationese taxonomy.
- **Translationese features not in the checklist**: F06 (被 passive), F07 (prepositions), F09 (determiners), F10 (的 stacking), F11 (noun repetition), F12 (和 vs 、), F15 (一量名), F16 (們), F20 (polysyllabic preference), F21 (suffixes), F23 (tense/aspect), F25 (semantic prosody). These are candidates for new rules if measured.

### Variant evidence gap

One zh-TW human-vs-LLM study exists (S045, Taiwan economics abstracts vs ChatGPT) but covers a single domain, model, and institution with no public corpus or defined feature inventory. No feature in this map has measured zh-TW evidence from a multi-model, multi-genre controlled study with a public corpus and replicable feature definitions. All "zh-CN" labels come from studies that used Simplified Chinese corpora or did not specify variant. The zh-TW column is populated only by practitioner signal (S177) and the search-bounded finding that no such multi-model zh-TW study was found. This gap is the core motivation for building a zh-TW corpus.
