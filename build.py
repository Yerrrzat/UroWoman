#!/usr/bin/env python3
"""Static site builder for UroWoman Kazakhstan.

Reads page fragments from site/pages/<lang>/<slug>.html, wraps them in the
shared layout and writes a ready-to-host site into dist/.

    python build.py            # build into dist/
    python build.py --check    # build and fail on broken internal links
    python build.py --serve    # build and serve on http://localhost:8080

Only the Python standard library is used.

Environment variables:
    SITE_URL          public address (canonical links, sitemap). On Netlify the
                      built-in URL variable is used, so a custom domain is
                      picked up automatically once it is attached.
    GOATCOUNTER_CODE  GoatCounter site code (the "xxx" in xxx.goatcounter.com).
                      The counter is added only to production builds.
    SURVEY_ENDPOINT   Google Apps Script web app URL that stores consented,
                      anonymous questionnaire answers (see survey/README.md).
                      When set, the consent block is shown on the test page;
                      answers are actually sent only from production builds.
"""
import hashlib
import html
import json
import os
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "site"
DIST = ROOT / "dist"

# Public address of the site. Used for canonical links, hreflang and sitemap.
BASE_URL = (os.environ.get("SITE_URL") or os.environ.get("URL") or "http://localhost:8080").rstrip("/")
# Path the site is served from ("/" for a domain root, "/UroWoman/" for a GitHub Pages project site).
BASE_PATH = "/"

# Visitor statistics. Netlify sets CONTEXT to "production" only for the main branch,
# so deploy previews of other branches are not counted.
GOATCOUNTER_CODE = os.environ.get("GOATCOUNTER_CODE", "").strip()
IS_PRODUCTION = os.environ.get("CONTEXT", "production") == "production"
ANALYTICS_ENABLED = bool(GOATCOUNTER_CODE) and IS_PRODUCTION

# Research survey. Pages may contain "<!-- if survey -->A<!-- else -->B<!-- endif -->":
# A is kept when the endpoint is configured, B otherwise, so the privacy wording
# always matches what the site really does.
SURVEY_ENDPOINT = os.environ.get("SURVEY_ENDPOINT", "").strip()
SURVEY_ENABLED = bool(SURVEY_ENDPOINT)
SURVEY_RE = re.compile(r"<!-- if survey -->(.*?)(?:<!-- else -->(.*?))?<!-- endif -->", re.S)

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
        "menu": "Меню", "close": "Закрыть", "toc": "Содержание", "footer_sections": "Разделы", "footer_about": "О проекте",
        "footer_tagline": "Информационный проект о раннем выявлении и профилактике недержания мочи у женщин Казахстана.",
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
        "menu": "Мәзір", "close": "Жабу", "toc": "Мазмұны", "footer_sections": "Бөлімдер", "footer_about": "Жоба туралы",
        "footer_tagline": "Қазақстан әйелдеріндегі зәр ұстамауды ерте анықтау және алдын алу туралы ақпараттық жоба.",
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
        "menu": "Menu", "close": "Close", "toc": "Contents", "footer_sections": "Sections", "footer_about": "About",
        "footer_tagline": "An information project on early detection and prevention of urinary incontinence in women in Kazakhstan.",
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
    text = SURVEY_RE.sub(lambda m: m.group(1) if SURVEY_ENABLED else (m.group(2) or ""), text)
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


H2_RE = re.compile(r"<h2([^>]*)>(.*?)</h2>", re.S)


def slugify(text, used):
    base = re.sub(r"[^\w]+", "-", plain_text(text).lower()).strip("-")[:48] or "section"
    anchor, n = base, 2
    while anchor in used:
        anchor, n = f"{base}-{n}", n + 1
    used.add(anchor)
    return anchor


def with_toc(body, label):
    """Give every <h2> an id and return (body, toc_html); no TOC for fewer than 3 headings."""
    used, items = set(), []

    def add_id(match):
        attrs, text = match.group(1), match.group(2)
        existing = re.search(r'id="([^"]+)"', attrs)
        anchor = existing.group(1) if existing else slugify(text, used)
        items.append((anchor, plain_text(text)))
        return match.group(0) if existing else f'<h2 id="{anchor}"{attrs}>{text}</h2>'

    body = H2_RE.sub(add_id, body)
    if len(items) < 3:
        return body, ""
    links = "".join(f'<li><a href="#{a}">{html.escape(t)}</a></li>' for a, t in items)
    return body, (f'<nav class="toc" aria-label="{html.escape(label)}">'
                  f'<p class="toc-title">{html.escape(label)}</p><ol>{links}</ol></nav>')


