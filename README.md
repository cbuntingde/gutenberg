# Gutenberg Research Fork

> A WordPress block editor fork addressing data integrity, modern PHP patterns, and save reliability.

---

## Overview

This is a personal research fork of the Gutenberg project focused on data integrity, save reliability, and modernization of the WordPress editor. The fork addresses critical issues where users can lose content silently during save operations, and implements enterprise-grade PHP 8.3+ patterns throughout the codebase.

Key priorities: **Post-save validation**, **modern PHP architecture**, **strict typing**, and **security hardening**.

---

## Requirements

| Requirement     | Minimum    | Recommended   |
| --------------- | ---------- | ------------- |
| Node.js         | 20.19.0    | Latest LTS    |
| npm             | 10.2.3     | Latest        |
| PHP             | 8.3        | 8.3+          |
| WordPress       | 7.0        | Latest stable |
| MySQL / MariaDB | 8.0 / 10.6 | 8.0+ / 10.11+ |
| PHPStan         | Level 8    | Level 9+      |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/cbuntingde/gutenberg.git

# Install dependencies
npm install

# Build the plugin
npm run build

# Start local development environment
npm run wp-env start
```

For full environment setup including Docker configuration, web server settings, and debugging tools, refer to `docs/getting-started/devenv.md`.

---

## Features

### Data Integrity

-   **Post-Save Validation** — Validates content integrity after save operations, detecting and warning users of potential content loss before it becomes critical
-   **REST API Response Analysis** — Comprehensive validation of REST API save responses to ensure server acknowledgment matches client expectations
-   **Silent Loss Detection** — Monitors for conditions that previously led to silent content loss in WordPress 6.9 and later versions

### Modern PHP Architecture

-   **Typed Core** — Full PHP 8.3 strict typing throughout — no `mixed` types, explicit return types on all functions
-   **Prepared Statements** — Enforced prepared statement usage on every database interaction, zero raw query concatenation
-   **Exception-Driven Error Handling** — Replaced `@` suppression patterns with explicit try/catch blocks and typed exceptions
-   **Strict Domain Models** — Value objects for post status, meta fields, and entity references

### Security Hardening

-   **OWASP Compliance** — Input sanitization and output escaping enforced at every boundary layer
-   **CSRF Enforcement** — Nonce validation on all admin form submissions and AJAX handlers
-   **Capability Checks** — Strict capability verification on all content modify operations
-   **Rate Limiting** — Configurable rate limiting on sensitive endpoints

### Performance Optimization

-   **Pattern Pagination** — Patterns loaded in pages of 100 instead of all at once, reducing initial editor load time
-   **Lazy Parsing** — Pattern content parsed on-demand when displayed, not during initial load
-   **LRU Cache** — Bounded cache (500 items max) with LRU eviction prevents memory growth
-   **Parsing Cache** — Cached parsed patterns avoid redundant parse operations on repeated access
-   **Error Resilience** — Graceful fallback when pattern parsing fails, preventing UI crashes

### Code Quality

-   **PHPStan Level 8** — Static analysis passes at Level 8+, zero tolerated errors
-   **PSR-12 Coding Style** — All code enforces PSR-12 formatting via pre-commit hooks
-   **Zero Deprecated Code** — Removed all deprecated and dead code for WordPress 7.0 compatibility (1877 lines deleted)
-   **Modern Patterns** — Match expressions, readonly properties, named arguments where appropriate

### Plugin Compatibility

-   **Spectra Save Button Fix** — Added `clearEntityRecordEdits()` call after successful save to clear dirty state and fix stuck save button
-   **Toolset Types Optimization** — Added warning for taxonomies exceeding 100 terms to prevent performance degradation
-   **ACF Integration** — Restores Custom Fields meta box if removed by ACF or other plugins
-   **Conflict Detection System** — Performance tracking module with plugin conflict detection and reporting
-   **Query Loop Default Mode** — Exposed post count control in Default mode to preserve archive taxonomy context (fixes #73913)

### Error Handling Improvements

-   **HTTP Status Mapping** — Added user-friendly error messages for common HTTP status codes (400, 401, 403, 404, 500, 502, 503, 504)
-   **Timeout Detection** — Added specific handling for request timeout errors with actionable messaging
-   **Session Expiry Handling** — Added messaging for session expiry and nonce invalidation errors
-   **Invalid JSON Recovery** — Added guidance for server configuration issues causing invalid JSON responses

---

## Architecture

### Package Structure

The monorepo follows the standard Gutenberg package structure with modernized PHP components:

| Layer                          | Description                              |
| ------------------------------ | ---------------------------------------- |
| `wp-content/plugins/gutenberg` | Main plugin with modernized PHP handlers |
| `@wordpress/components`        | Reusable UI components                   |
| `@wordpress/block-editor`      | Block editor core                        |
| `@wordpress/data`              | State management with typed selectors    |

### Technology Stack

-   **React** 18.x — UI components
-   **TypeScript** 6.x — Type-safe JavaScript
-   **PHP 8.3** — Modern PHP with strict typing
-   **PHPStan 1.x** — Static analysis
-   **Jest** — Unit testing
-   **Playwright** ��� E2E testing

---

## Development

### Running Tests

```bash
# Unit tests
npm run test:unit

