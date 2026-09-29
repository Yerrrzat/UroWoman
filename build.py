#!/usr/bin/env python3
"""Static site builder for UroWoman Kazakhstan.

Reads page fragments from site/pages/<lang>/<slug>.html, wraps them in the
shared layout and writes a ready-to-host site into dist/.

    python build.py            # build into dist/
    python build.py --serve    # build and serve on http://localhost:8080

Only the Python standard library is used.
"""
import hashlib
import html
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "site"
DIST = ROOT / "dist"

# Public address of the site. Used for canonical links, hreflang and sitemap.
BASE_URL = "https://urowoman.kz"
# Path the site is served from ("/" for a domain root, "/UroWoman/" for a GitHub Pages project site).
BASE_PATH = "/"

LANGS = ["ru", "kk", "en"]
DEFAULT_LANG = "ru"

UI = {
    "ru": {
        "label": "RU", "name": "Русский", "og_locale": "ru_RU",
        "nav": [("index", "Главная"), ("patient", "Пациенткам"), ("doctors", "Врачам"), ("tools", "Тест ICIQ-SF"), ("research", "Наука")],
        "nav_label": "Основная навигация", "lang_label": "Язык сайта",
        "search_placeholder": "Поиск по сайту", "search_label": "Поиск по сайту", "search_button": "Найти",
        "skip": "Перейти к содержимому",
        "footer_note": "Материалы сайта носят информационный характер и не заменяют консультацию врача, диагностику или лечение.",
        "footer_privacy": "Политика конфиденциальности",
        "footer_sources": "Источники: ICS, EAU, AUA, NICE и исследование женщин с недержанием мочи в Казахстане (IJERPH, 2026).",
    },
    "kk": {
        "label": "KZ", "name": "Қазақша", "og_locale": "kk_KZ",
        "nav": [("index", "Басты бет"), ("patient", "Пациенттерге"), ("doctors", "Дәрігерлерге"), ("tools", "ICIQ-SF тесті"), ("research", "Ғылым")],
        "nav_label": "Негізгі навигация", "lang_label": "Сайт тілі",
        "search_placeholder": "Сайттан іздеу", "search_label": "Сайттан іздеу", "search_button": "Іздеу",
        "skip": "Мазмұнға өту",
        "footer_note": "Сайт материалдары ақпараттық сипатта және дәрігер кеңесін, диагностиканы немесе емдеуді алмастырмайды.",
        "footer_privacy": "Құпиялылық саясаты",
        "footer_sources": "Дереккөздер: ICS, EAU, AUA, NICE және Қазақстандағы зәр ұстамайтын әйелдер туралы зерттеу (IJERPH, 2026).",
    },
    "en": {
        "label": "EN", "name": "English", "og_locale": "en_US",
        "nav": [("index", "Home"), ("patient", "For patients"), ("doctors", "For doctors"), ("tools", "ICIQ-SF test"), ("research", "Research")],
        "nav_label": "Main navigation", "lang_label": "Site language",
        "search_placeholder": "Search the site", "search_label": "Search the site", "search_button": "Search",
        "skip": "Skip to content",
        "footer_note": "The information on this site is educational and does not replace medical advice, diagnosis or treatment.",
        "footer_privacy": "Privacy policy",
        "footer_sources": "Sources: ICS, EAU, AUA, NICE and a study of women with urinary incontinence in Kazakhstan (IJERPH, 2026).",
    },
}

META_RE = re.compile(r"^\s*<!--(.*?)-->\s*", re.S)
HERO_SPLIT = "<!-- main -->"


def parse_page(path):
    text = path.read_text(encoding="utf-8")
    meta = {}
    match = META_RE.match(text)
    if match:
        for line in match.group(1).strip().splitlines():
            key, _, value = line.partition(":")
            meta[key.strip()] = value.strip()
        text = text[match.end():]
    hero, _, body = text.rpartition(HERO_SPLIT)
    meta["hero"] = hero.strip()
    meta["body"] = body.strip()
    for required in ("title", "description"):
        if not meta.get(required):
            sys.exit(f"{path}: missing '{required}' in page header")
    return meta


