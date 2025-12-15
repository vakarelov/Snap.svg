# CodePen Creator & Dev.to Markdown Generator

This Node.js script automates the process of creating CodePen demos from tutorial examples and converting tutorial markdown files for publication on dev.to.

## Features

- ✅ Reads tutorial markdown files from `MD/` folder
- ✅ Extracts `{% codepen %}` tags with file references
- ✅ Reads HTML, JavaScript, and CSS files for each demo
- ✅ Generates CodePen URLs (using placeholder format)
- ✅ Replaces `{% codepen %}` tags with dev.to liquid tags
- ✅ Saves processed markdown to `MD-DEVTO/` folder
- ✅ Only processes files that don't already exist in output folder
- ✅ Detailed progress logging

## Usage

### Run the script:

```bash
node create-codepens.js
```

Or use npm script:

```bash
npm run create-codepens
```

## How It Works

### 1. Input Format (in MD files)

Tutorial markdown files should use this format for demos:

```markdown
{% codepen html="demos/basic-attr.html" js="js/basic-attr.js" css="css/tutorial2.css" %}
```

### 2. Processing

The script will:
1. Check if the file already exists in `MD-DEVTO/` (skip if exists)
2. Extract all `{% codepen %}` tags from the markdown
3. Read the referenced files (HTML, JS, CSS)
4. Generate CodePen URLs (currently placeholder format)
5. Replace tags with dev.to format: `{% codepen https://codepen.io/... %}`

### 3. Output Format (in MD-DEVTO files)

```markdown
{% codepen https://codepen.io/snapsvg/pen/basic-attr %}
```

## Directory Structure

```
Tutorial_new/
├── create-codepens.js          # This script
├── package.json                # NPM configuration
├── MD/                         # Source markdown files
│   ├── Basic.P1.MD
│   └── Basic.P2.MD
├── MD-DEVTO/                   # Output markdown files (auto-created)
│   ├── Basic.P1.MD
│   └── Basic.P2.MD
├── demos/                      # HTML demo files
│   ├── basic-attr.html
│   └── ...
├── js/                         # JavaScript files
│   ├── basic-attr.js
│   └── ...
└── css/                        # CSS files
    ├── tutorial2.css
    └── ...
```

## Configuration

Edit the `CONFIG` object in `create-codepens.js` to customize:

- Directory paths
- CodePen default settings
- API endpoints

## CodePen API Integration

### Current Implementation (Placeholder URLs)

The current version generates placeholder CodePen URLs in the format:
```
https://codepen.io/snapsvg/pen/demo-name
```

### Production Implementation

For production use, integrate with the CodePen API:

1. **Get a CodePen API Key**: Sign up at https://codepen.io/
2. **Use the Prefill API**: https://blog.codepen.io/documentation/api/prefill/

Example integration:

```javascript
const axios = require('axios');

async function createCodepen(demoData) {
  const response = await axios.post('https://codepen.io/api/create', {
    title: demoData.title,
    html: demoData.html,
    css: demoData.css,
    js: demoData.js,
    // ... other settings
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CODEPEN_API_KEY}`
    }
  });
  
  return response.data.url;
}
```

## File Skipping

The script **only processes files that don't already exist** in the `MD-DEVTO/` folder. This means:

- ✅ First run: All files are processed
- ✅ Subsequent runs: Only new files are processed
- ✅ To reprocess a file: Delete it from `MD-DEVTO/` first

## Example Output

```
============================================================
CodePen Creator & Dev.to Markdown Generator
============================================================

Found 2 markdown file(s)

→ Processing Basic.P1.MD...
  Found 5 demo(s)
  ✓ Generated CodePen for: first-shapes
    Files: HTML=demos/first-shapes.html, JS=js/first-shapes.js, CSS=none
  ✓ Generated CodePen for: hierarchy-demo
    Files: HTML=demos/hierarchy-demo.html, JS=js/hierarchy-demo.js, CSS=none
  ...
  ✓ Saved to MD-DEVTO/Basic.P1.MD

→ Processing Basic.P2.MD...
  Found 6 demo(s)
  ✓ Generated CodePen for: basic-attr
    Files: HTML=demos/basic-attr.html, JS=js/basic-attr.js, CSS=none
  ...
  ✓ Saved to MD-DEVTO/Basic.P2.MD

============================================================
Summary:
  Processed: 2
  Skipped:   0
  Errors:    0
============================================================

✓ Processed files saved to: MD-DEVTO

Note: CodePen URLs are placeholder format.
For production use, integrate with CodePen API:
https://blog.codepen.io/documentation/api/prefill/
```

## Troubleshooting

### Files not found

If you see warnings about missing files:
```
Warning: Could not read file demos/demo.html: ENOENT
```

Check that:
- File paths in `{% codepen %}` tags are correct
- Files exist in the specified directories
- Paths are relative to the Tutorial_new folder

### Script doesn't process files

If files are skipped:
- Delete the corresponding file in `MD-DEVTO/` to force reprocessing
- Check file permissions

## Requirements

- Node.js >= 12.0.0
- No external dependencies (uses only Node.js built-ins)

## License

ISC

