# DATAsaster

Philippine disaster monitoring: map, live layers, incidents, news and emergency contacts.

## What is in this folder

| File | What it is | Who edits it |
|---|---|---|
| `index.html` | Page layout and fixed text (header, menus, forms) | Layout and wording |
| `css/style.css` | All colours, spacing and fonts. Colours are at the top, under `:root` | Designer |
| `js/data.js` | Content: sample incidents, emergency contacts, news outlets, forecast cities | Content and research |
| `js/app.js` | How the app works (filters, map, layers, reports) | Coder |
| `lib/` | The Leaflet map library. Do not edit | Nobody |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | Makes it installable and usable offline | Rarely |

## (GitHub Pages, free)

1. Everyone makes a free account at github.com.
2. One person: click **+** (top right), then **New repository**. Name it `datasaster`, choose **Public**, press **Create repository**.
3. On the new page click **uploading an existing file**. Open the unzipped `datasaster` folder, select everything inside, and drag it onto the page. Wait for the upload, then press **Commit changes**.
4. Go to **Settings**, then **Pages**. Under Branch choose **main** and **/ (root)**, then **Save**. After 1 to 2 minutes the link appears at the top, like `https://yourname.github.io/datasaster/`.
5. Go to **Settings**, then **Collaborators**, then **Add people**. Type each groupmate's GitHub username. They accept the email invite.

## Edit as a group

1. Open the repository and click the file you want.
2. Click the pencil icon, make your change, then press **Commit changes**. (Or press the `.` key on the repository page for a full editor in the browser.)
3. Wait about a minute, open the live link and press **Ctrl+Shift+R** to see the change.
4. Agree who edits which file, so two people do not change the same file at once. If you get a conflict message, copy your change, reload the file and paste it again.
5. Installed phone apps: after a big change, rename `datasaster-v5` to `datasaster-v6` in `sw.js` so phones fetch the new version.

## Where to change things

- Colours: `css/style.css`, top lines, `:root{` (dark theme) and `[data-theme=light]`.
- Sample incidents: `js/data.js`, the `SEED` list. Copy one block, change the text and coordinates.
- Emergency contacts: `js/data.js`, `CONTACTS`.
- News outlets: `js/data.js`, `SRC`.
- Forecast cities: `js/data.js`, `POINTS`.
- Header title and tagline: `index.html`, search for `class="brand"`.

Keep the quotes, commas and brackets exactly as they are. If the page goes blank, undo your last change (GitHub keeps every version under **History**).
