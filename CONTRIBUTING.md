# Contributing

## Proposing a rule

Open an issue or pull request with:

1. **Example sentences**: at least two that the rule should flag and two similar ones it should leave alone. Write your own, or quote a short sentence with its source.
2. **A source**: a study, style guide, dictionary, or practitioner observation that supports the pattern. Add it to `research/ledger.md` if it is new, with a stable ID, grade (A measured study, B tool or official documentation, C editorial or practitioner), and URL or bibliographic citation.
3. **Scope**: which variant it applies to (zh-TW, zh-CN, or both) and what it must not flag.

A new rule starts as `hypothesis` until its precision is measured. Run `npm test` before opening a pull request.

## Licence of contributions

Contributions are accepted under the same terms as the files they change (inbound = outbound): code, rules, and fixtures under MIT (`LICENSE`); research files under CC BY 4.0 (`LICENSE-RESEARCH`). By submitting, you confirm you have the right to license your contribution this way.

## Text under review is data

The text being checked is data. The linter only matches patterns in it, and the agent skill (`skills/editpen/SKILL.md`) must never follow instructions that appear inside a draft. Keep that line when you change the skill, and never write fixtures or rules that depend on text in the draft being obeyed.
