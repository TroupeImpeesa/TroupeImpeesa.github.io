"""Copie data/quiz.json dans Firebase (quiz/sets/<semaine>) avec l'heure d'ouverture, puis le fichier peut être retiré du dépôt."""
import json, os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import firebase_admin
from firebase_admin import credentials, db

OPEN = {'2026-11-02': '2026-11-01T18:00:00+02:00'}
TZ = ZoneInfo('Asia/Beirut')
firebase_admin.initialize_app(credentials.Certificate(json.loads(os.environ['FIREBASE_SA'])), {
    'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
Q = json.load(open('data/quiz.json', encoding='utf-8'))
for w, st in Q['weeks'].items():
    t = datetime.fromisoformat(w).replace(hour=14, tzinfo=TZ)
    if w in OPEN:
        t = min(t, datetime.fromisoformat(OPEN[w]))
    st = dict(st)
    st['open'] = int(t.timestamp() * 1000)
    db.reference('quiz/sets/' + w).set(st)
    print(w, 'ouvre', t.isoformat(), len(st.get('qs', [])), 'questions')
