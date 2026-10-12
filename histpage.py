"""Standalone public page with only the Histoire (maîtrises), for the Instagram bio."""
import html, os

def initials(n):
    return "".join(w[0] for w in n.replace(".", "").split()[:2]).upper()

def write(state, here):
    L = sorted(state.get("maitrises") or [], key=lambda y: y["year"], reverse=True)
    photo = {s["name"].lower(): s["photo"] for s in state.get("staff", []) if s.get("photo")}
    photo.update({k.lower(): v for k, v in (state.get("maitrisePhotos") or {}).items()})
    e = html.escape
    years, used = [], {}
    for i, y in enumerate(L):
        cards = []
        for m in y["members"]:
            ph = photo.get(m["name"].lower())
            if ph:
                cls = used.setdefault(ph, "p%d" % len(used))
                av = f'<span class="av {cls}" role="img" aria-label="{e(m["name"])}"></span>'
            else:
                av = f'<span class="av ini">{e(initials(m["name"]))}</span>'
            cards.append(f'<div class="card">{av}<span class="nm">{e(m["name"])}</span><span class="rl{" ct" if m["role"]=="CT" else ""}">{e(m["role"])}</span></div>')
        now = ' <span class="now">Actuelle</span>' if i == 0 else ""
        years.append(f'<section><h2>Maîtrise {e(y["year"].replace("-", "–"))}{now}</h2><div class="row" style="--n:{len(y["members"])}">{"".join(cards)}</div></section>')
    troop = e(state.get("troop", "Troupe Impeesa VPJ"))
    page = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Histoire · {troop}</title>
<meta name="description" content="Les maîtrises de la {troop}, année par année.">
<meta name="theme-color" content="#1e4636">
<link rel="icon" type="image/png" href="icon.png"><link rel="apple-touch-icon" href="icon.png">
<meta property="og:type" content="website"><meta property="og:url" content="https://troupeimpeesa.github.io/histoire.html">
<meta property="og:title" content="Histoire · {troop}"><meta property="og:description" content="Les maîtrises de la troupe, année par année.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap">
<style>
:root{{--bg:#fff;--surface:#f5f5f7;--fg:#111;--muted:#6e6e73;--accent:#1e4636;--navy:#1e4636;color-scheme:light}}
@media (prefers-color-scheme:dark){{:root{{--bg:#000;--surface:#161618;--fg:#f5f5f7;--muted:#98989d;--accent:#2f9e62;--navy:#2a6b4f;color-scheme:dark}}}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}}
.wrap{{max-width:720px;margin:0 auto;padding:28px 16px 56px}}
.kick{{font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--accent)}}
h1{{font-size:clamp(30px,8vw,42px);font-weight:800;letter-spacing:-.03em;margin:6px 0 4px}}
.sub{{color:var(--muted);margin:0 0 8px}}
section{{margin-top:24px}}
h2{{font-size:16px;font-weight:800;letter-spacing:-.01em;margin:0 2px 10px;display:flex;align-items:center;gap:8px}}
.now{{font-size:11px;font-weight:700;color:#fff;background:var(--accent);border-radius:999px;padding:2px 8px}}
.row{{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:8px}}
.card{{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;background:var(--surface);border-radius:16px;padding:14px 4px 12px;min-width:0}}
.av{{width:56px;height:56px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex:none}}
.av{{background:center/cover no-repeat}}
{"".join(".%s{background-image:url(%s)}" % (c, u) for u, c in used.items())}
.ini{{background:var(--navy);color:#fff;font-weight:700;font-size:17px}}
.nm{{font-weight:700;font-size:13px;line-height:1.2;overflow-wrap:anywhere}}
.rl{{font-size:11px;color:var(--muted)}}.rl.ct{{font-weight:800;color:var(--fg)}}
footer{{margin-top:36px;text-align:center;color:var(--muted);font-size:12px}}
</style>
</head>
<body>
<main class="wrap">
<div class="kick">{troop}</div>
<h1>Histoire</h1>
<p class="sub">Les maîtrises de la troupe, année par année.</p>
{"".join(years)}
<footer>{troop}</footer>
</main>
</body>
</html>
'''
    open(os.path.join(here, "histoire.html"), "w", encoding="utf-8").write(page)
