# .kui uses half the tokens of HTML with intuitive grid notation

[日本語版](./README.ja.md)

When explaining UI to an LLM, which format is most efficient?

We tested 3 wireframes of different complexity.

## Results by Pattern

### Simple: login
_4x3 grid, 4 components_

| Format | Tokens | vs HTML |
|--------|--------|---------|
| Natural Language | 102 | -69% |
| ASCII Art | 84 | -75% |
| .kui | 120 | -64% |
| HTML | 330 | — |

### Medium: dashboard
_4x3 grid, 6 components_

| Format | Tokens | vs HTML |
|--------|--------|---------|
| Natural Language | 155 | -50% |
| ASCII Art | 142 | -54% |
| .kui | 174 | -44% |
| HTML | 310 | — |

### Complex: ecommerce
_6x5 grid, 12 components, mixed cell sizes_

| Format | Tokens | vs HTML |
|--------|--------|---------|
| Natural Language | 339 | -51% |
| ASCII Art | 248 | -64% |
| .kui | 374 | -46% |
| HTML | 693 | — |

## Summary

| Pattern | .kui | HTML | Savings |
|---------|------|------|---------|
| login | 120 | 330 | -64% |
| dashboard | 174 | 310 | -44% |
| ecommerce | 374 | 693 | -46% |
| **Average** | — | — | **-50%** |

## Why choose .kui?

### 1. Token efficiency
About half the tokens of HTML. Save ~150 tokens per wireframe on average.

### 2. Intuitive grid notation
Excel-style cell references like `A1..D1` make it easy for both LLMs and humans to understand and edit positions.

### 3. Format comparison

| Format | Pros | Cons |
|--------|------|------|
| **.kui** | Precise, editable, intuitive | More tokens than ASCII |
| Natural language | Minimal tokens | Ambiguous interpretation |
| ASCII art | Compact | Breaks when edited |
| HTML | Standard, precise | 2× more tokens |

## How we measured

1. Wrote the same UI in 4 formats
2. Counted tokens using Claude's [Token Counting API](https://docs.anthropic.com/en/docs/build-with-claude/token-counting)

## Reproduce it yourself

```bash
export ANTHROPIC_API_KEY="your-key"
npx ts-node scripts/count-tokens.ts
```

---

**Save tokens. Ship UI faster.**

[→ Get started with Katsuragi](../../README.md)
