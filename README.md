# Table Flow - Patch Notes

A FoundryVTT module that lets the GM write patch notes (house rules, campaign updates, table news), then publish a selection of them as a popup for players. Part of the Table Flow suite.

## Features

### GM Tools

- **Library** - Save entries in advance, each with a title and a body, and edit or delete them at any time. Open the library from the **Library** button next to the entry box.
- **Rich Text Bodies** - Entry bodies support basic HTML and Foundry content links.
- **Popup Header** - Set the popup title and an optional subtitle (click the pen icon next to **Popup Header** to open the editor, then **Save**).
- **Preview** - See exactly what players will see before you publish.
- **Publish** - Publish the entry you are writing with one click, or tick several saved entries in the library and click **Publish Selected**.
- **Floating Button** - A scroll button that opens the manager. It is draggable, and docks below the Table Flow Intermission button when that module is active.

### Player Popup

- Published notes appear automatically the next time a player loads the world, or immediately if they are already online.
- Each player sees a published set once; closing the popup with **Got it!** or the close button marks it as seen.
- Players can reopen the current notes at any time from the floating button, which turns blue while there are unread notes.

## Installation

1. In Foundry, open **Add-on Modules** and click **Install Module**.
2. Paste this into the **Manifest URL** field and click **Install**:

   `https://github.com/AvalloSolomov/Table-Flow-Patch-Notes/releases/latest/download/module.json`

3. Enable **Table Flow - Patch Notes** in your world's module settings.

## Usage

### For GMs

1. Click the scroll button (bottom-right by default) to open the Patch Notes manager.
2. Under **New Entry**, enter a title and body. Click **Save to Library** to keep it for later, or **Preview** / **Publish** in the footer to show it to players right away (publishing also saves it to the library).
3. To publish several saved entries at once, click **Library**, tick the entries you want, and click **Publish Selected**. Use the pen and trash icons there to edit or delete entries.
4. Optionally click the pen icon next to **Popup Header** to change the popup title and subtitle.

Publishing replaces the previously published set. Deleting an entry also removes it from the published set.

### For Players

- The popup appears automatically when new notes are published.
- Click **Got it!** (or the close button) to dismiss it.
- Click the scroll button at any time to read the current notes again.

## Compatibility

- **Minimum FoundryVTT Version**: 12
- **Verified Version**: 14.365
- **System Agnostic**: Works with any game system

## License

Copyright (c) 2026 Tableflow. All rights reserved.

You may install and use this module unmodified, including in commercial games. Modification and redistribution are not permitted without written permission. See [LICENSE](LICENSE) for the full terms.

## Support

For bug reports or feature requests, open an issue at https://github.com/AvalloSolomov/Table-Flow-Patch-Notes/issues.

## Changelog

### Version 1.0.0

- Initial public release
