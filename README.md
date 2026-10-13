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

The first book is "I'd Rather Not Say Goodbye" by Jamie Shaffer. The manuscript text is unchanged from the original.

## Structure

```
_config.yml          site settings and collection defaults
_data/books.yml      the book database
_data/navigation.yml header navigation
_chapters/           one Markdown file per book section
_includes/ _layouts/ templates
books/               Books shelf, book pages, full-manuscript view
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

1. Add an entry to `_data/books.yml`.
2. Add one Markdown file per section in `_chapters/`, with `book`, `record_id`, `title`, `order`, and `tags` in the front matter.
3. Add a book page under `books/` (copy the existing one) and a cover image if you have one.

## Deployment

The site is plain Jekyll and builds on GitHub Pages from the `main` branch.
