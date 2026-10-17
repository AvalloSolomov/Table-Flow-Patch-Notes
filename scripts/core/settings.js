/**
 * Settings Management Module
 * Handles registration, storage, and retrieval of patch note entries
 */

window.TableFlowPatchNotes = window.TableFlowPatchNotes || {};

window.TableFlowPatchNotes.Settings = class {
    static MODULE_ID = 'table-flow-patch-notes';

    /**
     * Register all module settings
     */
    static register() {
        try {
            // World-scoped: the saved library of patch note entries the GM has written
            game.settings.register(this.MODULE_ID, 'library', {
                name: 'Patch Note Library',
                hint: 'Saved patch note entries the GM has written',
                scope: 'world',
                config: false,
                type: Array,
                default: []
            });

            // World-scoped: which entries are currently published, in display order
            game.settings.register(this.MODULE_ID, 'publishedIds', {
                name: 'Published Entry IDs',
                hint: 'Entries currently shown to players',
                scope: 'world',
                config: false,
                type: Array,
                default: []
            });

            // World-scoped: bumped every time the GM publishes, so clients know there's something new
            game.settings.register(this.MODULE_ID, 'publishedVersion', {
                name: 'Published Version',
                hint: 'Timestamp of the last publish',
                scope: 'world',
                config: false,
                type: Number,
                default: 0,
                onChange: () => this._onPublishedVersionChange()
            });

            game.settings.register(this.MODULE_ID, 'popupTitle', {
                name: 'Popup Title',
                hint: 'Header title shown at the top of the player popup',
                scope: 'world',
                config: false,
                type: String,
                default: 'Patch Notes'
            });

            game.settings.register(this.MODULE_ID, 'popupSubtitle', {
                name: 'Popup Subtitle',
                hint: "Smaller text shown under the popup title",
                scope: 'world',
                config: false,
                type: String,
                default: "What's new at the table"
            });

            // Client-scoped: the last published version this user has already seen
            game.settings.register(this.MODULE_ID, 'lastSeenVersion', {
                name: 'Last Seen Version',
                hint: 'The last patch notes version this client has already seen',
                scope: 'client',
                config: false,
                type: Number,
                default: 0
            });
        } catch (error) {
            console.error('Table Flow - Patch Notes | Error registering settings:', error);
        }
    }

    /** @returns {Array<{id:string,title:string,body:string,createdAt:number,updatedAt:number}>} */
    static getLibrary() {
        return game.settings.get(this.MODULE_ID, 'library') ?? [];
    }

    static async _saveLibrary(entries) {
        await game.settings.set(this.MODULE_ID, 'library', entries);
    }

    /**
     * Add a new entry to the library
     * @param {string} title
     * @param {string} body
     * @returns {Promise<Object>} the created entry
     */
    static async addEntry(title, body) {
        const entries = this.getLibrary();
        const entry = {
            id: foundry.utils.randomID(),
            title: title?.trim() || 'Untitled Entry',
            body: body ?? '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        entries.push(entry);
        await this._saveLibrary(entries);
        return entry;
    }

    /**
     * Update an existing entry
     * @param {string} id
     * @param {{title?: string, body?: string}} changes
     */
    static async updateEntry(id, changes) {
        const entries = this.getLibrary();
        const entry = entries.find(e => e.id === id);
        if (!entry) return null;
        if (changes.title !== undefined) entry.title = changes.title.trim() || 'Untitled Entry';
        if (changes.body !== undefined) entry.body = changes.body;
        entry.updatedAt = Date.now();
        await this._saveLibrary(entries);
        return entry;
    }

    /**
     * Delete an entry and remove it from the published set, if present
     * @param {string} id
     */
    static async deleteEntry(id) {
        const entries = this.getLibrary().filter(e => e.id !== id);
        await this._saveLibrary(entries);

        const published = this.getPublishedIds().filter(pid => pid !== id);
        await game.settings.set(this.MODULE_ID, 'publishedIds', published);
    }

    static getPublishedIds() {
        return game.settings.get(this.MODULE_ID, 'publishedIds') ?? [];
    }

    static getPublishedVersion() {
        return game.settings.get(this.MODULE_ID, 'publishedVersion') ?? 0;
    }

    /**
     * Resolve the currently published entries, in the order they were published
     * @returns {Array<Object>}
     */
    static getPublishedEntries() {
        const library = this.getLibrary();
        const ids = this.getPublishedIds();
        return ids
            .map(id => library.find(e => e.id === id))
            .filter(Boolean);
    }

    /**
     * Publish a set of entries to players, bumping the version so clients re-show the popup
     * @param {string[]} ids
     */
    static async publish(ids) {
        await game.settings.set(this.MODULE_ID, 'publishedIds', ids);
        await game.settings.set(this.MODULE_ID, 'publishedVersion', Date.now());
    }

    static getPopupTitle() {
        return game.settings.get(this.MODULE_ID, 'popupTitle');
    }

    static getPopupSubtitle() {
        return game.settings.get(this.MODULE_ID, 'popupSubtitle');
    }

    static async setPopupText(title, subtitle) {
        await game.settings.set(this.MODULE_ID, 'popupTitle', title?.trim() || 'Patch Notes');
        await game.settings.set(this.MODULE_ID, 'popupSubtitle', subtitle?.trim() || '');
    }

    static getLastSeenVersion() {
        return game.settings.get(this.MODULE_ID, 'lastSeenVersion') ?? 0;
    }

    static async setLastSeenVersion(version) {
        await game.settings.set(this.MODULE_ID, 'lastSeenVersion', version);
    }

    /**
     * Whether the current client has unseen, published patch notes
     */
    static hasUnseenNotes() {
        return this.getPublishedEntries().length > 0 && this.getPublishedVersion() > this.getLastSeenVersion();
    }

    /**
     * Fallback sync for clients that miss the publish socket event.
     * @private
     */
    static _onPublishedVersionChange() {
        if (game.user.isGM) return;
        if (!window.TableFlowPatchNotes.PlayerPopup) return;
        if (this.hasUnseenNotes()) {
            window.TableFlowPatchNotes.PlayerPopup.show();
        }
    }
};