CARDS_RE = re.compile(r"<!-- cards: (.*?) -->")
HERO_PARTS = (
    ("crumbs", re.compile(r'<p class="crumbs">.*?</p>', re.S)),
    ("h1", re.compile(r"<h1[^>]*>.*?</h1>", re.S)),
    ("lead", re.compile(r'<p class="lead">.*?</p>', re.S)),
)


def photo(name, root, cls=""):
    """Decorative photo from site/assets/img (credits are listed in CREDITS.md)."""
    attr = f' class="{cls}"' if cls else ""
    return f'<img{attr} src="{root}assets/img/{html.escape(name)}.webp" alt="" loading="lazy" decoding="async" />'


def render_cards(content, pages, root, link_base):
    """Replace "<!-- cards: slug, slug -->" with photo cards built from each page's metadata."""
    def cards(match):
        items = []
        for target in (name.strip() for name in match.group(1).split(",")):
            meta = pages[target]
            tag = f'<span class="card-tag">{html.escape(meta["tag"])}</span>' if meta.get("tag") else ""
            image = photo(meta["image"], root) if meta.get("image") else ""
            items.append(
                f'<a class="card" href="{link_base}{target}.html">'
                f'<span class="card-photo">{image}{tag}</span>'
                f'<span class="card-body"><strong>{html.escape(meta.get("card_title", meta["title"]))}</strong>'
                f'<span>{html.escape(meta.get("summary", meta["description"]))}</span></span></a>'
            )
        return '<div class="cards">' + "".join(items) + "</div>"
    return CARDS_RE.sub(cards, content)


def split_hero(content, page, root):
    """Move breadcrumbs, <h1> and lead out of the body into a full-width green page header."""
    parts = {}
    for key, pattern in HERO_PARTS:
        match = pattern.search(content)
        if match:
            parts[key] = match.group(0)
            content = content[:match.start()] + content[match.end():]
    if "h1" not in parts:
        return "", content
    image = f'<div class="page-hero-photo">{photo(page["image"], root)}</div>' if page.get("image") else ""
    text = "".join(parts.get(key, "") for key, _ in HERO_PARTS)
    hero = (f'<header class="page-hero{" has-photo" if image else ""}"><div class="wrap page-hero-grid">'
            f'<div class="page-hero-text">{text}</div>{image}</div></header>')
    return hero, content


def render(lang, slug, page, slugs, versions, root, link_base="", pages=None):
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

    # Layouts: "article" (reading column with an automatic table of contents),
    # "hub" (section index) and "page" (free-form, e.g. the home page).
    layout = page.get("layout", "page")
    body_class = f' class="layout-{esc(layout)}"'
    if SURVEY_ENABLED and IS_PRODUCTION:
        body_class += f' data-survey="{esc(SURVEY_ENDPOINT)}"'
    content = f"{page['hero']}\n{page['body']}" if page["hero"] else page["body"]
    content = render_cards(content, pages or {}, root, link_base)
    if layout == "article":
        hero, content = split_hero(content, page, root)
        content, toc = with_toc(content, ui["toc"])
        aside = f'<aside class="toc-wrap">{toc}</aside>' if toc else ""
        content = f'{hero}<div class="wrap article-grid{" has-toc" if toc else ""}">{aside}<div class="prose">\n{content}\n</div></div>'
    elif layout == "hub":
        hero, content = split_hero(content, page, root)
        content = f'{hero}<div class="wrap hub">\n{content}\n</div>'
    search_file = f"search-index-{lang}.js"
    footer_links = "".join(
        f'<li><a href="{link_base}{target}.html">{esc(label)}</a></li>' for target, label in ui["nav"][1:]
    )
    title = page["title"] if slug == "index" else f"{page['title']} — UroWoman Kazakhstan"
    analytics = ""
    if ANALYTICS_ENABLED:
        analytics = (f'\n  <script data-goatcounter="https://{esc(GOATCOUNTER_CODE)}.goatcounter.com/count" '
                     'async src="https://gc.zgo.at/count.js"></script>')
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
  <meta name="theme-color" content="#1f4d3f" />
  <link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&amp;family=Lora:ital,wght@0,500;0,600;1,500&amp;display=swap" />
  <link rel="stylesheet" href="{root}assets/styles.css?v={versions['styles.css']}" />
