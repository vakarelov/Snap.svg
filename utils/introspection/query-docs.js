/**
 * Snap.svg Documentation Reader - Node.js CLI
 *
 * Command-line tool for querying JSDoc documentation
 *
 * Usage:
 *   node query-docs.js --class Element
 *   node query-docs.js --class Element --method attr
 *   node query-docs.js --search "animate"
 */

const fs = require('fs');
const path = require('path');
const SnapDocsReader = require('./snap-docs-reader.js');

// Load documentation from file
function loadDocs() {
    const docPath = path.resolve(__dirname, '../../doc/json/documentation.json');

    if (!fs.existsSync(docPath)) {
        console.error('Error: documentation.json not found at:', docPath);
        console.error('Run "grunt docs:json" to generate it.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(docPath, 'utf8'));
    return SnapDocsReader.load(data);
}

// Format parameter for display
function formatParam(param) {
    let str = param.name;
    if (param.optional) str = `[${str}]`;
    if (param.type && param.type.names) {
        str += `: ${param.type.names.join('|')}`;
    }
    if (param.description) {
        str += ` - ${param.description}`;
    }
    return str;
}

// Display documentation for a class
function displayClass(className, verbose = false) {
    const classDoc = SnapDocsReader.findClass(className);

    if (!classDoc) {
        console.log(`Class "${className}" not found in documentation.`);
        return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Class: ${className}`);
    console.log('='.repeat(60));

    if (classDoc.description) {
        console.log('\nDescription:');
        console.log(classDoc.description);
    }

    if (verbose && classDoc.comment) {
        console.log('\nFull Comment:');
        console.log(classDoc.comment);
    }

    // Show methods
    const methods = SnapDocsReader.findClassMethods(className);
    if (methods.length > 0) {
        console.log(`\nMethods (${methods.length}):`);
        methods.forEach(method => {
            const sig = SnapDocsReader.getSignature(method);
            console.log(`  - ${sig}`);
            if (verbose && method.description) {
                console.log(`    ${method.description}`);
            }
        });
    }
}

// Display documentation for a method
function displayMethod(className, methodName, verbose = false) {
    const methodDoc = SnapDocsReader.findMethod(className, methodName);

    if (!methodDoc) {
        console.log(`Method "${methodName}" not found in class "${className}".`);
        return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`${className}.${methodName}`);
    console.log('='.repeat(60));

    console.log('\nSignature:');
    console.log('  ' + SnapDocsReader.getSignature(methodDoc));

    if (methodDoc.description) {
        console.log('\nDescription:');
        console.log('  ' + methodDoc.description);
    }

    const params = SnapDocsReader.getParams(methodDoc);
    if (params.length > 0) {
        console.log('\nParameters:');
        params.forEach(param => {
            console.log('  - ' + formatParam(param));
        });
    }

    const returns = SnapDocsReader.getReturns(methodDoc);
    if (returns) {
        console.log('\nReturns:');
        if (returns.type && returns.type.names) {
            console.log('  Type: ' + returns.type.names.join('|'));
        }
        if (returns.description) {
            console.log('  ' + returns.description);
        }
    }

    if (verbose && methodDoc.comment) {
        console.log('\nFull JSDoc Comment:');
        console.log(methodDoc.comment);
    }
}

// Search documentation
function displaySearch(query, verbose = false) {
    const results = SnapDocsReader.search(query);

    console.log(`\nSearch results for "${query}": ${results.length} matches\n`);
    console.log('='.repeat(60));

    results.slice(0, 20).forEach(item => {
        console.log(`\n${item.longname || item.name}`);
        console.log(`  Kind: ${item.kind}`);
        if (item.description) {
            const desc = item.description.substring(0, 100);
            console.log(`  ${desc}${item.description.length > 100 ? '...' : ''}`);
        }
        if (verbose) {
            const sig = SnapDocsReader.getSignature(item);
            if (sig) {
                console.log(`  Signature: ${sig}`);
            }
        }
    });

    if (results.length > 20) {
        console.log(`\n... and ${results.length - 20} more results`);
    }
}

// List all classes
function listClasses() {
    const classes = SnapDocsReader.getAllClasses();

    console.log(`\nDocumented Classes (${classes.length}):\n`);
    console.log('='.repeat(60));

    classes.forEach(cls => {
        console.log(`\n${cls.name}`);
        if (cls.description) {
            const desc = cls.description.substring(0, 80);
            console.log(`  ${desc}${cls.description.length > 80 ? '...' : ''}`);
        }
        const methods = SnapDocsReader.findClassMethods(cls.name);
        console.log(`  Methods: ${methods.length}`);
    });
}

// Parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        className: null,
        methodName: null,
        search: null,
        listClasses: false,
        listMethods: false,
        verbose: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--class':
            case '-c':
                options.className = args[++i];
                break;
            case '--method':
            case '-m':
                options.methodName = args[++i];
                break;
            case '--search':
            case '-s':
                options.search = args[++i];
                break;
            case '--list-classes':
                options.listClasses = true;
                break;
            case '--list-methods':
                options.listMethods = true;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
        }
    }

    return options;
}

// Show help message
function showHelp() {
    console.log(`
Snap.svg Documentation Query Tool

Usage:
  node query-docs.js [options]

Options:
  --class, -c <name>       Show documentation for a class
  --method, -m <name>      Show documentation for a method (requires --class)
  --search, -s <query>     Search documentation
  --list-classes           List all documented classes
  --list-methods           List methods of a class (requires --class)
  --verbose, -v            Show verbose output
  --help, -h               Show this help message

Examples:
  node query-docs.js --class Element
  node query-docs.js --class Element --method attr
  node query-docs.js --class Element --list-methods
  node query-docs.js --search "animate"
  node query-docs.js --list-classes
`);
}

// Main execution
function main() {
    const options = parseArgs();

    // Show help if no options
    if (!options.className && !options.search && !options.listClasses) {
        showHelp();
        return;
    }

    // Load documentation
    loadDocs();

    // Execute command
    if (options.listClasses) {
        listClasses();
    } else if (options.search) {
        displaySearch(options.search, options.verbose);
    } else if (options.className) {
        if (options.methodName) {
            displayMethod(options.className, options.methodName, options.verbose);
        } else if (options.listMethods) {
            const methods = SnapDocsReader.findClassMethods(options.className);
            console.log(`\nMethods of ${options.className} (${methods.length}):\n`);
            methods.forEach(method => {
                console.log('  ' + SnapDocsReader.getSignature(method));
            });
        } else {
            displayClass(options.className, options.verbose);
        }
    }

    console.log('');
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for programmatic use
module.exports = {
    loadDocs,
    displayClass,
    displayMethod,
    displaySearch,
    listClasses,
    SnapDocsReader
};

