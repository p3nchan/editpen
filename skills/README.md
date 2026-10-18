# editpen agent skill

`skills/editpen/` is an [Agent Skill](https://agentskills.io/specification). Your agent lints a Chinese draft with editpen, rewrites only the flagged spans, and re-checks until clean. The skill runs `npx -y editpen`, so it needs Node.js 20+.

editpen is built for 繁體中文 (Taiwan), default profile `zh-tw`. 简体中文 (`-p zh`) is partial coverage with fewer rules, so a clean result there means less.

## Install

**Claude Code**

```bash
claude plugin marketplace add p3nchan/editpen
claude plugin install editpen@editpen
```

Inside a session: `/plugin marketplace add p3nchan/editpen`, then `/plugin install editpen@editpen`.

**Codex**

```bash
codex plugin marketplace add p3nchan/editpen
codex plugin add editpen@editpen
```

**Any agent supported by the `skills` CLI** (Claude Code, Codex, and others)

```bash
npx skills add p3nchan/editpen          # this project
npx skills add p3nchan/editpen -g       # all projects
```

**Manual**: copy `skills/editpen/` to `~/.claude/skills/editpen/` (Claude Code) or `~/.agents/skills/editpen/` (Codex).

## Use

Ask in plain words, e.g. 「幫我用 editpen 檢查這篇稿子」 or "edit this Chinese post". In Claude Code you can also call it directly: `/editpen:editpen`.

## Maintainers

The four manifests (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`) are generated from `package.json`. After a version bump run `npm run sync-skill`; `npm test` fails if they are stale.
