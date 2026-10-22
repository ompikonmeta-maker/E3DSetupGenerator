"""Copy the user's MD3 toolkit (docs/material-design-3-project) into src/ui/md3 for offline use.
Dev-machine only; re-run after the toolkit changes.
  - drops the Google Fonts @import and uses the system font stack (Segoe UI on Windows)
  - icon names in components render through MD3Icon(name) (inline SVG from src/ui/icons.js)
Usage: python3 tools/vendor-md3.py
"""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
src, dst = root / 'docs/material-design-3-project', root / 'src/ui/md3'
dst.mkdir(parents=True, exist_ok=True)
SYS = '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif'

css = (src / 'md3-tokens.css').read_text(encoding='utf-8')
css, n = re.subn(r"^@import url\('https://fonts\.googleapis\.com[^\n]*\n", '', css, flags=re.M)
assert n == 1, 'Google Fonts @import not found'
css = re.sub(r"(--md-sys-typescale-font-(?:brand|plain)):[^;]*;", r"\1: " + SYS + ";", css)
assert 'googleapis' not in css
(dst / 'md3-tokens.css').write_text('/* Vendored by tools/vendor-md3.py: offline (no web fonts). */\n' + css, encoding='utf-8')

js = (src / 'md3-components.js').read_text(encoding='utf-8')
js, n = re.subn(r'(<span class="md-ic"[^>]*>)\$\{(\w+)\}(</span>)', r'\1${MD3Icon(\2)}\3', js)
js, m = re.subn(r"'<span class=\"md-ic\">check</span>'", "'<span class=\"md-ic\">' + MD3Icon('check') + '</span>'", js)
assert n >= 8 and m == 1, (n, m)
# checkbox glyphs (icon-font codepoints) -> plain Unicode check / dash from the system font
js, k = re.subn(r"\\\\e15b' : '\\\\e5ca'", lambda m: "\\\\2013' : '\\\\2713'", js)
assert k == 1, 'checkbox glyphs'
js = js.replace("font-family:'Material Symbols Outlined';", "display:inline-flex;")
shim = ("/* Vendored by tools/vendor-md3.py: icons via MD3Icon(name) -> inline SVG (no icon font). */\n"
        "var MD3Icon = function (n) { return (globalThis.E3DIcons && globalThis.E3DIcons.svg(n)) || ''; };\n")
(dst / 'md3-components.js').write_text(shim + js, encoding='utf-8')
(dst / 'md3-dynamic-color.js').write_text((src / 'md3-dynamic-color.js').read_text(encoding='utf-8'), encoding='utf-8')
for f in dst.iterdir():
    assert 'googleapis' not in f.read_text(encoding='utf-8'), f
print('vendored', n + m, 'icon sites ->', dst.relative_to(root))
