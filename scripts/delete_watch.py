"""Surveille en continu quiz/delq et efface tout de suite les connexions Firebase des comptes supprimés depuis le site.

Tourne ~5 h 40 puis la GitHub Action se relance elle-même (le planning GitHub « toutes les 10 min » ne passe en vrai que toutes les quelques heures).
Besoin du secret GitHub FIREBASE_SA.
"""
import json, os, sys, time, urllib.request

sa = os.environ.get('FIREBASE_SA', '').strip()
if not sa:
    print('Secret FIREBASE_SA absent : rien à faire.')
    sys.exit(0)
import firebase_admin
from firebase_admin import auth, credentials, db

firebase_admin.initialize_app(credentials.Certificate(json.loads(sa)), {
    'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
end = time.time() + float(os.environ.get('WATCH_MIN', '340')) * 60


def kick_notify():
    """Le planning GitHub de notify.yml saute la plupart des passages : on le relance d'ici toutes les 10 min
    (notify relance aussi « Supprimer les comptes retirés »). Le script notify décide lui-même s'il y a quelque chose à envoyer."""
    tok, repo = os.environ.get('GH_TOKEN', ''), os.environ.get('GITHUB_REPOSITORY', '')
    if not tok or not repo:
        return
    req = urllib.request.Request(f'https://api.github.com/repos/{repo}/actions/workflows/notify.yml/dispatches',
                                 data=b'{"ref":"main"}', method='POST',
                                 headers={'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json'})
    try:
        urllib.request.urlopen(req, timeout=20).read()
        print(time.strftime('%H:%M:%S'), 'Notifications relancées', flush=True)
    except Exception as e:
        print('Relance notifications impossible :', e, flush=True)


slot = None
while time.time() < end:
    if int(time.time() // 600) != slot:  # à :00, :10, :20…
        slot = int(time.time() // 600)
        kick_notify()
    try:
        q = db.reference('quiz/delq').get() or {}
        for uid, info in q.items():
            name = (info or {}).get('name', '')
            if db.reference('quiz/users/' + uid).get():
                continue  # profil encore présent : pas une vraie suppression
            try:
                auth.delete_user(uid)
                print(time.strftime('%H:%M:%S'), 'Connexion supprimée :', name or uid, flush=True)
            except auth.UserNotFoundError:
                print(time.strftime('%H:%M:%S'), 'Déjà supprimée :', name or uid, flush=True)
            db.reference('quiz/delq/' + uid).delete()
    except Exception as e:
        print('Erreur (on réessaie) :', e, flush=True)
    time.sleep(20)
print('Fin de la surveillance, relance.')
