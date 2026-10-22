"""Build dist/e3d-setup-generator.html: inline every stylesheet and script referenced by
src/index.html into one self-contained file. Dev machine only; the output is committed.
Usage: python3 tools/build.py
"""
import pathlib, re, datetime, subprocess

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'src'
html = (src / 'index.html').read_text(encoding='utf-8')

def read(rel):
    p = (src / rel).resolve()
    assert src in p.parents, rel
    return p.read_text(encoding='utf-8')

def inline_css(m):
    return '<style>/* ' + m.group(1) + ' */\n' + read(m.group(1)) + '\n</style>'

def inline_js(m):
    code = read(m.group(1)).replace('</script', '<\\/script')
    return '<script>/* ' + m.group(1) + ' */\n' + code + '\n</script>'

html, ncss = re.subn(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html, njs = re.subn(r'<script src="([^"]+)"></script>', inline_js, html)
html = html.replace('<!-- Dev page: open directly from disk. tools/build.py inlines everything below into dist/. -->', '')

try:
    rev = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=root, capture_output=True, text=True).stdout.strip()
except OSError:
    rev = ''
stamp = '<!-- E3D Setup Generator · built ' + datetime.date.today().isoformat() + (' · ' + rev if rev else '') + ' · single file, offline -->\n'
html = html.replace('<!doctype html>\n', '<!doctype html>\n' + stamp, 1)

# Offline guarantee: no external URLs in src/href/url()/@import.
bad = re.findall(r'''(?:src|href)\s*=\s*["']https?://|url\(\s*["']?https?://|@import\s+url''', html)
assert not bad, 'external reference found: %r' % bad[:3]
assert '<script src=' not in html and 'rel="stylesheet" href=' not in html

out = root / 'dist' / 'e3d-setup-generator.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8', newline='\n')
print('built %s (%d KB, %d css, %d js)' % (out.relative_to(root), out.stat().st_size // 1024, ncss, njs))
