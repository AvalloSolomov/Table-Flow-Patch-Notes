/**
 * Socket Handler Module
 * Pushes an immediate "new patch notes" signal to connected players on publish
 */

window.TableFlowPatchNotes = window.TableFlowPatchNotes || {};

window.TableFlowPatchNotes.SocketHandler = class {
    static MODULE_ID = 'table-flow-patch-notes';
    static _initialized = false;

    static initialize() {
        if (this._initialized) {
            console.warn('Table Flow - Patch Notes | Socket handler already initialized');
            return;
        }

        try {
            game.socket.on(`module.${this.MODULE_ID}`, (data) => this._handleSocketMessage(data));
            this._initialized = true;
        } catch (error) {
            console.error('Table Flow - Patch Notes | Error setting up socket:', error);
        }
    }

    static _handleSocketMessage(data) {
        if (game.user.isGM) return;
        if (data?.action !== 'publish') return;

        if (window.TableFlowPatchNotes.Settings.hasUnseenNotes()) {
            window.TableFlowPatchNotes.PlayerPopup.show();
        }
    }

    /**
     * Tell all connected clients that new patch notes were published
     */
    static emitPublish() {
        game.socket.emit(`module.${this.MODULE_ID}`, {
            action: 'publish',
            timestamp: Date.now()
        });
    }
};
