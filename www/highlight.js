let savedRange = null; // Variable to save the selected range
const storageKey = `highlights_${window.location.pathname}`; // Namespace by document path

// Load saved highlights on document load
document.addEventListener('DOMContentLoaded', () => {
    loadHighlights();
});

// Function to handle the highlighting process
function highlightSelection() {
    if (savedRange) {
        // Create a new span element
        let span = document.createElement('span');
        span.className = 'highlight';
        
        try {
            savedRange.surroundContents(span);
            saveHighlights();
        } catch (error) {
            console.error("Error highlighting text:", error);
        }
    }

    // Monitor touchend events for mobile devices
    document.addEventListener('touchend', function(event) {
        let selection = window.getSelection().toString();  // Check if there is any text selected
        if (selection.length > 0) {
            showCustomMenu(event, true);
        } else {
            closeCustomMenu();
        }
    });
    closeCustomMenu();  // Close the menu
}

function unmarkSelection() {
    isSpan = node => node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'span';
    isHighlightSpan = node => isSpan(node) && node.classList.contains('highlight');

    if (savedRange) {
        let parent = savedRange.commonAncestorContainer;
        if (!isHighlightSpan(parent)) {
            parent = savedRange.commonAncestorContainer.parentElement;
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
    closeCustomMenu();  // Close the menu
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

// Display custom right-click menu and save the selected range
function showCustomMenu(event, isTouch = false) {
    if (!isTouch) {
        event.preventDefault();  // Disable the default right-click menu
    }

    let selection = window.getSelection();
    if (selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0);  // Save the selected range
    }

    let menu = document.getElementById('custom-menu');
    menu.style.display = 'block';
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
}

// Close the custom right-click menu
function closeCustomMenu() {
    let menu = document.getElementById('custom-menu');
    menu.style.display = 'none';
}

// Monitor right-click (contextmenu) events
document.addEventListener('contextmenu', function(event) {
    let selection = window.getSelection().toString();  // Check if there is any text selected
    if (selection.length > 0) {
        showCustomMenu(event, false);
    } else {
        closeCustomMenu();
    }
});

// Close the menu when clicking outside of the custom menu
document.addEventListener('click', function(event) {
    if (event.target.closest('#custom-menu') === null) {
        closeCustomMenu();
    }
});

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
