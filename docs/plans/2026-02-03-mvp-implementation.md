# Katsuragi MVP Implementation Plan

> **Status:** In Progress (Batch 1 Complete)
> **Created:** 2026-02-03
> **Last Updated:** 2026-02-03

## Overview

Build a text-based UI wireframe generator that converts `.kui` files to SVG/PNG images.

**Architecture:** Parse `.kui` syntax → Calculate grid layout → Generate SVG → Optional PNG conversion via sharp. Pure TypeScript for SVG, minimal native deps.

**Tech Stack:** TypeScript, Node.js, sharp (PNG), Vitest (testing), commander (CLI), Biome (lint/format)

---

## Task Status

| Task | Description | Status |
|------|-------------|--------|
| 1 | Project Setup | ✅ Complete |
| 2 | Type Definitions | ✅ Complete |
| 3 | Cell Reference Parser | ✅ Complete |
| 4 | Lexer/Tokenizer | ⏳ Pending |
| 5 | Parser | ⏳ Pending |
| 6 | Layout Calculator | ⏳ Pending |
| 7 | SVG Generator | ⏳ Pending |
| 8 | PNG Converter | ⏳ Pending |
| 9 | CLI Interface | ⏳ Pending |
| 10 | Example Files & Integration Test | ⏳ Pending |
| 11 | Final Cleanup & Documentation | ⏳ Pending |

---

## Remaining Tasks

### Task 4: Lexer/Tokenizer

**Files:**
- Create: `src/parser/lexer.ts`
- Test: `tests/parser/lexer.test.ts`

**Implementation:**
- TokenType enum (IDENTIFIER, STRING, NUMBER, COLON, COMMA, LBRACE, RBRACE, CELL_REF, CELL_RANGE, RATIO, GRID, NEWLINE, EOF)
- tokenize() function to convert .kui text to token array
- Support: double/single quotes, backtick multi-line strings, comments, cell refs/ranges

### Task 5: Parser

**Files:**
- Create: `src/parser/parser.ts`
- Create: `src/parser/index.ts`
- Test: `tests/parser/parser.test.ts`

**Implementation:**
- parse() function to convert tokens to KuiDocument AST
- Metadata parsing (ratio, grid)
- Component parsing with props
- Cell overlap detection (throw error on overlap)
- Default value application (align: left, style: default)

### Task 6: Layout Calculator

**Files:**
- Create: `src/layout/calculator.ts`
- Create: `src/layout/index.ts`
- Test: `tests/layout/calculator.test.ts`

**Implementation:**
- calculateCanvasSize(ratio) - longest edge fixed at 1280px
- calculateCellRect(range, grid, canvas) - equal division grid layout

### Task 7: SVG Generator

**Files:**
- Create: `src/svg/generator.ts`
- Create: `src/svg/components.ts`
- Create: `src/svg/index.ts`
- Test: `tests/svg/generator.test.ts`

**Implementation:**
- generateSvg(doc) - main SVG generation
- Component renderers: renderTxt, renderBox, renderBtn, renderInput, renderImg
- Style handling: default (gray), primary (black fill), secondary (stroke only)

### Task 8: PNG Converter

**Files:**
- Create: `src/converter/png.ts`
- Create: `src/converter/index.ts`
- Test: `tests/converter/png.test.ts`

**Implementation:**
- convertToPng(svgString) using sharp

### Task 9: CLI Interface

**Files:**
- Create: `src/cli.ts`
- Test: `tests/cli.test.ts`

**Implementation:**
- commander-based CLI
- Input: .kui file path
- Output: SVG to stdout, or file (-o flag)
- Auto-detect PNG from .png extension

### Task 10: Example Files & Integration Test

**Files:**
- Create: `examples/login.kui`
- Create: `examples/dashboard.kui`
- Create: `examples/mobile.kui`
- Test: `tests/integration.test.ts`

### Task 11: Final Cleanup & Documentation

**Files:**
- Update: `src/index.ts` (exports)
- Update: `package.json` (metadata)

**Verification:**
- All tests pass
- Build succeeds
- CLI works with examples

---

## Completed Work Log

### Batch 1 (2026-02-03)

**Commits:**
- `9e099d7` - chore: initialize project with TypeScript, Vitest, Biome
- `6bf23d1` - feat: add core type definitions
- `452e9a3` - feat: add cell reference parser (A1, A1..B2)

**Files Created:**
- `package.json` - Project config with scripts
- `tsconfig.json` - TypeScript config
- `vitest.config.ts` - Vitest config
- `biome.json` - Biome linter/formatter config
- `src/index.ts` - Entry point with VERSION export
- `src/types.ts` - Core type definitions
- `src/parser/cellRef.ts` - Cell reference parser
- `tests/types.test.ts` - Type tests
- `tests/parser/cellRef.test.ts` - Cell ref parser tests

**Test Results:**
- 14 tests passing
- Build successful
