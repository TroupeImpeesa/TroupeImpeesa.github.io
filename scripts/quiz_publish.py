"""Met un set du Quiz Prêt dans Firebase (quiz/sets/<semaine>), ouvert tout de suite.
La bonne réponse « a » est encodée comme sur le site : a = (vraie + (i*7+3) % 4) % 4."""
import json, os, time
import firebase_admin
from firebase_admin import credentials, db

firebase_admin.initialize_app(credentials.Certificate(json.loads(os.environ['FIREBASE_SA'])), {
    'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})
S = json.load(open('scripts/quiz_new.json', encoding='utf-8'))
w = S.pop('week')
S['qs'] = [{'q': q['q'], 'o': q['o'], 'a': (q['ok'] + (i * 7 + 3) % 4) % 4} for i, q in enumerate(S['qs'])]
S['open'] = int(time.time() * 1000) - 60000
ref = db.reference('quiz/sets/' + w)
if ref.get():
    print('::warning::', w, 'existe déjà, remplacé')
ref.set(S)
print(w, len(S['qs']), 'questions, ouvert')
