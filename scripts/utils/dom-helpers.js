/**
 * DOM Helper Utilities
 * Reusable DOM manipulation functions
 */

window.TableFlowPatchNotes = window.TableFlowPatchNotes || {};

window.TableFlowPatchNotes.DOMHelpers = class {
    /**
     * Remove element by ID if it exists
     * @param {string} id - Element ID
     */
    static removeElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
            return true;
        }
        return false;
    }

    /**
     * Enrich GM-authored HTML (document links, etc.) using Foundry's TextEditor,
     * falling back to the raw content if enrichment isn't available.
     * @param {string} content
     * @returns {Promise<string>}
     */
    static async enrichHTML(content) {
        try {
            const TextEditorImpl = foundry?.applications?.ux?.TextEditor?.implementation ?? window.TextEditor;
            if (TextEditorImpl?.enrichHTML) {
                return await TextEditorImpl.enrichHTML(content ?? '', { async: true });
            }
        } catch (error) {
            console.warn('Table Flow - Patch Notes | Failed to enrich content:', error);
        }
        return content ?? '';
    }

    /**
     * Escape text for safe insertion into HTML attributes/text nodes.
     * @param {string} value
     */
    static escapeHTML(value) {
        const div = document.createElement('div');
        div.textContent = value ?? '';
        return div.innerHTML;
    }

    /**
     * Make an element draggable via a handle, persisting position to localStorage.
     * A press that never moves beyond the drag threshold is treated as a click.
     * @param {HTMLElement} element - Element to move
     * @param {HTMLElement} handle - Drag handle (mousedown target)
     * @param {string} storageKey - localStorage key for persisted position (or null to skip)
     * @param {Function} onClick - Optional callback invoked when the press was a click, not a drag
     */
    static makeDraggable(element, handle, storageKey, onClick = null) {
        const DRAG_THRESHOLD = 4;
        let pressing = false;
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;

        const onMouseDown = (event) => {
            pressing = true;
            dragging = false;
            startX = event.clientX;
            startY = event.clientY;
            const rect = element.getBoundingClientRect();
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;
            event.preventDefault();
        };

        const onMouseMove = (event) => {
            if (!pressing) return;
            if (!dragging) {
                const movedX = Math.abs(event.clientX - startX);
                const movedY = Math.abs(event.clientY - startY);
                if (movedX < DRAG_THRESHOLD && movedY < DRAG_THRESHOLD) return;
                dragging = true;
            }
            const x = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, event.clientX - offsetX));
            const y = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, event.clientY - offsetY));
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.right = 'auto';
            element.style.transform = 'none';
        };

        const onMouseUp = () => {
            if (!pressing) return;
            pressing = false;
            if (dragging) {
                dragging = false;
                if (storageKey) {
                    localStorage.setItem(storageKey, JSON.stringify({ left: element.style.left, top: element.style.top }));
                }
            } else {
                onClick?.();
            }
        };

        handle.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        if (storageKey) {
            try {
                const saved = JSON.parse(localStorage.getItem(storageKey));
                if (saved?.left && saved?.top) {
                    element.style.left = saved.left;
                    element.style.top = saved.top;
                    element.style.right = 'auto';
                    element.style.transform = 'none';
                }
            } catch (error) {
                // Ignore malformed saved position
            }
        }

        return () => {
            handle.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
};
