const storageKey = `highlights_${window.location.pathname}`; // Namespace by document path

const scrollPositionKey = `scrollPosition_${window.location.pathname}`;

// Load saved highlights and scroll position on document load
document.addEventListener('DOMContentLoaded', () => {
    loadHighlights();
    const savedScrollPosition = localStorage.getItem(scrollPositionKey);
    if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition, 10));
    }
});

// Save scroll position when the page is hidden
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        localStorage.setItem(scrollPositionKey, window.scrollY);
    }
});

// Function to handle the highlighting process
function highlightSelection() {
    let selection = window.getSelection();
    if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);  // Save the selected range
        // Create a new span element
        let span = document.createElement('span');
        span.className = 'highlight';
        
        try {
            range.surroundContents(span);
            saveHighlights();
        } catch (error) {
            console.error("Error highlighting text:", error);
        }
    }
}

function unmarkSelection() {
    isSpan = node => node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'span';
    isHighlightSpan = node => isSpan(node) && node.classList.contains('highlight');

    let selection = window.getSelection();
    if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);  // Save the selected range
        let parent = range.commonAncestorContainer;
        if (!isHighlightSpan(parent)) {
            parent = range.commonAncestorContainer.parentElement;
            if (!isHighlightSpan(parent)) {
                return;
            }
        }
        parent.classList.remove('highlight');

        let grandParent = parent.parentNode;
        let children = Array.from(grandParent.childNodes);
        let newContent = document.createDocumentFragment();
        let previousNode = null;

        children.forEach(child => {
            if (isSpan(child) && child.classList.length === 0) {
                // If the child is an empty span, merge its first text with the previous text node
                firstIndex = 0
                if (child.firstChild.nodeType === Node.TEXT_NODE) {
                    if (previousNode && previousNode.nodeType === Node.TEXT_NODE) {
                        previousNode.textContent += child.firstChild.textContent;
                        firstIndex = 1;
                    }
                }
                for (let i = firstIndex; i < child.childNodes.length; i++) {
                    newContent.appendChild(child.childNodes[i]);
                    previousNode = child.childNodes[i];
                }
            } else if (child.nodeType === Node.TEXT_NODE) {
                // If the child is a text node, merge it with the previous text node if possible
                if (previousNode && previousNode.nodeType === Node.TEXT_NODE) {
                    previousNode.textContent += child.textContent;
                } else {
                    newContent.appendChild(child);
                    previousNode = child;
                }
            } else {
                // Otherwise, just append the node
                newContent.appendChild(child);
                previousNode = child;
            }
        });

        while (grandParent.firstChild) {
            grandParent.removeChild(grandParent.firstChild);
        }
        grandParent.appendChild(newContent);

        saveHighlights();
    }
}

// Save highlights to local storage
function saveHighlights() {
    let highlights = document.querySelectorAll('.highlight');
    let highlightData = Array.from(highlights).map(span => {
        let range = document.createRange();
        range.selectNodeContents(span);
        return span.textContent;
    });
    localStorage.setItem(storageKey, JSON.stringify(highlightData));
}

// Load highlights from local storage
function loadHighlights() {
    let highlightTexts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    highlightTexts.forEach(text => {
        let content = document.body.innerHTML;
        let highlightedContent = content.replace(new RegExp(`(${text})`, 'g'), '<span class="highlight">$1</span>');
        document.body.innerHTML = highlightedContent;
    });
    saveHighlights();
}

function exportMarkedText() {
    let highlights = document.querySelectorAll('.highlight');
    if (highlights.length === 0) {
        alert('No highlighted text to export.');
        return;
    }

    let extractedText = ''
    for (let i = 0; i < highlights.length; i++) {
        // Replace <br> with newline
        extractedText += highlights[i].innerHTML.replace(/<br>/g, '\n') + '\n';
    }

    // Create a Blob from the bulleted list
    let blob = new Blob([extractedText], { type: 'text/plain' });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'highlighted_text.txt';

    // Trigger the download
    link.click();
}
