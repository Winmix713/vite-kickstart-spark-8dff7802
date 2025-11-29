---
title: "Documentation Contributing Guide"
description: "Guidelines for writing and maintaining WinMix TipsterHub documentation"
category: "00-meta"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["contributing", "guidelines", "documentation"]
---

# Documentation Contributing Guide

## Markdown Template

All documentation files must include YAML front-matter:

```markdown
---
title: "Document Title"
description: "Brief description (max 160 characters)"
category: "02-user-guides"
language: "hu"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
related_docs:
  - "/docs/01-getting-started/QUICK_START.md"
tags: ["tag1", "tag2", "tag3"]
---

# Document Title

> **Summary:** 2-3 sentence introduction explaining document purpose.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Main Content](#main-content)
- [Examples](#examples)
- [Related Documents](#related-documents)

## Prerequisites
- Prerequisite 1
- Prerequisite 2

## Main Content
[Content here]

## Examples
\`\`\`typescript
// Code example
\`\`\`

## Related Documents
- [Related Doc 1](/path/to/doc1.md)
- [Related Doc 2](/path/to/doc2.md)

---

**Last Updated:** 2025-11-27  
**Maintainer:** Team name or person
```

## Writing Guidelines

1. **Language**: Primary Hungarian with English summaries
2. **Structure**: Use consistent heading hierarchy
3. **Code Examples**: Always include working code samples
4. **Cross-References**: Link to related documents
5. **Version Control**: Update `last_updated` field when editing

## Quality Checklist

- [ ] YAML front-matter present and valid
- [ ] Table of contents accurate
- [ ] All internal links working
- [ ] Code examples tested
- [ ] Spelling and grammar checked
- [ ] Related documents linked

## File Naming Conventions

- Use UPPERCASE_WITH_UNDERSCORES.md for major docs
- Use lowercase-with-dashes.md for supplementary docs
- Include language suffix for non-primary language: `_EN.md`, `_HU.md`

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-27
