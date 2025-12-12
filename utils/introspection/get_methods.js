const path = require("path");
const fs = require("fs");
const SnapIntrospection = require("./snap-introspection.js");

// Load Snap.svg with proper module resolution for eve/mina dependencies
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

const Snap = loadSnap();

/**
 * Extract all introspection data from Snap.svg
 * @returns {Object} Complete introspection data
 */
function extractAll() {
    return SnapIntrospection.extractAll({
        Snap: Snap,
        eve: Snap.eve,
        mina: Snap.mina
    });
}

/**
 * Write introspection data to a JSON file
 * @param {string} outputPath - Path to output file
 * @param {Object} options - Optional formatting options
 */
function writeToJSON(outputPath, options) {
    options = options || {};
    const data = extractAll();
    const json = JSON.stringify(data, null, options.indent || 2);
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`Methods written to ${outputPath}`);
    return data;
}

/**
 * Get all methods from a prototype chain
 * @param {Object} obj - The object to introspect
 * @returns {Array<string>} Sorted array of method names
 */
function getAllMethods(obj) {
    return SnapIntrospection.getAllMethods(obj);
}

/**
 * Get Snap object methods
 * @returns {Array<string>} Sorted array of method names
 */
function getSnapMethods() {
    const data = SnapIntrospection.extractSnapMethods(Snap);
    return data.methods;
}

/**
 * Get methods for a specific class
 * @param {string} className - Name of the class (e.g., 'element', 'paper')
 * @returns {Array<string>} Sorted array of method names
 */
function getClassMethods(className) {
    const classes = Snap.getClass();
    if (!classes || !classes[className.toLowerCase()]) {
        return [];
    }
    const ClassFunc = classes[className.toLowerCase()];
    if (ClassFunc && ClassFunc.prototype) {
        return getAllMethods(ClassFunc.prototype);
    }
    return [];
}

// CLI usage
if (require.main === module) {
    const outputPath = process.argv[2] || path.join(__dirname, 'snap-methods.json');
    console.log('Extracting Snap.svg methods...');
    const data = writeToJSON(outputPath);

    console.log('\nSummary:');
    console.log(`- Snap methods: ${data.snap.count}`);
    console.log(`- Eve methods: ${data.eve.count}`);
    console.log(`- Mina methods: ${data.mina.count} (${data.mina.easingCount} easing)`);
    console.log(`- Classes: ${data.classes.classNames.length}`);
    data.classes.classNames.forEach(className => {
        const classData = data.classes.classes[className];
        console.log(`  - ${classData.displayName}: ${classData.count} methods`);
    });
}

// Exports
module.exports = {
    extractAll,
    writeToJSON,
    getAllMethods,
    getSnapMethods,
    getClassMethods,
    Snap
};

