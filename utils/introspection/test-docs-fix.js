// Test script to verify the documentation fix
const SnapDocsReader = require('./snap-docs-reader.js');
const fs = require('fs');

console.log('Loading documentation...');
const docsData = JSON.parse(fs.readFileSync('../../doc/json/documentation.json', 'utf8'));
SnapDocsReader.load(docsData);

console.log('\n=== Testing Class Documentation Lookup ===\n');

// Test Element class
console.log('Element class:');
const elementMethods = SnapDocsReader.findClassMethods('Element');
console.log('  Methods found:', elementMethods.length);
if (elementMethods.length > 0) {
    console.log('  Sample methods:');
    elementMethods.slice(0, 5).forEach(m => {
        console.log('    -', m.name);
    });
}

// Test Paper class
console.log('\nPaper class:');
const paperMethods = SnapDocsReader.findClassMethods('Paper');
console.log('  Methods found:', paperMethods.length);
if (paperMethods.length > 0) {
    console.log('  Sample methods:');
    paperMethods.slice(0, 5).forEach(m => {
        console.log('    -', m.name);
    });
}

// Test Fragment class
console.log('\nFragment class:');
const fragmentMethods = SnapDocsReader.findClassMethods('Fragment');
console.log('  Methods found:', fragmentMethods.length);
if (fragmentMethods.length > 0) {
    console.log('  Sample methods:');
    fragmentMethods.slice(0, 5).forEach(m => {
        console.log('    -', m.name);
    });
}

// Test Matrix class
console.log('\nMatrix class:');
const matrixMethods = SnapDocsReader.findClassMethods('Matrix');
console.log('  Methods found:', matrixMethods.length);
if (matrixMethods.length > 0) {
    console.log('  Sample methods:');
    matrixMethods.slice(0, 5).forEach(m => {
        console.log('    -', m.name);
    });
}

// Test Set class
console.log('\nSet class:');
const setMethods = SnapDocsReader.findClassMethods('Set');
console.log('  Methods found:', setMethods.length);
if (setMethods.length > 0) {
    console.log('  Sample methods:');
    setMethods.slice(0, 5).forEach(m => {
        console.log('    -', m.name);
    });
}

// Test specific method lookup
console.log('\n=== Testing Method Documentation Lookup ===\n');

const attrMethod = SnapDocsReader.findMethod('Element', 'attr');
if (attrMethod) {
    console.log('Element.attr found:');
    console.log('  Signature:', SnapDocsReader.getSignature(attrMethod));
    console.log('  Has description:', !!attrMethod.description);
    const params = SnapDocsReader.getParams(attrMethod);
    console.log('  Parameters:', params.length);
} else {
    console.log('Element.attr NOT FOUND');
}

const circleMethod = SnapDocsReader.findMethod('Paper', 'circle');
if (circleMethod) {
    console.log('\nPaper.circle found:');
    console.log('  Signature:', SnapDocsReader.getSignature(circleMethod));
    console.log('  Has description:', !!circleMethod.description);
} else {
    console.log('\nPaper.circle NOT FOUND');
}

console.log('\n=== Test Complete ===');