def page_url(lang, slug):
    """Absolute public URL of a page."""
    prefix = "" if lang == DEFAULT_LANG else f"{lang}/"
    name = "" if slug == "index" else f"{slug}.html"
    return f"{BASE_URL}{BASE_PATH}{prefix}{name}"


def lang_dir(lang):
    return DIST if lang == DEFAULT_LANG else DIST / lang


def asset_hash(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def plain_text(fragment):
    text = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def render(lang, slug, page, slugs, versions, root, link_base=""):
    ui = UI[lang]
    esc = html.escape
    section = page.get("section", slug)

    current_page = ' aria-current="page"'
    current_lang = ' aria-current="true"'
    nav = "".join(
        f'<a href="{link_base}{target}.html"{current_page if target == section else ""}>{esc(label)}</a>'
        for target, label in ui["nav"]
    )

    def other_lang_href(other):
        target = slug if slug in slugs[other] else "index"
        if slug == "404":
            return f"{BASE_PATH}{'' if other == DEFAULT_LANG else other + '/'}index.html"
        if lang == DEFAULT_LANG:
            prefix = "" if other == DEFAULT_LANG else f"{other}/"
        else:
            prefix = "../" if other == DEFAULT_LANG else f"../{other}/"
        return f"{prefix}{target}.html"

    switcher = "".join(
        f'<a href="{other_lang_href(other)}" hreflang="{other}" lang="{other}" title="{esc(UI[other]["name"])}"'
        f'{current_lang if other == lang else ""}>{UI[other]["label"]}</a>'
        for other in LANGS
    )

    alternates = ""
    if slug != "404":
        alternates = "".join(
            f'\n  <link rel="alternate" hreflang="{other}" href="{page_url(other, slug)}" />'
            for other in LANGS if slug in slugs[other]
        ) + f'\n  <link rel="alternate" hreflang="x-default" href="{page_url(DEFAULT_LANG, slug)}" />'
    canonical = "" if slug == "404" else f'\n  <link rel="canonical" href="{page_url(lang, slug)}" />'
    robots = '\n  <meta name="robots" content="noindex" />' if slug == "404" else ""

    body_class = f' class="{esc(page["body_class"])}"' if page.get("body_class") else ""
    main_class = page.get("main_class", "")
    main_attr = f' class="{esc(main_class)}"' if main_class else ""
    hero = f"\n    {page['hero']}" if page["hero"] else ""
    title = page["title"] if slug == "index" else f"{page['title']} — UroWoman Kazakhstan"
    og_url = "" if slug == "404" else f'\n  <meta property="og:url" content="{page_url(lang, slug)}" />'

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(page['description'])}" />{robots}{canonical}{alternates}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="UroWoman Kazakhstan" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(page['description'])}" />
  <meta property="og:locale" content="{ui['og_locale']}" />{og_url}
  <meta name="theme-color" content="#a94268" />
  <link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&amp;family=Noto+Serif:wght@600;700&amp;display=swap" />
  <link rel="stylesheet" href="{root}assets/styles.css?v={versions['styles.css']}" />
</head>
<body{body_class}>
  <a class="skip-link" href="#main">{esc(ui['skip'])}</a>
  <header class="page-header">
    <div class="container header-top">
      <a class="brand" href="{link_base}index.html"><span class="brand-mark">UroWoman</span><span class="brand-sub">Kazakhstan</span></a>
      <nav class="main-nav" aria-label="{esc(ui['nav_label'])}">{nav}</nav>
      <div class="header-tools">
        <form class="site-search" role="search">
          <input type="search" name="q" placeholder="{esc(ui['search_placeholder'])}" aria-label="{esc(ui['search_label'])}" autocomplete="off" />
          <button type="submit" aria-label="{esc(ui['search_button'])}">⌕</button>
        </form>
        <nav class="lang-switch" aria-label="{esc(ui['lang_label'])}">{switcher}</nav>
      </div>
    </div>
    <div class="container search-results" aria-live="polite"></div>{hero}
  </header>

  <main id="main"{main_attr}>
{page['body']}
  </main>

  <footer class="footer">
    <div class="container footer-content">
      <p>{esc(ui['footer_note'])}</p>
      <p>{esc(ui['footer_sources'])}</p>
      <p>© {date.today().year} UroWoman Kazakhstan · <a href="{link_base}privacy.html">{esc(ui['footer_privacy'])}</a></p>
    </div>
  </footer>

  <script src="{root}assets/search-index.js?v={versions['search-index.js']}" defer></script>
  <script src="{root}assets/script.js?v={versions['script.js']}" defer></script>