</head>
<body{body_class}>
  <a class="skip-link" href="#main">{esc(ui['skip'])}</a>
  <header class="site-header">
    <div class="wrap header-bar">
      <a class="brand" href="{link_base}index.html">UroWoman<span>Kazakhstan</span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" data-close="{esc(ui['close'])}">{esc(ui['menu'])}</button>
      <div class="site-menu" id="site-menu">
        <nav class="main-nav" aria-label="{esc(ui['nav_label'])}">{nav}</nav>
        <form class="site-search" role="search" data-index="{root}assets/search-index-{lang}.js?v={versions[search_file]}">
          <input type="search" name="q" placeholder="{esc(ui['search_placeholder'])}" aria-label="{esc(ui['search_label'])}" autocomplete="off" />
          <button type="submit">{esc(ui['search_button'])}</button>
        </form>
        <nav class="lang-switch" aria-label="{esc(ui['lang_label'])}">{switcher}</nav>
      </div>
    </div>
    <div class="wrap search-results" aria-live="polite"></div>
  </header>

  <main id="main">
{content}
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="brand">UroWoman<span>Kazakhstan</span></p>
        <p>{esc(ui['footer_tagline'])}</p>
      </div>
      <div>
        <p class="footer-title">{esc(ui['footer_sections'])}</p>
        <ul>{footer_links}</ul>
      </div>
      <div>
        <p class="footer-title">{esc(ui['footer_about'])}</p>
        <p>{esc(ui['footer_note'])}</p>
        <p>{esc(ui['footer_sources'])}</p>
      </div>
    </div>
    <div class="wrap footer-bottom">© {date.today().year} UroWoman Kazakhstan · <a href="{link_base}privacy.html">{esc(ui['footer_privacy'])}</a></div>
  </footer>

  <script src="{root}assets/script.js?v={versions['script.js']}" defer></script>{analytics}
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
    # One file per language, fetched by script.js on the first search only.
    for lang in LANGS:
        (DIST / "assets" / f"search-index-{lang}.js").write_text(
            "window.UW_SEARCH=" + json.dumps(search[lang], ensure_ascii=False, separators=(",", ":")) + ";\n",
            encoding="utf-8",
        )

    versions = {name: asset_hash(DIST / "assets" / name) for name in ["styles.css", "script.js"] + [f"search-index-{lang}.js" for lang in LANGS]}

    for lang in LANGS:
        out_dir = lang_dir(lang)
        out_dir.mkdir(parents=True, exist_ok=True)
        root = "" if lang == DEFAULT_LANG else "../"
        for slug, page in pages[lang].items():
            if slug == "404":
                continue
            (out_dir / f"{slug}.html").write_text(render(lang, slug, page, slugs, versions, root, pages=pages[lang]), encoding="utf-8")

    # 404 is served from arbitrary paths, so it links from the site root.
    if "404" in pages[DEFAULT_LANG]:
        (DIST / "404.html").write_text(
            render(DEFAULT_LANG, "404", pages[DEFAULT_LANG]["404"], slugs, versions, BASE_PATH,
                   link_base=BASE_PATH, pages=pages[DEFAULT_LANG]),
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
    print(f"built {total} pages into {DIST.relative_to(ROOT)}/"
          + (f" (GoatCounter: {GOATCOUNTER_CODE})" if ANALYTICS_ENABLED else " (analytics off)")
          + (" (survey on)" if SURVEY_ENABLED and IS_PRODUCTION else " (survey shown, not sending)" if SURVEY_ENABLED else " (survey off)"))


def check_links():
    """Return internal links and #anchors in dist/ that point nowhere."""
    broken = []
    for page in sorted(DIST.rglob("*.html")):
        text = page.read_text(encoding="utf-8")
        for href in re.findall(r'(?:href|src)="([^"]+)"', text):
            if href.startswith(("http:", "https:", "mailto:", "tel:")):
                continue
            path, _, fragment = html.unescape(href).partition("#")
            path = path.split("?")[0]
            if not path:
                target = page
            elif path.startswith("/"):
                target = DIST / path.lstrip("/")
            else:
                target = (page.parent / path).resolve()
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                broken.append(f"{page.relative_to(DIST)} -> {href}")
            elif fragment and target.suffix == ".html" and f'id="{fragment}"' not in target.read_text(encoding="utf-8"):
                broken.append(f"{page.relative_to(DIST)} -> {href} (missing anchor)")
    return broken


def serve(port=8080):
    import functools
    import http.server
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    print(f"serving http://localhost:{port}")
    http.server.ThreadingHTTPServer(("", port), handler).serve_forever()


if __name__ == "__main__":
    build()
    if "--check" in sys.argv:
        broken = check_links()
        if broken:
            print("broken links:\n  " + "\n  ".join(broken))
            sys.exit(1)
        print("links ok")
    if "--serve" in sys.argv:
        serve()
