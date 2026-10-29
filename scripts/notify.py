#!/usr/bin/env python3
"""Notifications automatiques Troupe Impeesa (OneSignal).

1. Chaque jour à 20h (Beyrouth) : classement des patrouilles, à tout le monde.
2. Nouveau Quiz Prêt (lundi 14h) : à tout le monde.
3. Quiz Prêt : quand quelqu'un dépasse un joueur au classement de la semaine,
   le joueur dépassé reçoit une notification (qui l'a dépassé, sa place, celle de l'autre).

Lancé toutes les 5 minutes par .github/workflows/notify.yml.
Env : ONESIGNAL_API_KEY (secret), DRY=1 pour tester sans envoyer, FB_DUMP=fichier.json pour lire Firebase hors ligne.
"""
import json, os, re, sys, urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE = os.path.join(ROOT, 'data', 'notif-state.json')
FB = 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app/'
APP_ID = '3c44d331-0f92-49cd-b15b-00ae9c7e6d94'
SITE = 'https://troupeimpeesa.github.io/'
ICON = SITE + 'logo-192.png'
TZ = ZoneInfo('Asia/Beirut')
QB_FROM = '2026-10-26'
QF1 = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
QFULL = 10
AUTO_FROM, AUTO_MIN, AUTO_PTS = '2026-10-17', 10, 10
DAILY_HOUR = 20
DRY = os.environ.get('DRY') == '1'


def now():
    t = os.environ.get('NOW')  # pour les tests : 2026-10-29T20:05
    return datetime.fromisoformat(t).replace(tzinfo=TZ) if t else datetime.now(TZ)


def fb(path):
    if os.environ.get('FB_DUMP'):
        d = json.load(open(os.environ['FB_DUMP']))
        for k in path.split('/'):
            d = (d or {}).get(k)
        return d
    with urllib.request.urlopen(FB + path + '.json', timeout=30) as r:
        return json.loads(r.read().decode())


def site_state():
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    m = re.search(r'<script type="application/json" id="state">(.*?)</script>', s, re.S)
    S = json.loads(m.group(1))
    try:
        S['log'] = json.load(open(os.path.join(ROOT, 'data', 'points.json')))['log']
    except Exception:
        pass
    return S


def quiz_week(n):
    d = (n - timedelta(hours=14)).date()
    return (d - timedelta(days=d.weekday())).isoformat()


def ranking(W, U, pids):
    E = [{'k': k, 'p': U[k]['patrol'], 'sid': U[k].get('sid') or '', 'name': U[k].get('name') or '?',
          's': (W[k] or {}).get('s') or 0, 'at': (W[k] or {}).get('at') or 0}
         for k in (W or {}) if U.get(k) and U[k].get('ok') is True and U[k].get('role') != 'Maîtrise'
         and U[k].get('patrol') in pids]
    E.sort(key=lambda x: (-x['s'], x['at']))
    return E


def totals(S, U, A, today, cur):
    pids = {p['id'] for p in S['patrols']}
    t = {p['id']: 0 for p in S['patrols']}
    for l in S.get('log', []):
        if l.get('patrol') in t:
            t[l['patrol']] += float(l.get('pts') or 0)
    for m in S.get('meetings', []):
        if m['date'] < AUTO_FROM or m['date'] > today:
            continue
        for pid in m['patrols']:
            ids = {x['id'] for x in S['scouts'] if x['patrol'] == pid}
            k = len([i for i in m['present'] if i in ids])
            pts = 15 if ids and k == len(ids) else (AUTO_PTS if k >= AUTO_MIN else 0)
            if pid in t:
                t[pid] += pts
    for w, W in (A or {}).items():
        if w > cur or w < QB_FROM:
            continue
        E = ranking(W, U, pids)
        for i, x in enumerate(E[:10]):
            t[x['p']] += QF1[i]
        got = {x['sid'] for x in E if x['sid']}
        for p in S['patrols']:
            mem = [x for x in S['scouts'] if x['patrol'] == p['id']]
            if mem and all(x['id'] in got for x in mem):
                t[p['id']] += QFULL
    return t


