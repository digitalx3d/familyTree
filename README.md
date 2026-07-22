# Family Tree

An interactive, blended-family tree that runs entirely in the browser. No
backend, no accounts, no database. Open a person and the tree centers on them;
tap anyone to move the focus to them (the way FamilySearch works on a phone).

Built on [family-chart](https://github.com/donatso/family-chart) (MIT), a
D3.js family-tree library. The library and D3 are vendored into `/vendor`, so
the site has no external dependencies at runtime.

## Run it locally

The site is plain static files, but browsers block one page from loading
another local file over `file://`, so use a tiny local server:

```bash
# from this folder
python -m http.server 8477
# then open http://localhost:8477
```

(Any static server works. If you don't have Python, `npx serve` does the same.)

## Edit the family

Everything about who's who lives in **`js/data.js`**. It's commented and meant
to be hand-edited. Add a person, fix a name, correct a relationship, save, and
refresh. The file's header explains the rules that keep relationships correct
(they have to agree on both ends).

## Add photos

Drop image files in **`/photos`** and point each person at theirs. See
[`photos/README.md`](photos/README.md). People without a photo show a colored
circle with their initials, so the tree looks complete from day one.

## How the tree works (and one thing to know)

This is a **person-centric** tree: it shows one person's ancestors and
descendants, plus their spouses and siblings. That's what makes tap-to-recenter
feel natural.

The trade-off: because this family forks at two remarriages (Jack married Jane
then Peg; Peg married Tom then Jack), **no single starting person shows all 23
people at once.** The most complete single view is Peg (16 of 23 visible),
since she connects both marriages. Everyone else is one or two taps away. All
23 people are in the data and reachable by tapping across the tree.

The app opens focused on John and shows his siblings (including his half-sister
Kelly, who bridges the two families). Depth is set generously so each branch
shows in full.

## Project layout

```
index.html            entry point
css/styles.css        all styling; every color/size is a CSS variable at the top
js/data.js            the family data — hand-edit this
js/main.js            chart setup, custom cards, tap-to-recenter, detail panel
vendor/               d3 + family-chart (vendored, MIT)
photos/               family photos + naming guide
.github/workflows/    GitHub Pages deploy
```

Styling is fully tokenized (CSS variables in `css/styles.css`) so a visual
polish pass can restyle the app without touching layout or markup.

## Deploy (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` publishes the site on every push
to `main`. One-time setup after the repo is on GitHub:

**Settings → Pages → Build and deployment → Source: "GitHub Actions".**

The live URL will be `https://<your-username>.github.io/familyTree/`.
