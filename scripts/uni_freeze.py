"""Fige les points de l'Université Impeesa (31 oct 2026) dans data/points.json."""
import json, os, re, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FB = 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app/'
EV = '2026-10-31'
COLS = ['LIP201', 'BDG207', 'LBP224', 'BPR502', 'VDP301', 'EL']
UPTS = [160, 130, 110, 100]
with urllib.request.urlopen(FB + 'uni/' + EV + '/grades.json', timeout=30) as r:
    G = json.loads(r.read().decode()) or {}
s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
S = json.loads(re.search(r'<script type="application/json" id="state">(.*?)</script>', s, re.S).group(1))
def gpa(sid):
    v = [x for k, x in (G.get(sid) or {}).items() if k in COLS and isinstance(x, (int, float))]
    return sum(v) / len(v) if v else None
P = {}
for p in S['patrols']:
    g = [gpa(x['id']) for x in S['scouts'] if x['patrol'] == p['id']]
    g = [x for x in g if x is not None]
    if g:
        P[p['id']] = sum(g) / len(g)
vals = sorted({round(x * 100) for x in P.values()}, reverse=True)
pf = os.path.join(ROOT, 'data', 'points.json')
D = json.load(open(pf, encoding='utf-8'))
D['log'] = [l for l in D['log'] if not str(l.get('id', '')).startswith('uni-')]
for p in S['patrols']:
    if p['id'] not in P:
        continue
    rk = vals.index(round(P[p['id']] * 100))
    D['log'].append({'id': 'uni-' + p['id'] + '-' + EV, 'patrol': p['id'], 'cat': 'jeux', 'pts': UPTS[rk] if rk < 4 else 0,
                     'reason': 'Université Impeesa : %d%s place, GPA %.2f / 4' % (rk + 1, 'e' if rk else 're', P[p['id']]), 'date': EV})
json.dump(D, open(pf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(P), len(G), 'scouts notés')
