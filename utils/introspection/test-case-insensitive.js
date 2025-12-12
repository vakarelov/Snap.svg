// Test script to verify case-insensitive class lookup
const SnapDocsReader = require('./snap-docs-reader.js');
const fs = require('fs');

console.log('Loading documentation...');
const docsData = JSON.parse(fs.readFileSync('../../doc/json/documentation.json', 'utf8'));
SnapDocsReader.load(docsData);

console.log('\n=== Testing Case-Insensitive Class Lookup ===\n');

// Test with lowercase (as returned by Snap.getClass())
console.log('1. Testing with lowercase "element":');
const elementLower = SnapDocsReader.findClass('element');
console.log('   Found:', elementLower ? '✓' : '✗');
if (elementLower) {
    console.log('   Name:', elementLower.name);
    console.log('   Longname:', elementLower.longname);
}

// Test with capitalized (as used in JSDoc)
console.log('\n2. Testing with capitalized "Element":');
const elementUpper = SnapDocsReader.findClass('Element');
console.log('   Found:', elementUpper ? '✓' : '✗');
if (elementUpper) {
    console.log('   Name:', elementUpper.name);
    console.log('   Longname:', elementUpper.longname);
}

// Test method lookup with lowercase class name
console.log('\n3. Testing method lookup with lowercase "element":');
const attrLower = SnapDocsReader.findMethod('element', 'attr');
console.log('   element.attr found:', attrLower ? '✓' : '✗');
if (attrLower) {
    console.log('   Longname:', attrLower.longname);
}

// Test method lookup with capitalized class name
console.log('\n4. Testing method lookup with capitalized "Element":');
const attrUpper = SnapDocsReader.findMethod('Element', 'attr');
console.log('   Element.attr found:', attrUpper ? '✓' : '✗');
if (attrUpper) {
    console.log('   Longname:', attrUpper.longname);
}

// Test class members with lowercase
console.log('\n5. Testing class members with lowercase "element":');
const membersLower = SnapDocsReader.findClassMethods('element');
console.log('   Members found:', membersLower.length);

// Test class members with capitalized
console.log('\n6. Testing class members with capitalized "Element":');
const membersUpper = SnapDocsReader.findClassMethods('Element');
console.log('   Members found:', membersUpper.length);

// Test other classes
console.log('\n7. Testing other classes:');
const classes = ['paper', 'Paper', 'fragment', 'Fragment', 'matrix', 'Matrix'];
classes.forEach(className => {
    const classDoc = SnapDocsReader.findClass(className);
    const methods = SnapDocsReader.findClassMethods(className);
    console.log(`   ${className}: ${classDoc ? '✓' : '✗'} class, ${methods.length} methods`);
});

console.log('\n=== Test Complete ===');
console.log('\nExpected Result: Both lowercase and capitalized should find the same documentation');
console.log('Actual Result:',
    (elementLower && elementUpper && elementLower.longname === elementUpper.longname) ? '✓ PASS' : '✗ FAIL');

