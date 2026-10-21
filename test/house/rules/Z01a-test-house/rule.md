---
id: Z01a
slug: test-house
feature: Z01
title: 測試用 house 規則
scope: house
status: hypothesis
detector_validity: untested
kind: pattern
severity:
  default: warn
message: 測試用 house 規則：只在前兩個正文段落抓「測試詞」。
detector:
  engine: regex
  unit: sentence
  patterns:
    - name: test-term
      regex: '測試詞'
  within:
    paragraphs: 2
provenance:
  derived_from: engine test fixture
  author: penchan
evidence:
  - source: S199
    role: support
    grade: C
    claim: Test fixture only; cites an existing ledger entry so check-rules can run
    direction: unknown
    variant: zh-TW
variants: {}
false_positives: []
measurement: null
---

Test-only rule. Not shipped.
