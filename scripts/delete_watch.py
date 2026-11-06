"""Surveille en continu quiz/delq et efface tout de suite les connexions Firebase des comptes supprimés depuis le site.

Tourne ~5 h 40 puis la GitHub Action se relance elle-même (le planning GitHub « toutes les 10 min » ne passe en vrai que toutes les quelques heures).
Besoin du secret GitHub FIREBASE_SA.
"""
import json, os, sys, time

sa = os.environ.get('FIREBASE_SA', '').strip()
if not sa:
    print('Secret FIREBASE_SA absent : rien à faire.')
    sys.exit(0)
import firebase_admin
from firebase_admin import auth, credentials, db

firebase_admin.initialize_app(credentials.Certificate(json.loads(sa)), {
    'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
end = time.time() + float(os.environ.get('WATCH_MIN', '340')) * 60
while time.time() < end:
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
