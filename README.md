# startpage

A clean startpage made with Svelte.

Try it out here: https://refact0r-startpage.netlify.app/

Firefox theme: [midnight-fox](https://github.com/refact0r/midnight-fox)

![image](https://user-images.githubusercontent.com/34758569/175853091-fd5f09cd-1bb3-44a7-9aed-14ee52ce3ee4.png)

## Installation

Make sure to install the [Cascadia Code](https://github.com/microsoft/cascadia-code) font on your computer.

### Firefox

1. Go to the [releases](https://github.com/refact0r/startpage/releases) and download the .xpi file from the latest release.
2. Go to `about:addons` in firefox and click the gear icon.
3. Click `Install Add-on From File...` and select the .xpi file.

### Chrome

1. Download or clone this repository.
2. Go to `chrome://extensions/` in chrome and turn on developer mode (top right).
3. Click "Load unpacked" and select the `/public/` folder from this repository.

## Customization

To change the name and enable weather, hover in the bottom right corner and a settings button should show up. 

### Changing links

1. Go to the new tab page and press `Ctrl+Shift+I`.
2. Click the tab labelled `Storage` (Firefox) / `Application` (Chrome).
3. Click on this extension's id under `Local Storage`.
4. You should see one field with the key `config` show up with a bunch of JSON text as the value.
5. Copy the JSON into a text editor and change the links.x
6. Paste the edited JSON back into the config value field and reload the page.