# End-to-end tests
npm run test:e2e

# PHP tests
npm run test:php

# Static analysis
npm run lint:php
```

### Code Quality

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Build documentation
npm run docs:build
```

### Building

```bash
# Production build
npm run build

# Development build with watching
npm run dev
```

---

## Changelog

Changes are organized by feature area. Each entry describes what was changed and why — not when or in what sequence.

---

### Data Integrity

-   **Post-Save Validation** — Added comprehensive validation after save operations to detect content loss scenarios
-   **REST API Response Handling** — Implemented typed response validation ensuring server acknowledgment matches client expectations
-   **Silent Loss Detection** — Added monitoring for conditions that led to silent content loss in WordPress 6.9+

### Performance Optimization

-   **Pattern Pagination** — Limited initial pattern load to 100 items (PATTERN_PAGE_SIZE), preventing blocking on sites with 3000+ patterns
-   **Lazy Parsing** — Deferred expensive parse() call until pattern is actually displayed in the patterns panel
-   **LRU Cache** — Implemented bounded cache with MAX_CACHE_SIZE=500 and LRU eviction to prevent unbounded memory growth
-   **Parsing Cache** — Added parsedPatternCache to avoid re-parsing the same pattern multiple times
-   **Error-Resilient Parsing** — Wrapped parse() in try/catch with graceful fallback to empty array, preventing UI crashes from malformed patterns

### Modern PHP Architecture

-   **Typed Core** — Enforced strict PHP 8.3 typing throughout — explicit return types on all functions, zero `mixed` types
-   **Exception-Driven Error Handling** — Replaced `@` suppression with explicit try/catch and typed exception classes
-   **Prepared Statements** — Enforced prepared statement usage on all database interactions

### Security Infrastructure

-   **OWASP Compliance** — Input sanitization and output escaping enforced at every boundary layer
-   **CSRF Enforcement** — Added consistent nonce validation on all admin form submissions
-   **Capability Checks** — Strict capability verification on all content modify operations

### Code Quality

-   **PHPStan Level 8** — Static analysis configured at Level 8+, blocks merge on any violation
-   **Zero Deprecated Code** — Removed all deprecated and dead code for WordPress 7.0 compatibility (Font Face BC layer, deprecated script modules, deprecated global styles, deprecated Theme JSON methods, deprecated Navigation block code, legacy social link blocks)
-   **Modern Patterns** — Implemented match expressions, readonly properties, named arguments where appropriate

### Error Handling Improvements

-   **HTTP Status Mapping** — Added `getHttpStatusMessage()` function mapping HTTP status codes to user-friendly messages in `packages/api-fetch/src/utils/response.ts`
-   **Timeout Detection** — Added error code detection for `request_timeout` with specific messaging for publishing/scheduling/update operations
-   **Server Error Handling** — Added specific handling for HTTP errors (500, 502, 503, 504) with actionable server error messages
-   **Session Expiry** — Added handling for `rest_cookie_invalid_nonce` error code with session expiry messaging
-   **Invalid JSON Recovery** — Added improved error message for `invalid_json` code with server configuration troubleshooting guidance

### Query Loop Improvements

-   **Default Mode Post Count** — Exposed "Items per page" control in Default (inherit=true) mode; preserves archive taxonomy context via main query vars

### Theme Compatibility

-   **Theme Validation Hook** — Added `useThemeValidation()` hook for detecting theme compatibility issues in `packages/editor/src/hooks/theme-validation.js`
-   **Block Theme Checks** — Validates presence of theme.json in block themes
-   **Theme Support Validation** — Checks for layout, color, spacing, and editor-styles support declarations
-   **Compatibility Utilities** — Added `useBlockThemeCompatibility()` hook providing helpers for both block themes and classic themes

### Long-term Improvements

-   **UX Issue Triage** — Created UX triage process with 8 categories and priority matrix in `docs/ux-triage-process.md`
-   **UX Issue Tracking** — Added `useUXIssueTracker()` hook for tracking and prioritizing UX issues in `packages/editor/src/hooks/use-ux-issue-tracker.js`
-   **Health Checks** — Added `useUXHealthCheck()` hook providing editor health status detection (load, save, performance)
-   **Documentation Standards** — Established consistent documentation format across phases (phase{N}-{area}.md)

---

## Commit Standards

Commits describe completed work, not process or sequence:

```
add post-save validation for content integrity
enforce typed REST API response handlers
replace @-suppressed errors with typed exceptions
remove deprecated extract() calls from meta handlers
```

---

## Branch Strategy

| Branch     | Purpose                                |
| ---------- | -------------------------------------- |
| `main`     | Stable, production-ready code only     |
| `dev`      | Active development, passes CI          |
| `feature/` | Isolated feature work, merged via PR   |
| `hotfix/`  | Critical security or stability patches |

---

## Standards & References

-   [PHP 8.3 Documentation](https://www.php.net/releases/8.3/)
-   [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)
-   [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
-   [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
-   [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
-   [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)

---

## Browser Support

-   Chrome (latest)
-   Firefox (latest)
-   Safari (latest)
-   Edge (latest)

---

## License

GPL-2.0-or-later — same as WordPress. See LICENSE file for full text.

---

_This is an independent research fork. Not affiliated with the WordPress Foundation._
