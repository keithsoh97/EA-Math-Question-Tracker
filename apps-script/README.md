# Edit mode setup (one time, ~5 minutes)

Edit mode lets you tag questions **on the tracker page itself**. Every change
saves straight into the Google Sheet. You don't need to edit Excel any more.

## 1. Add the script to the Google Sheet

1. Open the tracker Google Sheet (the one with the `ALL`, `EMATH`, `NEMATH` tabs).
2. **Extensions → Apps Script**.
3. Delete what's in `Code.gs`, then paste in everything from [`Code.gs`](Code.gs) in this folder. Save.

## 2. Set your passcode

1. In the Apps Script editor, open **Project Settings** (the ⚙ gear on the left).
2. Under **Script properties**, click **Add script property**:
   - Property: `EDIT_PASSCODE`
   - Value: a passcode only you know
3. Save.

(The passcode stays in Google. The code on GitHub is public, so the passcode is
never in it.)

## 3. Deploy it as a web app

1. **Deploy → New deployment**. Click the ⚙ next to "Select type" and choose **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
   ("Anyone" only means the page can reach the script. Without the passcode,
   nobody can change anything.)
3. Click **Deploy** and allow access when Google asks (it asks once, for your own Sheet).
4. Copy the **Web app URL** (it ends in `/exec`).

## 4. Connect the page

In `index.html`, find this line near the top of the `<script>`:

```js
const EDIT_API_URL = '';
```

Paste the URL between the quotes, then push to GitHub.

## Using it

- Open the tracker and click **✎ Edit mode** at the bottom of the sidebar. Enter your passcode (this browser remembers it; **Lock** forgets it).
- **In the tables:** Topic, Subtopic, Difficulty, Page and Rank become editable. Each change saves when you leave the box (green = saved, red = not saved).
- **Fastest way to tag: click ✎ Tag on any question.** The paper page opens with a panel beside it:
  - `1` / `2` / `3` sets Normal / Challenging / Very Challenging
  - `J` / `K` goes to the next / previous question in that list
  - When you change the page number, the preview jumps to that page so you can check it.
- **Rank** (optional): sets the order of questions *within the same difficulty*. 1 shows first, and unranked questions come last. The first time you set a rank, the script adds a `Rank` column to the Sheet.
- Normal is saved as a blank cell, so blank and "Normal" mean the same thing.

## If you change Code.gs later

Use **Deploy → Manage deployments → ✎ Edit → Version: New version → Deploy**.
That keeps the same URL. A *new deployment* gives you a new URL instead.
