"""Standalone public page with only the Histoire (maîtrises), for the Instagram bio. Compact timeline."""
import html, os

def initials(n):
    return "".join(w[0] for w in n.replace(".", "").split()[:2]).upper()

def write(state, here):
    L = sorted(state.get("maitrises") or [], key=lambda y: y["year"], reverse=True)
    photo = {s["name"].lower(): s["photo"] for s in state.get("staff", []) if s.get("photo")}
    photo.update({k.lower(): v for k, v in (state.get("maitrisePhotos") or {}).items()})
    e = html.escape
    PCOL = {"poney": "#111111", "boa": "#c62828", "requins": "#2c5d8a", "castor": "#8a6a12"}
    years, used = [], {}
    for i, y in enumerate(L):
        chips = []
        for m in y["members"]:
            ph = photo.get(m["name"].lower())
            if ph:
                cls = used.setdefault(ph, "p%d" % len(used))
                av = f'<span class="av {cls}" role="img" aria-label="{e(m["name"])}"></span>'
            else:
                av = f'<span class="av ini">{e(initials(m["name"]))}</span>'
            chips.append(f'<span class="chip{" ct" if m["role"]=="CT" else ""}">{av}{e(m["name"])} <em>{e(m["role"])}</em></span>')
        now = ' <span class="now">Actuelle</span>' if i == 0 else ""
        hp = y.get("hp") or {}
        hpb = ""
        if hp.get("patrols"):
            rows = "".join(f'<div><i style="background:{PCOL.get(x["name"].lower(), "#0f2342")}">{e(x["name"][:1])}</i><b>{e(x["name"])}</b><span>CP {e(x["cp"])} · SP {e(x["sp"])}</span></div>' for x in hp["patrols"])
            hpb = f'<div class="hp"><div class="lab">Haute Patrouille</div>{rows}</div>'
        th = []
        if hp.get("photo"):
            th.append(("HP", hp["photo"]))
        tr = y.get("troupe") or {}
        if tr.get("photo"):
            th.append(("La Troupe", tr["photo"]))
        tb = ('<div class="th">' + "".join(f'<span><a href="{e(u)}" target="_blank" rel="noopener"><img src="{e(u)}" alt="{e(l)} {e(y["year"])}" loading="lazy"></a><small>{e(l)}</small></span>' for l, u in th) + '</div>') if th else ""
        years.append(f'<li class="{"cur" if i == 0 else ""}"><h2>{e(y["year"].replace("-", "–"))}{now}</h2><div class="chips">{"".join(chips)}</div>{hpb}{tb}</li>')
    troop = e(state.get("troop", "Troupe Impeesa VPJ"))
    page = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Histoire · {troop}</title>
<meta name="description" content="La {troop}, année par année.">
<meta name="theme-color" content="#0f2342">
<link rel="icon" type="image/png" href="icon.png"><link rel="apple-touch-icon" href="icon.png">
<meta property="og:type" content="website"><meta property="og:url" content="https://troupeimpeesa.github.io/histoire.html">
<meta property="og:title" content="Histoire · {troop}"><meta property="og:description" content="La troupe, année par année.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;600;700;800&display=swap">
<style>
:root{{--bg:#f4f5f8;--surface:#fff;--fg:#0e1a2e;--muted:#5d6b80;--line:#e2e6ee;--navy:#0f2342;--zy:#f2b23a;color-scheme:light}}
@media (prefers-color-scheme:dark){{:root{{--bg:#0a1120;--surface:#121b2d;--fg:#e8edf5;--muted:#9aa8b9;--line:#22304a;--navy:#1b3a6b;color-scheme:dark}}}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}}
header{{background:#0f2342;color:#fff}}
header .in{{max-width:720px;margin:0 auto;padding:calc(28px + env(safe-area-inset-top,0px)) 16px 40px}}
.kick{{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--zy)}}
h1{{font:400 clamp(40px,10vw,56px)/1 "DM Serif Display",Georgia,serif;margin:8px 0 6px}}
.sub{{opacity:.8;margin:0}}
.wrap{{max-width:720px;margin:0 auto;padding:28px 16px 56px}}
ol{{list-style:none;margin:0;padding:0;position:relative}}
ol::before{{content:"";position:absolute;left:7px;top:8px;bottom:8px;width:2px;background:var(--line)}}
li{{position:relative;padding:0 0 24px 30px}}
li::before{{content:"";position:absolute;left:0;top:4px;width:16px;height:16px;border-radius:50%;background:var(--bg);border:3px solid var(--muted)}}
li.cur::before{{border-color:var(--zy);background:var(--zy);box-shadow:0 0 0 5px rgba(242,178,58,.22)}}
h2{{display:flex;align-items:center;gap:8px;font:400 22px/1.1 "DM Serif Display",Georgia,serif;margin:0 0 8px}}
.now{{font:700 10.5px Inter,sans-serif;background:var(--zy);color:#1b1300;border-radius:99px;padding:2px 8px}}
.chips{{display:flex;flex-wrap:wrap;gap:6px}}
.chip{{display:inline-flex;align-items:center;gap:7px;background:var(--surface);border-radius:99px;padding:3px 10px 3px 3px;font-weight:600;font-size:13px}}
.chip em{{font-style:normal;font-weight:800;font-size:10px;color:var(--muted);letter-spacing:.06em}}.chip.ct em{{color:var(--fg)}}
.av{{width:26px;height:26px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;background:center/cover no-repeat}}
{"".join(".%s{background-image:url(%s)}" % (c, u) for u, c in used.items())}
.ini{{background:var(--navy);color:#fff;font-weight:700;font-size:10px}}
.hp{{margin-top:10px;display:grid;gap:4px;font-size:13px;color:var(--muted)}}
.hp .lab{{font-weight:700;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase}}
.hp div{{display:flex;align-items:center;gap:8px}}
.hp i{{flex:none;width:18px;height:18px;border-radius:50%;color:#fff;font:800 10px/18px Inter,sans-serif;text-align:center;font-style:normal}}
.hp b{{color:var(--fg);min-width:58px}}
.th{{display:flex;gap:8px;margin-top:10px}}
.th a{{display:block;width:92px;height:68px;border-radius:10px;overflow:hidden;background:var(--surface)}}
.th img{{width:100%;height:100%;object-fit:cover;display:block}}
.th small{{display:block;font-size:10.5px;color:var(--muted);margin-top:3px;text-align:center}}
footer{{margin-top:24px;text-align:center;color:var(--muted);font-size:12px}}
footer a{{color:inherit}}
</style>
</head>
<body>
<header><div class="in"><div class="kick">{troop}</div><h1>Histoire</h1><p class="sub">La troupe, année par année.</p></div></header>
<main class="wrap">
<ol>{"".join(years)}</ol>
<footer><a href="./">troupeimpeesa.github.io</a></footer>
</main>
</body>
</html>
'''
    open(os.path.join(here, "histoire.html"), "w", encoding="utf-8").write(page)
