document.addEventListener('DOMContentLoaded', async () => {
    const menu = document.getElementById('menu');
    const content = document.getElementById('content');
    let tutorials;

    try {
        const response = await fetch('tutorials.json');
        tutorials = await response.json();
    } catch (error) {
        console.error('Error fetching tutorials:', error);
        content.innerHTML = '<p>Error loading tutorials. Please run the build script.</p>';
        return;
    }

    function renderMenu() {
        let menuHTML = '';
        for (const category in tutorials) {
            menuHTML += `<h3>${category}</h3>`;
            menuHTML += '<ul>';
            tutorials[category].forEach(tutorial => {
                menuHTML += `<li><a href="#" data-path="${tutorial.path}">${tutorial.title}</a></li>`;
            });
            menuHTML += '</ul>';
        }
        menu.innerHTML = menuHTML;
    }

    async function loadTutorial(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let text = await response.text();

            const md = window.markdownit({
                highlight: function (str, lang) {
                    if (lang) {
                        try {
                            return hljs.highlight(str, {language: lang}).value;
                        } catch (e) {
                            console.error('Highlight error for', lang, ':', e);
                        }
                    }
                    return '';
                }
            });

            // Render markdown
            let html = md.render(text);

            // Replace codepen tags BEFORE setting innerHTML
            html = html.replace(/{% codepen (.*?) %}/g, (match, url) => {
                const embedUrl = url.replace('/pen/', '/embed/');
                return `<iframe class="codepen" scrolling="no" src="${embedUrl}" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>`;
            });

            // Set the content
            content.innerHTML = html;

            // Add hljs class to all pre elements
            document.querySelectorAll('#content pre code').forEach((block) => {
                block.parentElement.classList.add('hljs');
            });

            const urlRegex = /(https?:\/\/[^\s<]+)/g;
            const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);

            let nodes = [];
            let node;
            while (node = walker.nextNode()) {
                nodes.push(node);
            }

            nodes.forEach(node => {
                if (node.parentElement.tagName === 'A') {
                    return;
                }

                const text = node.nodeValue;
                const parts = text.split(urlRegex);

                if (parts.length > 1) {
                    const fragment = document.createDocumentFragment();
                    for (let i = 0; i < parts.length; i++) {
                        if (i % 2 === 0) {
                            if (parts[i]) {
                                fragment.appendChild(document.createTextNode(parts[i]));
                            }
                        } else {
                            const a = document.createElement('a');
                            a.href = parts[i];
                            a.target = '_blank';
                            a.textContent = parts[i];
                            fragment.appendChild(a);
                        }
                    }
                    node.parentNode.replaceChild(fragment, node);
                }
            });


        } catch (error) {
            content.innerHTML = `<p>Error loading tutorial: ${error.message}</p>`;
        }
    }

    menu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const path = e.target.dataset.path;
            loadTutorial(path);
        }
    });

    renderMenu();
    // Load the first tutorial by default
    if (tutorials.Basic.length > 0) {
        loadTutorial(tutorials.Basic[0].path);
    }
});
