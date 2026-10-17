/**
 * GM Manager Component
 * Panel for writing, saving, and publishing patch note entries
 */

window.TableFlowPatchNotes = window.TableFlowPatchNotes || {};

window.TableFlowPatchNotes.GMManager = class {
    static MANAGER_ID = 'table-flow-patch-notes-manager';
    static HEADER_DIALOG_ID = 'table-flow-patch-notes-header-dialog';
    static LIBRARY_DIALOG_ID = 'table-flow-patch-notes-library-dialog';
    static _editingId = null; // null = not editing, '' = new entry, otherwise entry id
    static _selectedIds = null; // entries ticked for preview/publish; lazily seeded from the published set

    static show() {
        window.TableFlowPatchNotes.DOMHelpers.removeElement(this.MANAGER_ID);

        const manager = document.createElement('div');
        manager.id = this.MANAGER_ID;
        manager.className = 'tfpn-panel tfpn-manager';
        manager.innerHTML = this._generateHTML();

        document.body.appendChild(manager);
        this._attachEventListeners();

        if (document.getElementById(this.LIBRARY_DIALOG_ID)) this._renderLibraryList();
    }

    static hide() {
        this._editingId = null;
        this._selectedIds = null;
        this._hideHeaderDialog();
        this._hideLibraryDialog();
        window.TableFlowPatchNotes.DOMHelpers.removeElement(this.MANAGER_ID);
    }

    static _getSelectedIds() {
        this._selectedIds ??= new Set(window.TableFlowPatchNotes.Settings.getPublishedIds());
        return this._selectedIds;
    }

    static _generateHTML() {
        const Settings = window.TableFlowPatchNotes.Settings;
        const entries = Settings.getLibrary();

        return `
            <div class="tfpn-header" id="tfpn-manager-drag-handle">
                <div class="tfpn-header-left">
                    <div class="tfpn-header-icon">
                        <a class="tfpn-logo-link" href="https://tableflowapps.com" target="_blank" rel="noopener noreferrer"><img src="modules/table-flow-patch-notes/TABLEFLOW_LOGO.svg" alt="Table Flow"></a>
                    </div>
                    <div class="tfpn-header-titles">
                        <h2 class="tfpn-header-title">Patch Notes</h2>
                        <p class="tfpn-header-subtitle">Write updates and publish them to your players</p>
                    </div>
                </div>
                <div class="tfpn-header-controls">
                    <button id="tfpn-manager-close" class="tfpn-win-btn close" title="Close">×</button>
                </div>
            </div>
            <div class="tfpn-body">
                <div class="tfpn-section">
                    <div class="tfpn-section-header">
                        <div class="tfpn-section-title-wrap"><i class="fas fa-heading" aria-hidden="true"></i>Popup Header</div>
                        <button id="tfpn-popup-header-edit" class="tfpn-icon-btn" title="Edit popup header"><i class="fas fa-pen" aria-hidden="true"></i></button>
                    </div>
                </div>

                ${this._generateEditorHTML(entries)}
            </div>
            <div class="tfpn-footer">
                <div class="tfpn-btn-row">
                    <button id="tfpn-preview" class="tfpn-btn tfpn-btn-slate">Preview</button>
                    <button id="tfpn-publish" class="tfpn-btn tfpn-btn-primary">Publish</button>
                </div>
            </div>
        `;
    }

    static _generateEditorHTML(entries) {
        const entry = this._editingId ? entries.find(e => e.id === this._editingId) : null;

        return `
            <div class="tfpn-section" id="tfpn-editor-section">
                <div class="tfpn-section-header">
                    <div class="tfpn-section-title-wrap"><i class="fas fa-pen" aria-hidden="true"></i>${entry ? 'Edit Entry' : 'New Entry'}</div>
                </div>
                <div class="tfpn-editor-row">
                    <div class="tfpn-editor-fields">
                        <input type="text" id="tfpn-editor-title" class="tfpn-input" placeholder="Entry title" value="${window.TableFlowPatchNotes.DOMHelpers.escapeHTML(entry?.title ?? '')}">
                        <textarea id="tfpn-editor-body" class="tfpn-textarea" placeholder="What's new? Basic HTML is supported.">${window.TableFlowPatchNotes.DOMHelpers.escapeHTML(entry?.body ?? '')}</textarea>
                    </div>
                    <div class="tfpn-editor-actions">
                        <button id="tfpn-editor-save" class="tfpn-btn tfpn-btn-primary">${entry ? 'Save Changes' : 'Save to Library'}</button>
                        <button id="tfpn-library-open" class="tfpn-btn tfpn-btn-slate"><i class="fas fa-scroll" aria-hidden="true"></i> Library (${entries.length})</button>
                        ${entry ? '<button id="tfpn-editor-cancel" class="tfpn-btn tfpn-btn-slate">Cancel</button>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    static _attachEventListeners() {
        document.getElementById('tfpn-manager-close')?.addEventListener('click', () => this.hide());

        document.getElementById('tfpn-popup-header-edit')?.addEventListener('click', () => this._showHeaderDialog());

        document.querySelector('#tfpn-library-open')?.addEventListener('click', () => this._showLibraryDialog());

        document.getElementById('tfpn-editor-cancel')?.addEventListener('click', () => {
            this._editingId = null;
            this.show();
        });

        document.getElementById('tfpn-editor-save')?.addEventListener('click', async () => {
            const { title, body } = this._readEditor();

            if (!title.trim() && !body.trim()) {
                ui.notifications.warn('Enter a title or some text before saving.');
                return;
            }

            if (this._editingId) {
                await window.TableFlowPatchNotes.Settings.updateEntry(this._editingId, { title, body });
            } else {
                await window.TableFlowPatchNotes.Settings.addEntry(title, body);
            }

            this._editingId = null;
            this.show();
        });

        document.getElementById('tfpn-preview')?.addEventListener('click', async () => {
            const { title, body } = this._readEditor();
            if (!title.trim() && !body.trim()) {
                ui.notifications.warn('Enter a title or some text to preview.');
                return;
            }
            await this._showPreview([{ title: title.trim() || 'Untitled Entry', body }]);
        });

        // Publishes the entry input; it is saved to the library first so it can be re-published later
        document.getElementById('tfpn-publish')?.addEventListener('click', async () => {
            const { title, body } = this._readEditor();
            if (!title.trim() && !body.trim()) {
                ui.notifications.warn('Enter a title or some text to publish.');
                return;
            }

            const Settings = window.TableFlowPatchNotes.Settings;
            let entryId = this._editingId;
            if (entryId) {
                await Settings.updateEntry(entryId, { title, body });
            } else {
                entryId = (await Settings.addEntry(title, body)).id;
            }

            await this._publish([entryId]);

            this._editingId = null;
            this._selectedIds = null;
            this.show();
        });

        window.TableFlowPatchNotes.DOMHelpers.makeDraggable(
            document.getElementById(this.MANAGER_ID),
            document.getElementById('tfpn-manager-drag-handle'),
            null
        );
    }

    static _hideHeaderDialog() {
        window.TableFlowPatchNotes.DOMHelpers.removeElement(this.HEADER_DIALOG_ID);
    }

    static _showHeaderDialog() {
        const { Settings, DOMHelpers } = window.TableFlowPatchNotes;
        this._hideHeaderDialog();

        const dialog = document.createElement('div');
        dialog.id = this.HEADER_DIALOG_ID;
        dialog.className = 'tfpn-panel tfpn-dialog';
        dialog.innerHTML = `
            <div class="tfpn-header" id="tfpn-header-dialog-drag-handle">
                <div class="tfpn-header-titles">
                    <h2 class="tfpn-header-title">Popup Header</h2>
                </div>
                <div class="tfpn-header-controls">
                    <button id="tfpn-header-dialog-close" class="tfpn-win-btn close" title="Close">×</button>
                </div>
            </div>
            <div class="tfpn-body">
                <input type="text" id="tfpn-popup-title-input" class="tfpn-input" placeholder="Popup title" value="${DOMHelpers.escapeHTML(Settings.getPopupTitle())}">
                <input type="text" id="tfpn-popup-subtitle-input" class="tfpn-input" placeholder="Popup subtitle (optional)" value="${DOMHelpers.escapeHTML(Settings.getPopupSubtitle())}">
            </div>
            <div class="tfpn-footer">
                <div class="tfpn-btn-row">
                    <button id="tfpn-header-dialog-cancel" class="tfpn-btn tfpn-btn-slate">Cancel</button>
                    <button id="tfpn-header-dialog-save" class="tfpn-btn tfpn-btn-primary">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        const close = () => this._hideHeaderDialog();
        dialog.querySelector('#tfpn-header-dialog-close').addEventListener('click', close);
        dialog.querySelector('#tfpn-header-dialog-cancel').addEventListener('click', close);
        dialog.querySelector('#tfpn-header-dialog-save').addEventListener('click', async () => {
            const title = dialog.querySelector('#tfpn-popup-title-input').value;
            const subtitle = dialog.querySelector('#tfpn-popup-subtitle-input').value;
            await Settings.setPopupText(title, subtitle);
            close();
        });

        DOMHelpers.makeDraggable(dialog, dialog.querySelector('#tfpn-header-dialog-drag-handle'), null);
        dialog.querySelector('#tfpn-popup-title-input').focus();
    }

    static _readEditor() {
        return {
            title: document.getElementById('tfpn-editor-title')?.value ?? '',
            body: document.getElementById('tfpn-editor-body')?.value ?? ''
        };
    }

    static async _publish(ids) {
        await window.TableFlowPatchNotes.Settings.publish(ids);
        window.TableFlowPatchNotes.SocketHandler.emitPublish();
        ui.notifications.info('Patch notes published to players.');
    }

    static _hideLibraryDialog() {
        window.TableFlowPatchNotes.DOMHelpers.removeElement(this.LIBRARY_DIALOG_ID);
    }

    static _showLibraryDialog() {
        const { DOMHelpers } = window.TableFlowPatchNotes;
        this._hideLibraryDialog();

        const dialog = document.createElement('div');
        dialog.id = this.LIBRARY_DIALOG_ID;
        dialog.className = 'tfpn-panel tfpn-dialog';
        dialog.innerHTML = `
            <div class="tfpn-header" id="tfpn-library-dialog-drag-handle">
                <div class="tfpn-header-titles">
                    <h2 class="tfpn-header-title">Library</h2>
                    <p class="tfpn-header-subtitle">Tick the entries to preview or publish</p>
                </div>
                <div class="tfpn-header-controls">
                    <button id="tfpn-library-dialog-close" class="tfpn-win-btn close" title="Close">×</button>
                </div>
            </div>
            <div class="tfpn-body">
                <div class="tfpn-entry-list" id="tfpn-library-list"></div>
            </div>
            <div class="tfpn-footer">
                <button id="tfpn-library-publish" class="tfpn-btn tfpn-btn-primary tfpn-btn-full">Publish Selected</button>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#tfpn-library-dialog-close').addEventListener('click', () => this._hideLibraryDialog());
        dialog.querySelector('#tfpn-library-publish').addEventListener('click', async () => {
            const checkedIds = this._getCheckedIds();
            if (checkedIds.length === 0) {
                ui.notifications.warn('Select at least one entry to publish.');
                return;
            }
            await this._publish(checkedIds);
        });
        DOMHelpers.makeDraggable(dialog, dialog.querySelector('#tfpn-library-dialog-drag-handle'), null);
        this._renderLibraryList();
    }

    static _renderLibraryList() {
        const list = document.getElementById('tfpn-library-list');
        if (!list) return;

        const { Settings, DOMHelpers } = window.TableFlowPatchNotes;
        const entries = Settings.getLibrary();
        const selected = this._getSelectedIds();

        if (entries.length === 0) {
            list.innerHTML = '<div class="tfpn-tip-box">No patch notes yet. Save one to the library to get started.</div>';
            return;
        }

        list.innerHTML = entries.slice().reverse().map(entry => `
            <div class="tfpn-list-row" data-id="${entry.id}">
                <label class="tfpn-checkbox-row">
                    <input type="checkbox" class="tfpn-entry-check" data-id="${entry.id}" ${selected.has(entry.id) ? 'checked' : ''}>
                    <span class="tfpn-list-row-title">${DOMHelpers.escapeHTML(entry.title)}</span>
                </label>
                <div class="tfpn-list-row-actions">
                    <button class="tfpn-icon-btn tfpn-entry-edit" data-id="${entry.id}" title="Edit"><i class="fas fa-pen" aria-hidden="true"></i></button>
                    <button class="tfpn-icon-btn tfpn-entry-delete" data-id="${entry.id}" title="Delete"><i class="fas fa-trash" aria-hidden="true"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.tfpn-entry-check').forEach(box => {
            box.addEventListener('change', () => {
                if (box.checked) selected.add(box.dataset.id);
                else selected.delete(box.dataset.id);
            });
        });

        list.querySelectorAll('.tfpn-entry-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                this._editingId = btn.dataset.id;
                this._hideLibraryDialog();
                this.show();
            });
        });

        list.querySelectorAll('.tfpn-entry-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this patch note entry?')) return;
                await Settings.deleteEntry(btn.dataset.id);
                selected.delete(btn.dataset.id);
                if (this._editingId === btn.dataset.id) {
                    this._editingId = null;
                    this._hideLibraryDialog();
                    this.show();
                    return;
                }
                // Update in place so text typed into the entry editor isn't lost
                const count = document.getElementById('tfpn-library-open');
                if (count) count.innerHTML = `<i class="fas fa-scroll" aria-hidden="true"></i> Library (${Settings.getLibrary().length})`;
                this._renderLibraryList();
            });
        });
    }

    static _getCheckedIds() {
        const selected = this._getSelectedIds();
        return window.TableFlowPatchNotes.Settings.getLibrary()
            .slice().reverse()
            .filter(entry => selected.has(entry.id))
            .map(entry => entry.id);
    }

    static async _showPreview(entries) {
        const titleInput = window.TableFlowPatchNotes.Settings.getPopupTitle();
        const subtitleInput = window.TableFlowPatchNotes.Settings.getPopupSubtitle();

        const enrichedEntries = await Promise.all(
            entries.map(async (entry) => ({
                title: entry.title,
                html: await window.TableFlowPatchNotes.DOMHelpers.enrichHTML(entry.body)
            }))
        );

        window.TableFlowPatchNotes.DOMHelpers.removeElement('table-flow-patch-notes-preview');

        const preview = document.createElement('div');
        preview.id = 'table-flow-patch-notes-preview';
        preview.className = 'tfpn-panel tfpn-popup';
        preview.innerHTML = window.TableFlowPatchNotes.PlayerPopup._generateHTML(titleInput, subtitleInput, enrichedEntries);
        document.body.appendChild(preview);

        const close = () => preview.remove();
        preview.querySelector('#tfpn-popup-close')?.addEventListener('click', close);
        preview.querySelector('#tfpn-popup-gotit')?.addEventListener('click', close);
    }
};
