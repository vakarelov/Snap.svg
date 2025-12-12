/**
 * Node.js Usage Example
 *
 * This example shows how to use snap-introspection.js in a Node.js environment
 * for automated documentation generation, testing, or analysis.
 */

const fs = require('fs');
const path = require('path');

// Load Snap.svg with proper module resolution
function loadSnap() {
    const Module = require("module");
    const originalLoad = Module._load;

    // Patch module loader for eve/mina dependencies
    Module._load = function patchedLoad(request, parent, isMain) {
        if (request === "eve") {
            return require(path.resolve(__dirname, "../../dist/eve.cjs.js"));
        }
        if (request === "mina") {
            return require(path.resolve(__dirname, "../../dist/mina.cjs.js"));
        }
        return originalLoad(request, parent, isMain);
    };

    try {
        const Snap = require(path.resolve(__dirname, "../../dist/snap.svg.js"));
        return Snap;
    } finally {
        Module._load = originalLoad;
    }
}

// Load Snap.svg
const Snap = loadSnap();

// Load introspection library
const SnapIntrospection = require('../../utils/introspection/snap-introspection.js');

// Example 1: Load and extract
function extractSnapData() {
    const data = SnapIntrospection.extractAll({
        Snap: Snap,
        eve: Snap.eve,
        mina: Snap.mina
    });

    return data;
}

// Example 2: Generate documentation files
function generateDocs(data) {
    const outputDir = './docs';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate JSON
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(path.join(outputDir, 'api-reference.json'), json);

    // Generate Markdown
    let md = '# Snap.svg API Reference\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;

    // Snap methods
    md += `## Snap Object (${data.snap.count} methods)\n\n`;
    data.snap.methods.forEach(method => {
        md += `- \`Snap.${method}()\`\n`;
    });
    md += '\n';

    // Classes
    md += `## Classes\n\n`;
    data.classes.classNames.forEach(className => {
        const classData = data.classes.classes[className];
        md += `### ${classData.displayName}\n\n`;
        md += `${classData.count} methods\n\n`;
        classData.methods.forEach(method => {
            md += `- \`${classData.displayName}.prototype.${method}()\`\n`;
        });
        md += '\n';
    });

    fs.writeFileSync(path.join(outputDir, 'api-reference.md'), md);

    // Generate CSV
    let csv = 'Type,Class,Method,Count\n';
    csv += `Object,Snap,${data.snap.methods.join(';')},${data.snap.count}\n`;

    data.classes.classNames.forEach(className => {
        const classData = data.classes.classes[className];
        csv += `Class,${classData.displayName},${classData.methods.join(';')},${classData.count}\n`;
    });

    fs.writeFileSync(path.join(outputDir, 'api-reference.csv'), csv);

    console.log('Documentation generated in', outputDir);
}

// Example 3: Compare two versions
function compareVersions(data1, data2) {
    const report = {
        added: { snap: [], classes: {} },
        removed: { snap: [], classes: {} },
        unchanged: { snap: [], classes: {} }
    };

    // Compare Snap methods
    data1.snap.methods.forEach(method => {
        if (!data2.snap.methods.includes(method)) {
            report.removed.snap.push(method);
        } else {
            report.unchanged.snap.push(method);
        }
    });

    data2.snap.methods.forEach(method => {
        if (!data1.snap.methods.includes(method)) {
            report.added.snap.push(method);
        }
    });

    // Compare classes
    data1.classes.classNames.forEach(className => {
        const class1 = data1.classes.classes[className];
        const class2 = data2.classes.classes[className];

        if (!class2) {
            report.removed.classes[className] = class1.methods;
            return;
        }

        report.added.classes[className] = [];
        report.removed.classes[className] = [];
        report.unchanged.classes[className] = [];

        class1.methods.forEach(method => {
            if (!class2.methods.includes(method)) {
                report.removed.classes[className].push(method);
            } else {
                report.unchanged.classes[className].push(method);
            }
        });

        class2.methods.forEach(method => {
            if (!class1.methods.includes(method)) {
                report.added.classes[className].push(method);
            }
        });
    });

    return report;
}

// Example 4: Validate API surface
function validateAPI(data, expectedMethods) {
    const missing = [];
    const extra = [];

    expectedMethods.snap.forEach(method => {
        if (!data.snap.methods.includes(method)) {
            missing.push(`Snap.${method}`);
        }
    });

    data.snap.methods.forEach(method => {
        if (!expectedMethods.snap.includes(method)) {
            extra.push(`Snap.${method}`);
        }
    });

    return {
        valid: missing.length === 0,
        missing: missing,
        extra: extra
    };
}

// Example 5: Generate TypeScript definitions (stub)
function generateTypeScriptDefs(data) {
    let dts = '// Snap.svg Type Definitions\n';
    dts += '// Auto-generated\n\n';

    dts += 'declare namespace Snap {\n';
    data.snap.methods.forEach(method => {
        dts += `  function ${method}(...args: any[]): any;\n`;
    });
    dts += '}\n\n';

    data.classes.classNames.forEach(className => {
        const classData = data.classes.classes[className];
        dts += `declare class ${classData.displayName} {\n`;
        classData.methods.forEach(method => {
            dts += `  ${method}(...args: any[]): any;\n`;
        });
        dts += '}\n\n';
    });

    return dts;
}

// Example usage
if (require.main === module) {
    console.log('Snap.svg Introspection - Node.js Examples');
    console.log('==========================================\n');

    console.log('This file contains examples of how to use the introspection library');
    console.log('in a Node.js environment for:');
    console.log('- Automated documentation generation');
    console.log('- API comparison between versions');
    console.log('- API validation/testing');
    console.log('- TypeScript definition generation');
    console.log('\nSee the function implementations for details.');
}

module.exports = {
    extractSnapData,
    generateDocs,
    compareVersions,
    validateAPI,
    generateTypeScriptDefs
};

