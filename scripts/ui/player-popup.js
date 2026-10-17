/**
 * Player Popup Component
 * Modal shown to players when there are unseen, published patch notes
 */

window.TableFlowPatchNotes = window.TableFlowPatchNotes || {};

window.TableFlowPatchNotes.PlayerPopup = class {
    static POPUP_ID = 'table-flow-patch-notes-popup';

    /**
     * Show the patch notes popup.
     * @param {boolean} markSeen - Whether to record the current version as seen on close (default true)
     */
    static async show(markSeen = true) {
        this.hide();

        const entries = window.TableFlowPatchNotes.Settings.getPublishedEntries();
        if (entries.length === 0) return;

        const title = window.TableFlowPatchNotes.Settings.getPopupTitle();
        const subtitle = window.TableFlowPatchNotes.Settings.getPopupSubtitle();
        const version = window.TableFlowPatchNotes.Settings.getPublishedVersion();

        const enrichedEntries = await Promise.all(
            entries.map(async (entry) => ({
                title: entry.title,
                html: await window.TableFlowPatchNotes.DOMHelpers.enrichHTML(entry.body)
            }))
        );

        const popup = document.createElement('div');
        popup.id = this.POPUP_ID;
        popup.className = 'tfpn-panel tfpn-popup';
        popup.innerHTML = this._generateHTML(title, subtitle, enrichedEntries);

        document.body.appendChild(popup);

        const close = async () => {
            if (markSeen) {
                await window.TableFlowPatchNotes.Settings.setLastSeenVersion(version);
            }
            this.hide();
        };

        popup.querySelector('#tfpn-popup-close')?.addEventListener('click', close);
        popup.querySelector('#tfpn-popup-gotit')?.addEventListener('click', close);
    }

    static hide() {
        window.TableFlowPatchNotes.DOMHelpers.removeElement(this.POPUP_ID);
    }

    static _generateHTML(title, subtitle, entries) {
        const entriesHTML = entries.map(entry => `
            <div class="tfpn-entry-card">
                <div class="tfpn-entry-title">${window.TableFlowPatchNotes.DOMHelpers.escapeHTML(entry.title)}</div>
                <div class="tfpn-entry-body">${entry.html}</div>
            </div>
        `).join('');

        return `
            <div class="tfpn-header">
                <div class="tfpn-header-left">
                    <div class="tfpn-header-icon">
                        <a class="tfpn-logo-link" href="https://tableflowapps.com" target="_blank" rel="noopener noreferrer"><img src="modules/table-flow-patch-notes/TABLEFLOW_LOGO.svg" alt="Table Flow"></a>
                    </div>
                    <div class="tfpn-header-titles">
                        <h2 class="tfpn-header-title">${window.TableFlowPatchNotes.DOMHelpers.escapeHTML(title)}</h2>
                        ${subtitle ? `<p class="tfpn-header-subtitle">${window.TableFlowPatchNotes.DOMHelpers.escapeHTML(subtitle)}</p>` : ''}
                    </div>
                </div>
                <div class="tfpn-header-controls">
                    <button id="tfpn-popup-close" class="tfpn-win-btn close" title="Close">×</button>
                </div>
            </div>
            <div class="tfpn-body">
                ${entriesHTML}
            </div>
            <div class="tfpn-footer">
                <button id="tfpn-popup-gotit" class="tfpn-btn tfpn-btn-primary tfpn-btn-full">Got it!</button>
                <a class="tfpn-footer-brand" href="https://tableflowapps.com" target="_blank" rel="noopener noreferrer">
                    <img class="tfpn-footer-logo" src="modules/table-flow-patch-notes/TABLEFLOW_LOGO.svg" alt="">
                    <span>Table Flow</span>
                </a>
            </div>
        `;
    }
};
