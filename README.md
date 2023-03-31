# startpage

A clean startpage made with Svelte.

Check out my newer startpage: https://github.com/refact0r/alpine

Firefox theme: https://github.com/refact0r/sidefox

![image](https://user-images.githubusercontent.com/34758569/175662486-e08443d9-fda8-4898-ad12-dc6e0c1b0429.png)

## Installation

Make sure to install the [Cascadia Code](https://github.com/microsoft/cascadia-code) font on your computer.

### Firefox

1. Go to the [releases](https://github.com/refact0r/startpage/releases) and download the .xpi file from the latest release.
2. Go to `about:addons` in firefox and click the gear icon.
3. Click `Install Add-on From File...` and select the .xpi file.

### Chrome

1. Download or clone this repository.
2. Remove lines 9-11 (the `"chrome_settings_overrides"` section) from `public/manifest.json`.
2. Go to `chrome://extensions/` in chrome and turn on developer mode (top right).
3. Click "Load unpacked" and select the `/public/` folder from this repository.

## Customization

To change the name and enable weather, hover in the bottom right corner and a settings button should show up. 

### Changing links

1. Go to the new tab page and press `Ctrl+Shift+I`.
2. Click the tab labelled `Storage` (Firefox) / `Application` (Chrome).
3. Click on this extension's id under `Local Storage`.
4. You should see one field with the key `config` show up with a bunch of JSON text as the value.
5. Copy the JSON into a text editor and change the links.
6. Paste the edited JSON back into the config value field and reload the page.
