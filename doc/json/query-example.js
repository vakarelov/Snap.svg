/**
 * Example script to query JSDoc JSON documentation
 * This demonstrates how to find classes, methods, and their comments
 */

const fs = require('fs');
const path = require('path');

// Load the documentation JSON
const docPath = path.join(__dirname, 'documentation.json');
const docs = JSON.parse(fs.readFileSync(docPath, 'utf8'));

/**
 * Find a class by name
 * @param {string} className - The name of the class to find
 * @returns {object|null} The class documentation object or null
 */
function findClass(className) {
    return docs.find(item =>
        item.kind === 'class' &&
        (item.name === className || item.longname === className)
    );
}

/**
 * Find methods of a class
 * @param {string} className - The name of the class
 * @returns {array} Array of method documentation objects
 */
function findClassMethods(className) {
    return docs.filter(item =>
        item.kind === 'function' &&
        item.memberof === className
    );
}

/**
 * Get comment/description for a class or method
 * @param {object} docItem - The documentation item
 * @returns {string} The description/comment
 */
function getComment(docItem) {
    return docItem.description || docItem.comment || 'No documentation available';
}

/**
 * Search for items by name pattern
 * @param {string} pattern - Search pattern (case-insensitive)
 * @returns {array} Array of matching items
 */
function searchByName(pattern) {
    const regex = new RegExp(pattern, 'i');
    return docs.filter(item =>
        regex.test(item.name) || regex.test(item.longname)
    );
}

/**
 * Get all documented classes
 * @returns {array} Array of class documentation objects
 */
function getAllClasses() {
    return docs.filter(item => item.kind === 'class');
}

/**
 * Get all functions/methods
 * @returns {array} Array of function documentation objects
 */
function getAllFunctions() {
    return docs.filter(item => item.kind === 'function');
}

// Example usage:
console.log('=== JSDoc JSON Query Examples ===\n');

// Example 1: Find all classes
console.log('1. All Classes:');
const classes = getAllClasses();
classes.forEach(cls => {
    console.log(`   - ${cls.name || cls.longname}`);
});
console.log('');

// Example 2: Find a specific class
console.log('2. Find "Element" class:');
const elementClass = findClass('Element');
if (elementClass) {
    console.log(`   Found: ${elementClass.longname}`);
    console.log(`   Comment: ${getComment(elementClass).substring(0, 100)}...`);
}
console.log('');

// Example 3: Find methods of a class
console.log('3. Methods of Element class:');
const elementMethods = findClassMethods('Element');
elementMethods.slice(0, 5).forEach(method => {
    console.log(`   - ${method.name}()`);
});
console.log(`   ... and ${elementMethods.length - 5} more methods\n`);

// Example 4: Search by pattern
console.log('4. Search for items containing "animate":');
const animateItems = searchByName('animate');
animateItems.slice(0, 5).forEach(item => {
    console.log(`   - ${item.name} (${item.kind})`);
});
console.log('');

// Export functions for use as a module
module.exports = {
    findClass,
    findClassMethods,
    getComment,
    searchByName,
    getAllClasses,
    getAllFunctions,
    docs
};

