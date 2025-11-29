---
title: "Documentation Changelog"
description: "Change history for WinMix TipsterHub documentation"
category: "00-meta"
language: "en"
version: "2.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["changelog", "history", "versions"]
---

# Documentation Changelog

All notable changes to the documentation will be documented in this file.

## [2.0.0] - 2025-11-27

### Added
- New 12-category documentation structure
- YAML front-matter to all active documents
- `00-meta/` category with README, CONTRIBUTING, CHANGELOG
- `01-getting-started/` category with Quick Start and Project Overview
- `02-user-guides/` category with comprehensive user documentation
- `03-admin-guides/` category with admin operations guides
- `04-architecture/` category with system architecture docs
- `05-api-reference/` category with API documentation
- `06-database/` category with database and Supabase docs
- `07-security/` category with security implementation guides
- `08-ml-pipeline/` category with ML and model docs
- `09-phases/` category with development phase documentation
- `10-testing/` category with testing strategies
- `11-deployment/` category with operations guides
- `12-development/` category with developer guides
- `archive/` directory for deprecated content

### Changed
- Merged `ADMIN_ACCESS_GUIDE.md` + `ADMIN_SETUP_TAKOSADAM.md` → `03-admin-guides/ADMIN_OVERVIEW_HU.md`
- Consolidated implementation summaries → `08-ml-pipeline/ML_OVERVIEW.md`
- Updated cross-references throughout documentation
- Standardized markdown format across all documents

### Removed
- Duplicate content from `docs/old/` and `docs/docs2/`
- Outdated implementation summaries
- Redundant configuration files

### Archived
- Content from `docs/old/*` → `archive/_archived_2025_11/old/`
- Content from `docs/docs2/*` → `archive/_archived_2025_11/docs2/`
- Deprecated implementation docs

## [1.0.0] - 2024-11

### Initial Release
- Original documentation structure
- 81+ documentation files
- Multiple overlapping directories
- Estimated 35% content duplication

---

**Format:** [Semantic Versioning](https://semver.org/)  
**Maintained by:** Documentation Team
