"""Copie les photos des saints (Firebase « gallery/saints », images base64) en fichiers photos/s-*.jpg + data/saints-photos.json.

Avant, chaque visiteur téléchargeait toutes ces images depuis Firebase à chaque ouverture de l'accueil (lent).
Maintenant le site lit data/saints-photos.json (petit, mis en cache) ; seul impeesa.admin écoute Firebase en direct.
Lancé par l'Action delete-accounts.yml toutes les 10 min. Ne modifie jamais Firebase.
"""
import base64, hashlib, io, json, os, sys

sa = os.environ.get('FIREBASE_SA', '').strip()
if not sa:
    print('Secret FIREBASE_SA absent : rien à faire.')
    sys.exit(0)
import firebase_admin
from firebase_admin import credentials, db
from PIL import Image, ImageOps

if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(json.loads(sa)), {
        'databaseURL': 'https://troupe-impeesa-default-rtdb.europe-west1.firebasedatabase.app'})

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
photos = os.path.join(root, 'photos')
out = os.path.join(root, 'data', 'saints-photos.json')
os.makedirs(photos, exist_ok=True)

v = db.reference('gallery/saints').get() or {}
if isinstance(v, list):
    v = {str(i): x for i, x in enumerate(v) if x}
res, used = {}, set()
for sid in sorted(v):
    src = v[sid]
    if not isinstance(src, str) or not src:
        continue
    if not src.startswith('data:image'):
        res[sid] = src
        continue
    try:
        raw = base64.b64decode(src.split(',', 1)[1])
        name = 's-' + hashlib.sha1(raw).hexdigest()[:12] + '.jpg'
        p = os.path.join(photos, name)
        if not os.path.exists(p):
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
            im.thumbnail((480, 480), Image.LANCZOS)
            im.save(p, 'JPEG', quality=80, optimize=True, progressive=True)
        used.add(name)
        res[sid] = 'photos/' + name
    except Exception as e:
        print('Photo ignorée', sid, e)

for f in os.listdir(photos):
    if f.startswith('s-') and f not in used:
        os.remove(os.path.join(photos, f))
new = json.dumps(res, ensure_ascii=False, sort_keys=True)
if not os.path.exists(out) or open(out, encoding='utf-8').read() != new:
    open(out, 'w', encoding='utf-8').write(new)
print('Saints :', len(res), 'photos')
