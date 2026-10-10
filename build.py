"""Build the public site from the Claude admin page.

Usage: python3 build.py <full-artifact-page.html> [<folder with downloaded assets>]
Photos stored as artifact assets (src "/_blob/<id>") must first be
downloaded into that folder, one file per asset named <id>.<ext>.

Writes index.html and puts every slideshow photo in photos/<hash>.jpg,
so the page stays small and phones can cache the photos.
"""
import base64, hashlib, json, os, re, sys

src = open(sys.argv[1], encoding="utf-8").read()
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(here, "photos"), exist_ok=True)

reset = re.search(r"<head>.*?<style>(.*?)</style></head>", src, re.S)
reset = reset.group(1) if reset else ""
body = src[src.index("<title>"):]
body = body[: body.rindex("</body>")] if "</body>" in body else body
title = re.search(r"<title>.*?</title>", body).group(0)
link = re.search(r'<link rel="stylesheet"[^>]*>', body).group(0)
style = re.search(r"<style>[\s\S]*?</style>", body).group(0)
rest = body[body.index('<div class="wrap" id="app">'):]

m = re.search(r'(id="state">)([\s\S]*?)(</script>)', rest)
state = json.loads(m.group(2))
used = set()
for ph in state.get("photos", []):
    s = ph.get("src", "")
    raw = None
    if s.startswith("data:image"):
        raw = base64.b64decode(s.split(",", 1)[1])
    elif s.startswith("/_blob/") and len(sys.argv) > 2:
        aid = s[len("/_blob/"):]
        hits = [f for f in os.listdir(sys.argv[2]) if f.startswith(aid)]
        if not hits:
            sys.exit("missing downloaded asset " + aid)
        raw = open(os.path.join(sys.argv[2], hits[0]), "rb").read()
    if raw is not None:
        name = hashlib.sha1(raw).hexdigest()[:12] + ".jpg"
        path = os.path.join(here, "photos", name)
        if not os.path.exists(path):
            open(path, "wb").write(raw)
        ph["src"] = "photos/" + name
    if ph.get("src", "").startswith("photos/"):
        used.add(ph["src"][len("photos/"):])
state["cover"] = ""
for f in os.listdir(os.path.join(here, "photos")):
    if f not in used:
        os.remove(os.path.join(here, "photos", f))

js = json.dumps(state, ensure_ascii=False).replace("<", "\\u003c")
rest = rest[: m.start(2)] + js + rest[m.end(2):]

out = (
    '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '<meta name="description" content="Troupe Impeesa VPJ : annonces, points des patrouilles, progression et activités.">\n'
    + '<meta name="theme-color" content="#1e4636">\n'
    '<link rel="icon" type="image/png" href="icon.png">\n<link rel="apple-touch-icon" href="icon.png">\n'
    '<meta property="og:type" content="website">\n<meta property="og:url" content="https://troupeimpeesa.github.io/">\n'
    '<meta property="og:title" content="Troupe Impeesa VPJ">\n'
    '<meta property="og:description" content="Annonces, calendrier, patrouilles et points de la troupe.">\n'
    + (('<meta property="og:image" content="https://troupeimpeesa.github.io/' + state["photos"][0]["src"] + '">\n') if state.get("photos") else "")
    + title + "\n<style>" + reset + "</style>\n" + link + "\n" + style
    + "\n</head>\n<body>\n" + rest + "\n</body>\n</html>\n"
)
# Phones keep a saved copy of the page; on every visit, check for a newer
# build and reload once if there is one.
bid = hashlib.sha1(out.encode()).hexdigest()[:12]
fresh = (
    '<script>(function(){var B="' + bid + '";try{if(!/^https?:/.test(location.protocol))return;'
    'fetch(location.pathname+"?fresh="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():""}).then(function(t){'
    'var m=t.match(/data-build="(\\w+)"/);if(!m||m[1]===B)return;'
    'var k="ti-reloaded-"+m[1];try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){}'
    'return fetch(location.href.split("#")[0],{cache:"reload"}).then(function(){location.reload()})}).catch(function(){})}catch(e){}})();</script>\n'
)
out = out.replace("\n</body>", '\n<meta data-build="' + bid + '">\n' + fresh + "</body>", 1)
open(os.path.join(here, "index.html"), "w", encoding="utf-8").write(out)
print("index.html", round(len(out.encode()) / 1024), "KB,", len(used), "photos")