def send(title, body, uid=None):
    msg = {'app_id': APP_ID, 'target_channel': 'push', 'headings': {'en': title}, 'contents': {'en': body},
           'url': SITE, 'chrome_web_icon': ICON, 'firefox_icon': ICON}
    if uid:
        msg['filters'] = [{'field': 'tag', 'key': 'uid', 'relation': '=', 'value': uid}]
    else:
        msg['included_segments'] = ['Total Subscriptions']
    print(('[DRY] ' if DRY else '') + 'SEND', uid or 'ALL', '|', title, '|', body)
    if DRY:
        return
    key = os.environ.get('ONESIGNAL_API_KEY')
    if not key:
        print('ONESIGNAL_API_KEY manquante, rien envoyé')
        return
    req = urllib.request.Request('https://api.onesignal.com/notifications?c=push', data=json.dumps(msg).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': 'Key ' + key})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(' ->', r.status, r.read().decode()[:200])
    except urllib.error.HTTPError as e:
        print(' -> ERREUR', e.code, e.read().decode()[:300])


def ordinal(n):
    return '1er' if n == 1 else f'{n}e'


def fmt(x):
    return str(int(x)) if float(x).is_integer() else f'{x:g}'


def main():
    n = now()
    today, cur = n.date().isoformat(), quiz_week(n)
    try:
        st = json.load(open(STATE))
    except Exception:
        st = {}
    old = json.dumps(st, sort_keys=True)
    S = site_state()
    pids = {p['id'] for p in S['patrols']}
    names = {p['id']: p['name'] for p in S['patrols']}
    U = fb('quiz/users') or {}
    A = fb('quiz/scores') or {}

    # 2. Nouveau Quiz Prêt
    if st.get('week') and st['week'] != cur:
        send('🆕 Nouveau Quiz Prêt !', 'Le quiz de la semaine est en ligne. Joue maintenant et gagne des points pour ta patrouille !')
    if st.get('week') != cur:
        st['week'], st['rank'] = cur, None

    # 3. Dépassements au Quiz Prêt (semaine en cours)
    E = ranking(A.get(cur) or {}, U, pids)
    new = {x['k']: i + 1 for i, x in enumerate(E)}
    prev = st.get('rank')
    if prev is not None:
        by = {x['k']: x for x in E}
        for k, r_old in prev.items():
            r_new = new.get(k)
            if not r_new or r_new <= r_old:
                continue
            passers = [x for x in E[:r_new - 1] if x['k'] not in prev or prev[x['k']] > r_old]
            if not passers:
                continue
            first = passers[-1]  # celui juste devant lui maintenant
            who = first['name'] + (f' et {len(passers) - 1} autre' + ('s' if len(passers) > 2 else '') if len(passers) > 1 else '')
            verb = "t'ont dépassé" if len(passers) > 1 else "t'a dépassé"
            send('⚡ Tu as été dépassé !',
                 f"{who} {verb} au Quiz Prêt. {first['name']} est {ordinal(new[first['k']])}, "
                 f"tu es maintenant {ordinal(r_new)}.", uid=k)
    st['rank'] = new

    # 1. Classement quotidien à 20h
    if n.hour >= DAILY_HOUR and st.get('daily') != today:
        t = totals(S, U, A, today, cur)
        order = sorted(t, key=lambda p: -t[p])
        medal = ['🥇', '🥈', '🥉', '4.']
        body = '  '.join(f'{medal[i]} {names[p]} {fmt(t[p])}' for i, p in enumerate(order))
        send('🏆 Classement des patrouilles', body)
        st['daily'] = today

    if json.dumps(st, sort_keys=True) != old:
        json.dump(st, open(STATE, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
        print('state mis à jour')


if __name__ == '__main__':
    main()
