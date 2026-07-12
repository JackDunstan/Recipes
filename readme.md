This repository stores each recipe as a standalone Markdown file with YAML frontmatter — one file per recipe, readable directly in Obsidian (or any Markdown editor) and parsed client-side by `index.html` for the web browser.

Every frontmatter value is written as a JSON literal (e.g. `categories: ["Curry", "Lamb"]`, `rating: null`). This is valid YAML flow syntax — Obsidian's Properties panel reads it normally — and it also means the browser-side parser can `JSON.parse()` each value directly with no YAML library.

## 1. For Humans: Understanding the Structure

### **A. Frontmatter (metadata)**
* `recipe_name`: The full title of the dish.
* `rating`: Numerical score (0–5) if available; otherwise `null`.
* `categories`: Array of tags as originally captured (e.g. `["Indian", "Curry"]`).
* `tags`: Lowercase, kebab-cased version of `categories`, for Obsidian's tag pane/graph view.
* `source_file`: The filename of the origin document, if any.
* `date_added`: Year the recipe was added to the library (e.g. `"2025"`).
* `source_url`: Original web URL if present.
* `author`: Source site or author label if present.
* `image`: Relative path to the recipe photo (e.g. `"images/aussie-meat-pie.jpg"`), or `null`.
* `servings`, `prep_time`, `cook_time`, `total_time`: Text as captured from the source.
* `nutrition`: Flat object of nutritional values, keys as originally captured (not standardized — varies per recipe).

### **B. Body (Markdown sections)**
Only sections with content are included; empty ones are omitted entirely.
* `## Description` — optional short description, as a paragraph.
* `## Ingredients` — bullet list (`- item`). A bolded line (`**FOR THE MEAT:**`) marks a sub-heading within the ingredient list (e.g. separating a marinade from the main dish).
* `## Directions` — numbered list (`1. step`).
* `## Notes` — bullet list of tips, substitutions, or chef's secrets.
* `## Storage` — paragraph describing leftover/shelf-life handling.

### Example

```markdown
---
recipe_name: "Aussie Meat Pie"
rating: null
categories: []
tags: []
source_file: "Aussie Meat Pie.html"
date_added: "2025"
source_url: "https://www.bhg.com.au/aussie-meat-pie"
author: "bhg.com.au"
image: null
servings: "Serves 4"
prep_time: "20 minutes"
cook_time: "180 minutes"
total_time: null
nutrition: {}
---

# Aussie Meat Pie

## Ingredients

- 800g diced chuck beef
- ½ cup plain flour
...

## Directions

1. Preheat oven to 200°C. Toss beef in flour...
2. Reduce heat to medium-low and simmer...
```

---

## 2. For AI Tools: Parsing Rules

* Split the file on the first `---\n...\n---\n` block to get frontmatter text and body text.
* Each frontmatter line is `key: value`; `value` is a JSON literal — parse it with `JSON.parse()` (or a JSON-compatible YAML parser). An empty value after the colon means `null`.
* In the body, each `## Heading` starts a new section that runs until the next `## Heading` or end of file. The leading `# Recipe Name` line is the title and can be ignored (it duplicates `recipe_name`).
* Within `## Ingredients`, `## Notes`: strip the leading `- ` from each line to get the item text. A line wrapped in `**...**` (no leading `- `) is a sub-heading within that list, not an ingredient/note itself.
* Within `## Directions`: strip the leading `\d+\. ` from each line to get the step text.
* `## Description` and `## Storage` are plain paragraphs — join non-empty lines with a space.

## 3. Adding or Editing Recipes

New recipes can be added by dropping a new `.md` file (following the schema above) into this folder — either directly, or via Obsidian if this folder is synced as your vault's recipe location — then adding the file's slug (filename minus `.md`) to the `MD_FILES` array in `index.html`.
