# JSDoc JSON Documentation

This directory contains machine-readable JSON documentation generated from the Snap.svg source code.

## Files

- **documentation.json** - Complete JSDoc output in JSON format containing all classes, methods, functions, and their documentation
- **query-example.js** - Example Node.js script demonstrating how to query the JSON documentation

## Generating the Documentation

The JSON documentation is automatically generated when you run:

```bash
grunt
```

Or you can generate just the JSON documentation with:

```bash
grunt docs:json
```

## Using the JSON Documentation

The `documentation.json` file contains an array of documentation objects. Each object represents a code element (class, method, function, etc.) with the following structure:

```javascript
{
  "name": "methodName",
  "longname": "ClassName.methodName",
  "kind": "function",           // or "class", "member", "constant", etc.
  "description": "Method description...",
  "comment": "/** Full JSDoc comment */",
  "memberof": "ClassName",      // Parent class/namespace
  "params": [...],              // Parameter information
  "returns": [...],             // Return value information
  "meta": {                     // Source location metadata
    "filename": "file.js",
    "lineno": 42,
    "path": "..."
  }
}
```

## Query Examples

### Finding a Class

```javascript
const docs = require('./documentation.json');

const elementClass = docs.find(item => 
  item.kind === 'class' && item.name === 'Element'
);
```

### Finding Methods of a Class

```javascript
const methods = docs.filter(item => 
  item.kind === 'function' && 
  item.memberof === 'Element'
);
```

### Getting Comments/Description

```javascript
const method = docs.find(item => 
  item.name === 'animate' && 
  item.memberof === 'Element'
);

console.log(method.description);
console.log(method.comment);
```

### Search by Name Pattern

```javascript
const animateItems = docs.filter(item => 
  /animate/i.test(item.name)
);
```

## Using the Example Script

Run the example query script to see demonstrations:

```bash
node query-example.js
```

Or use it as a module in your own scripts:

```javascript
const docQuery = require('./query-example.js');

// Find a class
const myClass = docQuery.findClass('Element');

// Find methods
const methods = docQuery.findClassMethods('Element');

// Get comment
const comment = docQuery.getComment(myClass);

// Search
const results = docQuery.searchByName('animate');
```

## Common Queries

### Get All Classes

```javascript
const classes = docs.filter(item => item.kind === 'class');
```

### Get All Functions

```javascript
const functions = docs.filter(item => item.kind === 'function');
```

### Get Documented Items Only

```javascript
const documented = docs.filter(item => !item.undocumented);
```

### Get Items by File

```javascript
const itemsInFile = docs.filter(item => 
  item.meta && item.meta.filename === 'element.js'
);
```

## Integration Examples

### Build-time Validation

You can use the JSON documentation to validate your code during the build process:

```javascript
const docs = require('./doc/json/documentation.json');

// Check that all public methods are documented
const undocumented = docs.filter(item => 
  item.kind === 'function' && 
  item.undocumented && 
  !item.name.startsWith('_')
);

if (undocumented.length > 0) {
  console.error('Found undocumented methods:', undocumented);
  process.exit(1);
}
```

### API Documentation Generation

Use the JSON to generate custom documentation formats:

```javascript
const docs = require('./doc/json/documentation.json');

// Generate markdown API reference
const classes = docs.filter(item => item.kind === 'class');

classes.forEach(cls => {
  console.log(`## ${cls.name}\n`);
  console.log(`${cls.description}\n`);
  
  const methods = docs.filter(item => 
    item.kind === 'function' && 
    item.memberof === cls.name
  );
  
  methods.forEach(method => {
    console.log(`### ${method.name}()\n`);
    console.log(`${method.description}\n`);
  });
});
```

### IDE Integration

The JSON format can be consumed by IDEs or code editors to provide:
- Auto-completion
- Inline documentation
- Parameter hints
- Type information

## JSDoc Command Reference

The JSON is generated using:

```bash
jsdoc -X -c djsdoc.config.js -r src > doc/json/documentation.json
```

Where:
- `-X` outputs JSON instead of HTML
- `-c` specifies the configuration file
- `-r` recursively processes directories
- `> doc/json/documentation.json` redirects output to file

## Additional Resources

- [JSDoc Documentation](https://jsdoc.app/)
- [JSDoc -X Flag](https://jsdoc.app/about-commandline.html)
- [Snap.svg Documentation](../reference/index.html)

