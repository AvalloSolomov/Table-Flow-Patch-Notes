/**
 * Table Flow - Patch Notes Module for FoundryVTT
 * Main initialization and hook management
 */

// Scoped locally (not a global function) so it can't collide with another
// module's identically-named global `initializeModule` and get overwritten.
Hooks.once('ready', () => {
    const initializeModule = async () => {
        try {
            window.TableFlowPatchNotes.Settings.register();
        } catch (error) {
            console.error('Table Flow - Patch Notes | Settings registration failed:', error);
        }

        try {
            window.TableFlowPatchNotes.SocketHandler.initialize();
        } catch (error) {
            console.error('Table Flow - Patch Notes | Socket handler failed:', error);
        }

        try {
            window.TableFlowPatchNotes.FloatingButton.create();
        } catch (error) {
            console.error('Table Flow - Patch Notes | Floating button failed:', error);
        }

        try {
            if (!game.user.isGM && window.TableFlowPatchNotes.Settings.hasUnseenNotes()) {
                await window.TableFlowPatchNotes.PlayerPopup.show();
            }
        } catch (error) {
            console.error('Table Flow - Patch Notes | Player popup failed:', error);
        }
    };

    setTimeout(() => {
        initializeModule().catch((error) => {
            console.error('Table Flow - Patch Notes | Initialization failed:', error);
        });
    }, 100);
});

