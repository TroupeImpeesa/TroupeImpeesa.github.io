"""Liste les semaines du Quiz Prêt présentes dans Firebase (quiz/sets) : date, titre, nombre de questions, ouverture.
N'affiche JAMAIS les questions ni les réponses (les logs du dépôt sont publics)."""
import json, os
from datetime import datetime
from zoneinfo import ZoneInfo
import firebase_admin
from firebase_admin import credentials, db

firebase_admin.initialize_app(credentials.Certificate(json.loads(os.environ['FIREBASE_SA'])), {
    'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
S = db.reference('quiz/sets').get(shallow=True) or {}
TZ = ZoneInfo('Asia/Beirut')
for w in sorted(S):
    t = db.reference('quiz/sets/' + w + '/title').get() or '?'
    o = db.reference('quiz/sets/' + w + '/open').get()
    n = len(db.reference('quiz/sets/' + w + '/qs').get(shallow=True) or {})
    when = datetime.fromtimestamp(o / 1000, TZ).strftime('%Y-%m-%d %H:%M') if o else '?'
    print(f'QUIZWEEK {w} | {n} questions | ouvre {when} | {t}')
print('QUIZWEEKS', len(S))
