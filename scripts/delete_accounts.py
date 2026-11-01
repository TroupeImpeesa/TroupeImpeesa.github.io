"""Supprime de Firebase Authentication les comptes retirés depuis l'Espace admin du site.

Le site écrit quiz/delq/<uid> quand l'admin supprime un compte ; ce script efface
la connexion (Authentication) puis retire l'entrée de la file.
Besoin du secret GitHub FIREBASE_SA (clé JSON d'un compte de service Firebase).
"""
import json, os, sys

sa = os.environ.get('FIREBASE_SA', '').strip()
if not sa:
    print('Secret FIREBASE_SA absent : rien à faire.')
    sys.exit(0)

import firebase_admin
from firebase_admin import auth, credentials, db

firebase_admin.initialize_app(credentials.Certificate(json.loads(sa)), {
    'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
q = db.reference('quiz/delq').get() or {}
for uid, info in q.items():
    name = (info or {}).get('name', '')
    if db.reference('quiz/users/' + uid).get():
        print('Ignoré (profil encore présent) :', name or uid)
        continue
    try:
        auth.delete_user(uid)
        print('Connexion supprimée :', name or uid)
    except auth.UserNotFoundError:
        print('Déjà supprimée :', name or uid)
    db.reference('quiz/delq/' + uid).delete()
print(len(q), 'demande(s) traitée(s)')
