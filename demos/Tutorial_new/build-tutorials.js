const fs = require('fs');
const path = require('path');

const mdDir = path.join(__dirname, 'MD');
const outputFile = path.join(__dirname, 'tutorials.json');

const tutorials = {
    'Basic': [],
    'Intermediate': [],
    'Advanced': []
};

try {
    const files = fs.readdirSync(mdDir);

    files.forEach(file => {
        if (path.extname(file) === '.MD') {
            const filePath = path.join(mdDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const titleMatch = content.match(/^#\s?(.+)/m);
            const title = titleMatch ? titleMatch[1].trim() : path.basename(file, '.MD');

            const parts = file.replace('.MD', '').split('.');
            const type = parts[0];

            if (tutorials[type]) {
                tutorials[type].push({
                    title: title,
                    file: file,
                    path: `MD/${file}`
                });
            }
        }
    });

    // Sort tutorials by part number
    for (const category in tutorials) {
        tutorials[category].sort((a, b) => {
            const aPart = a.file.split('.')[1].substring(1);
            const bPart = b.file.split('.')[1].substring(1);
            return aPart.localeCompare(bPart, undefined, { numeric: true });
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(tutorials, null, 2));
} catch (err) {
    console.error('Error building tutorials.json:', err);
}