</body>
</html>
"""


def build():
    # Empty dist/ rather than deleting it, so a server running inside it keeps working.
    DIST.mkdir(exist_ok=True)
    for item in DIST.iterdir():
        shutil.rmtree(item) if item.is_dir() else item.unlink()
    shutil.copytree(SRC / "assets", DIST / "assets")

    pages = {lang: {} for lang in LANGS}
    for lang in LANGS:
        for path in sorted((SRC / "pages" / lang).glob("*.html")):
            pages[lang][path.stem] = parse_page(path)
    slugs = {lang: set(pages[lang]) for lang in LANGS}

    todos = [f"{lang}/{slug}" for lang in LANGS for slug, page in pages[lang].items() if "TODO" in page["body"]]
    if todos:
        print("warning: pages with unfinished TODO notes:", ", ".join(todos))

    missing = [f"{lang}/{slug}" for lang in LANGS for slug in slugs[DEFAULT_LANG] - slugs[lang] - {"404"}]
    if missing:
        print("warning: untranslated pages:", ", ".join(missing))

    # Search index: one entry per page, per language.
    search = {
        lang: [
            {"u": f"{slug}.html", "t": page["title"], "d": page["description"],
             "x": plain_text(page["hero"] + " " + page["body"])[:6000]}
            for slug, page in pages[lang].items() if slug not in ("404",)
        ]
        for lang in LANGS
    }
    (DIST / "assets" / "search-index.js").write_text(
        "window.UW_SEARCH=" + json.dumps(search, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    versions = {name: asset_hash(DIST / "assets" / name) for name in ("styles.css", "script.js", "search-index.js")}

    for lang in LANGS:
        out_dir = lang_dir(lang)
        out_dir.mkdir(parents=True, exist_ok=True)
        root = "" if lang == DEFAULT_LANG else "../"
        for slug, page in pages[lang].items():
            if slug == "404":
                continue
            (out_dir / f"{slug}.html").write_text(render(lang, slug, page, slugs, versions, root), encoding="utf-8")

    # 404 is served from arbitrary paths, so it links from the site root.
    if "404" in pages[DEFAULT_LANG]:
        (DIST / "404.html").write_text(
            render(DEFAULT_LANG, "404", pages[DEFAULT_LANG]["404"], slugs, versions, BASE_PATH, link_base=BASE_PATH),
            encoding="utf-8",
        )

    today = date.today().isoformat()
    entries = []
    for slug in sorted(slugs[DEFAULT_LANG] - {"404"}, key=lambda s: (s != "index", s)):
        for lang in LANGS:
            if slug not in slugs[lang]:
                continue
            links = "".join(
                f'\n    <xhtml:link rel="alternate" hreflang="{other}" href="{page_url(other, slug)}" />'
                for other in LANGS if slug in slugs[other]
            )
            entries.append(f"  <url>\n    <loc>{page_url(lang, slug)}</loc>\n    <lastmod>{today}</lastmod>{links}\n  </url>")
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(entries) + "\n</urlset>\n",
        encoding="utf-8",
    )
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}{BASE_PATH}sitemap.xml\n", encoding="utf-8")
    (DIST / "favicon.svg").write_bytes((SRC / "assets" / "favicon.svg").read_bytes())

    total = sum(len(p) for p in pages.values())
    print(f"built {total} pages into {DIST.relative_to(ROOT)}/")


def serve(port=8080):
    import functools
    import http.server
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    print(f"serving http://localhost:{port}")
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()


if __name__ == "__main__":
    build()
    if "--serve" in sys.argv:
        serve()
