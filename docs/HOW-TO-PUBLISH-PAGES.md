# Put your Snack Laps pages online — from your iPhone

You only need Safari, the Files app and a GitHub account. There is nothing to buy for a standard GitHub Pages site in a **public** repository on GitHub Free. A private repository generally needs an eligible paid plan for Pages.

## 1. Replace the blanks first

Open the files in an iPhone text editor, or edit them with GitHub's pencil button after uploading:

- Replace `[YOUR EMAIL]` in **all three HTML pages** with an email address you will check.
- Replace `[YOUR NAME OR STUDIO]` in their footers with your name or studio name.
- In your own listing notes, replace `USERNAME` and `REPO` in the example links with your GitHub username and repository name.

Do not put your Apple password, API key, `.p8` key, card number or other secrets into any of these files. Everything in a public repository is public. Pages itself is public even when an eligible paid plan lets you keep the source private.

## 2. Get the files into the repo

1. Save `snack-laps-listing.zip` to **Files** on your iPhone. Tap it to unzip it.
2. In Safari, go to **github.com**, sign in, and open the repository you use for the app/Codemagic. If you do not have one, create it first. Your `main` branch needs at least one file, such as a README.
3. Make sure the site's files end up in a folder named exactly **docs**, at the top level of the repo — next to `www`, `ios` and `package.json`, not inside `www`.
4. If the repo already has a `docs` folder, open it. Choose **Add file → Upload files**, tap **choose your files**, select the HTML and Markdown files from Files, then **Commit changes** to `main`.
5. If `docs` does not exist, use **Add file → Create new file**. Enter `docs/.nojekyll` as the filename, add a short line such as `Static pages`, and commit it. This creates the folder. Then open `docs` and upload the HTML and Markdown files as above.
6. Inside `docs`, create `images/.gitkeep` the same way, then open the `images` folder and upload **appstore-icon.png** and **promo-banner-1200x400.png** there. Do not upload the images into the HTML folder by mistake.

If a button is hidden in Safari, use the page menu beside the address bar → **Request Desktop Website**. You can also turn your iPhone sideways. The GitHub website, rather than the GitHub iPhone app, is easiest for this setup.

The `previews` folder and `listing-fields.json` are optional reference files; the live site needs only:

```text
docs/
  .nojekyll
  app-ads.txt
  index.html
  privacy.html
  support.html
  images/
    appstore-icon.png
    promo-banner-1200x400.png
```

`app-ads.txt` authorizes Google to sell ads for this app. It is one line:

```text
google.com, pub-6414962483147556, DIRECT, f08c47fec0942fa0
```

After Pages is on, that file is published at `https://USERNAME.github.io/REPO/app-ads.txt`. Open it in Safari and check that the line matches AdMob exactly. AdMob looks for `app-ads.txt` on the developer website you enter for the app. A project site address includes `/REPO/`, so also confirm in AdMob that it can read this URL. If AdMob asks for the file at `https://USERNAME.github.io/app-ads.txt` (no repository name), that is a different address; use a domain you control, or a GitHub user site, when you are ready for that check. Do not change the publisher id in the file.

The two Markdown guides can stay in `docs` too. If the entire app project was already uploaded with this new `docs` folder intact, skip the individual upload steps.

## 3. Switch Pages on

1. In your GitHub repository, tap **Settings**. It may be inside a **…** menu.
2. Find **Pages** under **Code and automation** in the Settings menu.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Choose branch **main** and folder **/docs**.
5. Tap **Save**. GitHub may take a few minutes to publish. Refresh the Pages screen; the published address appears there. No custom domain or separate hosting account is needed.

## 4. Check your links in Safari

Replace the CAPITAL words below with your own details:

- Landing / marketing: `https://USERNAME.github.io/REPO/`
- Privacy: `https://USERNAME.github.io/REPO/privacy.html`
- Support: `https://USERNAME.github.io/REPO/support.html`
- App ads authorization: `https://USERNAME.github.io/REPO/app-ads.txt`

There is **no `/docs/`** in these public URLs. These examples assume an ordinary project repository, not a special repository named `USERNAME.github.io`.

Open all three pages and `app-ads.txt`. Check the banner and icon, tap the navigation links, and make sure your real contact email appears. The ads file should be exactly one line, the publisher id included. If you see 404, check the branch/folder setting, exact filename spelling and the repo's **Actions** tab for the Pages build result. If you see old content, refresh or reopen in a private Safari tab.

Now paste the three working links into the matching fields in **App Store Connect** using `APP-STORE-LISTING.md`. Do not submit until the placeholders are replaced and the privacy checklist in that guide is complete.

## Later changes

Edit or upload a file in the same `docs` folder and commit to `main`. GitHub republishes the site. No rebuild of the iPhone app is needed just to update these web pages. Update the policy when the actual app's data practices change.

Official GitHub instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
