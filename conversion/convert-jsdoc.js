const fs = require('fs');
const path = require('path');

/**
 * Script to convert old Snap.svg documentation format to proper JSDoc format
 */

function convertDocumentation(content) {
    // Convert /*\ to /**
    content = content.replace(/\/\*\\/g, '/**');
    
    // Convert [ method ] to @method
    content = content.replace(/\s*\[\s*method\s*\]/g, ' @method');
    
    // Convert [ property ] to @property
    content = content.replace(/\s*\[\s*property\s*\]/g, ' @property');
    
    // Convert - paramName (type) description to @param {type} paramName - description
    content = content.replace(/^\s*-\s+(\w+)\s+\(([^)]+)\)\s+(.+)$/gm, ' * @param {$2} $1 - $3');
    
    // Convert - paramName (type) #optional description to @param {type} [paramName] - description
    content = content.replace(/^\s*-\s+(\w+)\s+\(([^)]+)\)\s+#optional\s+(.+)$/gm, ' * @param {$2} [$1] - $3');
    
    // Convert = (type) description to @returns {type} description
    content = content.replace(/^\s*=\s+\(([^)]+)\)\s+(.+)$/gm, ' * @returns {$1} $2');
    
    // Clean up ** double stars
    content = content.replace(/^\s*\*\*\s*$/gm, ' *');
    
    // Convert \*/ to */
    content = content.replace(/\\\*\//g, '*/');
    
    return content;
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const convertedContent = convertDocumentation(content);
        
        if (content !== convertedContent) {
            fs.writeFileSync(filePath, convertedContent, 'utf8');
            console.log(`Converted: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    let totalConverted = 0;
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            totalConverted += processDirectory(filePath);
        } else if (path.extname(file) === '.js') {
            if (processFile(filePath)) {
                totalConverted++;
            }
        }
    }
    
    return totalConverted;
}

// Main execution
const srcPath = path.join(__dirname, 'src');
console.log('Converting JSDoc comments in:', srcPath);
const converted = processDirectory(srcPath);
console.log(`Conversion complete. ${converted} files were modified.`);