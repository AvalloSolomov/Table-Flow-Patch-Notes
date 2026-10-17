/**
 * Floating Button Component
 * GM opens the manager; players can reopen the last published notes
 */

window.TableFlowPatchNotes = window.TableFlowPatchNotes || {};

window.TableFlowPatchNotes.FloatingButton = class {
    static BUTTON_ID = 'table-flow-patch-notes-button';
    static STORAGE_KEY = 'table-flow-patch-notes-button-position';
    static ATTACH_GAP = 8;
    static INTERMISSION_BUTTON_IDS = ['gm-ready-check-button', 'gm-break-button'];
    static button = null;
    static _dragCleanup = null;
    static _attachFrame = null;
    static _attached = false;

    static create() {
        if (this.button) {
            console.warn('Table Flow - Patch Notes | Button already exists');
            return;
        }

        try {
            this.button = document.createElement('div');
            this.button.id = this.BUTTON_ID;
            this.button.className = 'tfpn-floating-button';
            this.button.title = game.user.isGM ? 'Manage Patch Notes' : 'View Patch Notes';
            this.button.innerHTML = '<i class="fas fa-scroll" aria-hidden="true"></i>';

            // Inline styles so the button renders correctly even if the stylesheet fails to load
            // Bottom-right by default: table-flow-intermission's button already owns top-right (20px/20px)
            Object.assign(this.button.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '10000',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d2b27e',
                background: '#121212',
                border: '1px solid #d2b27e',
                borderRadius: '4px',
                fontSize: '20px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            });

            document.body.appendChild(this.button);

            this._startAttachWatcher();

            this.updateState();
        } catch (error) {
            console.error('Table Flow - Patch Notes | Failed to create floating button:', error);
        }
    }

    /**
     * Find the lowest-sitting table-flow-intermission button, if that module is active and
     * one of its buttons is currently in the DOM.
     * @returns {HTMLElement|null}
     */
    static _findIntermissionAnchor() {
        if (!game.modules.get('table-flow-intermission')?.active) return null;

        let anchor = null;
        let anchorBottom = -Infinity;
        for (const id of this.INTERMISSION_BUTTON_IDS) {
            const el = document.getElementById(id);
            if (!el) continue;
            const bottom = el.getBoundingClientRect().bottom;
            if (bottom > anchorBottom) {
                anchor = el;
                anchorBottom = bottom;
            }
        }
        return anchor;
    }

    /**
     * Snap our button directly below the lowest intermission button, right-aligned with it.
     * @param {HTMLElement} anchor
     */
    static _positionBelowAnchor(anchor) {
        const rect = anchor.getBoundingClientRect();
        const rightOffset = Math.max(0, window.innerWidth - rect.right);
        Object.assign(this.button.style, {
            top: `${rect.bottom + this.ATTACH_GAP}px`,
            right: `${rightOffset}px`,
            bottom: 'auto',
            left: 'auto'
        });
    }

    /**
     * Continuously follow table-flow-intermission's button (it's user-draggable, and its
     * ready-check button can appear/disappear), falling back to our own independent
     * draggable default position if intermission isn't active or isn't found.
     * @private
     */
    static _startAttachWatcher() {
        // Used only in attached mode, since makeDraggable owns click handling independently.
        this._boundClick ??= () => this._onClick();

        const tryAttach = () => {
            const anchor = this._findIntermissionAnchor();
            if (anchor) {
                if (!this._attached) {
                    // Switching into attached mode: drop independent drag handling, use a plain click
                    this._dragCleanup?.();
                    this._dragCleanup = null;
                    this.button.addEventListener('click', this._boundClick);
                    this._attached = true;
                }
                this._positionBelowAnchor(anchor);
            } else if (this._attached) {
                // Anchor disappeared (e.g. intermission disabled mid-session) - go independent
                this._attached = false;
                this.button.removeEventListener('click', this._boundClick);
                Object.assign(this.button.style, { top: 'auto', bottom: '20px', right: '20px', left: 'auto' });
                this._dragCleanup = window.TableFlowPatchNotes.DOMHelpers.makeDraggable(
                    this.button, this.button, this.STORAGE_KEY, () => this._onClick()
                );
            }
        };

        tryAttach();
        if (!this._attached) {
            // table-flow-intermission may still be finishing its own init; allow independent dragging
            // in the meantime and keep checking for a few seconds in case an anchor appears.
            this._dragCleanup = window.TableFlowPatchNotes.DOMHelpers.makeDraggable(
                this.button, this.button, this.STORAGE_KEY, () => this._onClick()
            );
        }

        // requestAnimationFrame instead of a polling interval so the button tracks the
        // intermission button's drag in real time, with no perceptible lag.
        const loop = () => {
            tryAttach();
            this._attachFrame = requestAnimationFrame(loop);
        };
        this._attachFrame = requestAnimationFrame(loop);
    }

    static updateState() {
        if (!this.button) return;

        // Re-assert in case something cleared inline positioning
        if (this.button.style.position !== 'fixed') {
            this.button.style.position = 'fixed';
            this.button.style.zIndex = '10000';
        }

        const unseen = !game.user.isGM && window.TableFlowPatchNotes.Settings.hasUnseenNotes();
        this.button.classList.toggle('tfpn-btn-unread', unseen);
        this.button.style.borderColor = unseen ? '#57b9ed' : '#d2b27e';
        this.button.style.color = unseen ? '#57b9ed' : '#d2b27e';
    }

    static _onClick() {
        if (game.user.isGM) {
            window.TableFlowPatchNotes.GMManager.show();
        } else {
            window.TableFlowPatchNotes.PlayerPopup.show(false);
        }
    }

    static destroy() {
        if (this._attachFrame) {
            cancelAnimationFrame(this._attachFrame);
            this._attachFrame = null;
        }
        if (this._dragCleanup) {
            this._dragCleanup();
            this._dragCleanup = null;
        }
        if (this._attached && this.button && this._boundClick) {
            this.button.removeEventListener('click', this._boundClick);
        }
        this._attached = false;
        window.TableFlowPatchNotes.DOMHelpers.removeElement(this.BUTTON_ID);
        this.button = null;
    }
};
