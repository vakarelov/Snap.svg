/**
 * Test script to verify introspection library functionality
 * Run with: node test-introspection.js
 */

const path = require('path');
const { extractAll, getSnapMethods, getClassMethods, Snap } = require('./get_methods.js');

console.log('='.repeat(60));
console.log('Snap.svg Introspection Library Test');
console.log('='.repeat(60));
console.log('');

// Test 1: Extract all data
console.log('Test 1: Extract all data');
console.log('-'.repeat(60));
const data = extractAll();
console.log('✓ Successfully extracted introspection data');
console.log(`  - Snap methods: ${data.snap.count}`);
console.log(`  - Eve methods: ${data.eve.count}`);
console.log(`  - Mina methods: ${data.mina.count}`);
console.log(`  - Mina easing: ${data.mina.easingCount}`);
console.log(`  - Classes: ${data.classes.classNames.length}`);
console.log('');

// Test 2: Get Snap methods
console.log('Test 2: Get Snap methods');
console.log('-'.repeat(60));
const snapMethods = getSnapMethods();
console.log(`✓ Found ${snapMethods.length} Snap methods`);
console.log(`  First 5: ${snapMethods.slice(0, 5).join(', ')}`);
console.log('');

// Test 3: Get class methods
console.log('Test 3: Get class methods for each class');
console.log('-'.repeat(60));
data.classes.classNames.forEach(className => {
    const methods = getClassMethods(className);
    const classData = data.classes.classes[className];
    console.log(`✓ ${classData.displayName}: ${methods.length} methods`);
});
console.log('');

// Test 4: Check Snap filter availability
console.log('Test 4: Check filter availability');
console.log('-'.repeat(60));
if (Snap.filter) {
    const filters = Object.keys(Snap.filter).filter(key => typeof Snap.filter[key] === 'function');
    console.log(`✓ Found ${filters.length} predefined filters`);
    console.log(`  Filters: ${filters.slice(0, 10).join(', ')}...`);

    // Test new filters
    console.log('');
    console.log('  Testing new filters:');

    if (typeof Snap.filter.chromaticAberration === 'function') {
        const ca = Snap.filter.chromaticAberration(2);
        console.log('  ✓ chromaticAberration() - OK');
    }

    if (typeof Snap.filter.vignette === 'function') {
        const v = Snap.filter.vignette(0.5, 0.7);
        console.log('  ✓ vignette() - OK');
    }

    if (typeof Snap.filter.oldFilm === 'function') {
        const of = Snap.filter.oldFilm(0.3, 0.8);
        console.log('  ✓ oldFilm() - OK');
    }

    if (typeof Snap.filter.neon === 'function') {
        const n = Snap.filter.neon('#0ff', 3);
        console.log('  ✓ neon() - OK');
    }
} else {
    console.log('✗ Snap.filter not available');
}
console.log('');

// Test 5: Data structure validation
console.log('Test 5: Data structure validation');
console.log('-'.repeat(60));
let validationPassed = true;

// Check snap structure
if (!data.snap || !Array.isArray(data.snap.methods)) {
    console.log('✗ Snap data structure invalid');
    validationPassed = false;
} else {
    console.log('✓ Snap data structure valid');
}

// Check classes structure
if (!data.classes || !Array.isArray(data.classes.classNames)) {
    console.log('✗ Classes data structure invalid');
    validationPassed = false;
} else {
    console.log('✓ Classes data structure valid');
}

// Check navigation structure
if (!data.navigation || !Array.isArray(data.navigation)) {
    console.log('✗ Navigation data structure invalid');
    validationPassed = false;
} else {
    console.log('✓ Navigation data structure valid');
    console.log(`  Navigation items: ${data.navigation.map(n => n.name).join(', ')}`);
}

// Check timestamp
if (!data.timestamp) {
    console.log('✗ Timestamp missing');
    validationPassed = false;
} else {
    console.log(`✓ Timestamp present: ${data.timestamp}`);
}

console.log('');

// Summary
console.log('='.repeat(60));
if (validationPassed) {
    console.log('✓ All tests passed!');
} else {
    console.log('✗ Some tests failed');
}
console.log('='.repeat(60));

