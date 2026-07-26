# Brand font sources

Original TTFs for the two UI families. **Nothing in this folder is bundled by
the app** — it is the source material for regenerating the subsets that the
frontend actually ships.

- `poppins/` — Latin UI font (English)
- `bahij/` — Bahij TheSansArabic, Arabic-script font (Arabic + Kurdish Sorani)

## What the app actually loads

`frontend/public/fonts/*.woff2` — nine subset files, served from our own origin
and declared in `frontend/src/index.css`.

Both families are declared under a single family name (`AppSans`) and separated
by `unicode-range`, so the browser picks a face **per character** rather than
per element. Case rows mix scripts on one line — `#1 ٩٣٠٥\ش٤\٢٠٢٦ شەیدا عبدالخالق سلیم` —
and a language-based switch would force one font onto both halves.

Weights shipped: Poppins 400/500/600/700/800, Bahij 400/600/700/800.

Bahij has no Medium; a `font-weight: 500` on Arabic-script text resolves down to
400 (Plain) via normal CSS font matching. This is intentional — Bahij's next
step up is SemiBold, which would render Arabic noticeably heavier than the
English at the same weight.

## Regenerating a subset

Requires `fonttools` with Brotli support (`pip install fonttools brotli`):

```bash
pyftsubset fonts/bahij/BahijTheSansArabic-Plain.ttf \
  --output-file=frontend/public/fonts/bahij-400.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --unicodes='U+0600-06FF,U+0750-077F,U+0870-088E,U+08A0-08FF,U+200C-200F,U+2010-2011,U+FB50-FDFF,U+FE70-FEFF'
```

Keep `--layout-features='*'`. Arabic script depends on GSUB/GPOS for contextual
letter joining; dropping those features breaks connected forms.

If you change a filename here, update the `@font-face` blocks in
`frontend/src/index.css` and the preload tags in `frontend/index.html`.
