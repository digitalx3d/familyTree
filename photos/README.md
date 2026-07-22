# Photos

Drop a photo in here named after the person's `id` and it shows up. No code
edit needed.

## The one rule: name the file after the lowercase id

Each person in `js/data.js` has an `id` (the short name near the top of their
entry, e.g. `id: "jack"`). Name the image file exactly that id, **all
lowercase**, with any common image extension:

```
photos/jack.jpg
photos/jane.png
photos/campbell.webp
```

Save it, refresh the page, done. The tree finds `photos/<id>.jpg`,
`photos/<id>.jpeg`, `photos/<id>.png`, or `photos/<id>.webp` automatically (it
tries them in that order) and swaps the colored initials circle for the photo.

### Lowercase matters

The site runs on GitHub Pages, which is **case-sensitive**. `photos/Jack.jpg`
will NOT be found; it must be `photos/jack.jpg`. Match the id's exact lowercase
spelling. If a photo isn't showing, this is almost always why.

A person with no matching file just keeps their colored initials circle, so the
tree looks complete before every photo is in. Nothing breaks if a file is
missing — there's no broken-image icon.

## Optional: pin a specific path (override)

Auto-linking covers the normal case. If you ever want a person to use a photo
that is NOT named after their id (a shared image, a different folder, an
odd filename), set their `photo` field in `js/data.js` and that path wins:

```js
{
  id: "jack",
  data: { gender: "M", "first name": "Jack", "last name": "Pruden",
          birthdate: "1945-01-05",
          photo: "photos/jack-and-jane-1972.jpg",   // explicit override
          notes: "" },
  ...
}
```

Leave `photo: null` (the default) to use the automatic id-based lookup.

## Tips

- Roughly square images look best (they're shown in a circle). ~400x400
  pixels is plenty.
- Keep files reasonably small (under ~300 KB each) so the tree loads fast on a
  phone.
