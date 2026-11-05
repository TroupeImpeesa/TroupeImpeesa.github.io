"""Copie les modifications faites sur le site par impeesa.admin (Firebase site/edits) dans data/site-edits.json.

La synchro horaire (apply_data.py / build.py) applique ensuite ce fichier à la page Claude et au site.
Besoin du secret GitHub FIREBASE_SA.
"""
import json, os, sys

sa = os.environ.get('FIREBASE_SA', '').strip()
if not sa:
    print('Secret FIREBASE_SA absent : rien à faire.')
    sys.exit(0)
import firebase_admin
from firebase_admin import credentials, db

if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(json.loads(sa)), {
        'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
at = db.reference('site/at').get() or 0
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'site-edits.json')
old = 0
if os.path.exists(path):
    try:
        old = json.load(open(path, encoding='utf-8')).get('at', 0)
    except Exception:
        old = 0
if not at or at <= old:
    print('Pas de nouvelle modification admin.')
    sys.exit(0)
e = db.reference('site/edits').get() or {}
if not e.get('state'):
    sys.exit(0)
json.dump({'at': at, 'by': e.get('by', ''), 'state': json.loads(e['state'])}, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
print('Modifications admin copiées :', at)
