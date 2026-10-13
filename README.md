# The Void

An independent library for books, memories, and things worth keeping. The Void is built as a quiet database: every book and every section is a record that can be searched, filtered, saved, and read.

Live site: https://alanschafer.github.io/thevoid/

## What is inside

- Archive: a database-style table of every record, with full-text search, type filter, subject tags, and sort.
- Books: a separate shelf for complete works, each with its own page, contents, content note, full-manuscript view, and Markdown download.
- Reader: a focused reading layout with text size controls, light and dark themes, reading progress, and arrow-key navigation between sections.
- Saved: a personal shelf and a "continue reading" link, stored only in the visitor's browser.
- About, Reader guide, and Sources pages.
- Global search on any page (press `/`).
- A void background: black-hole artwork with drifting dust, parallax, grain, and a vignette. It respects reduced-motion settings.

## The library

1. I'd Rather Not Say Goodbye, by Jamie Shaffer (memoir, 6 sections)
2. The Mind of Belief: The Prisons We Choose, by Alan Shaffer (34 sections)
3. Biblical Texts Under Critical Examination: A Historical and Textual Analysis, by Alan Shaffer (29 sections)
4. Psyche Paradox, by Alan Shaffer (5 chapters)
5. The Mask That Ate the Face: The Second Artifact, by Alan Shaffer (fiction, 4 sections)
6. The Forbidden Path: Walking Beyond the Edges of Fear, by Alan Shaffer (fiction, 15 chapters plus front and back matter)

Each work is a record in the archive, and each section is its own record. Book text is kept as supplied; the editorial notes on the imported manuscripts are in `HANDOFF.md` in the Perplexity Project.

## Structure

```
_config.yml          site settings and collection defaults
_data/books.yml      the book database
_data/navigation.yml header navigation
_chapters/           one Markdown file per section (book 1 at the top level, other books in a folder per book)
_includes/ _layouts/ templates
books/               Books shelf, plus <id>.html (book page) and <id>-complete.html (full manuscript) per book
tools/build_books.py, build_books2.py one-time importers for books 2 to 6 (need the source files)
archive/ saved/ about/ help/ sources/
assets/              css, js, images, downloads
search.json          index used by search
```

## Run locally

```
bundle install
bundle exec jekyll serve --baseurl ""
```

Then open http://127.0.0.1:4000/.

## Add a book

1. Add an entry to `_data/books.yml`. Fields: `id`, `record_id`, `title`, `subtitle`, `author`, `type`, `genre`, `description`, `dedication`, `url` (`/books/<id>/`), `start` (first section URL), `tags`, `sections`, `minutes`, `year`, `cover_title` (HTML), `cover_label`, `cover_art`, `kind`, `note`, `download`.
2. Add one Markdown file per section in `_chapters/<id>/NN-slug.md`. Front matter: `book`, `record_id`, `title`, `order`, `tags`, `permalink`, and optionally `subtitle`, `part`, `num`, `warning`.
3. Copy `books/psyche-paradox.html` to `books/<id>.html` and `books/psyche-paradox-complete.html` to `books/<id>-complete.html`, then change the `book` value and permalinks.
4. Add a cover image under `assets/images/` and point `cover_art` at it.

## Deployment

The site is plain Jekyll and builds on GitHub Pages from the `main` branch.
