"""Copie la galerie Souvenirs (Firebase « gallery ») dans le site : photos/g-*.jpg + miniatures photos/t-*.jpg + data/gallery.json.

Le site lit data/gallery.json (rapide, mis en cache) au lieu de télécharger toutes les photos depuis Firebase.
Lancé par l'Action delete-accounts.yml toutes les 10 min. Besoin du secret GitHub FIREBASE_SA.
Ne modifie jamais Firebase.
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
out = os.path.join(root, 'data', 'gallery.json')
force = '--force' in sys.argv

at = db.reference('gallery/at').get() or 0
old = 0
if os.path.exists(out):
    try:
        old = json.load(open(out, encoding='utf-8')).get('at', 0)
    except Exception:
        old = 0
if not force and os.path.exists(out) and at <= old:
    print('Galerie inchangée.')
    sys.exit(0)

items = db.reference('gallery/items').get() or {}
if isinstance(items, list):
    items = {('i%03d' % i): v for i, v in enumerate(items) if v}
if not items:
    print('Galerie Firebase vide : le site garde ses photos par défaut.')
    sys.exit(0)


def save_jpg(im, name, q):
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
    open(os.path.join(photos, name), 'wb').write(buf.getvalue())


def thumb_of(im, key):
    name = 't-' + key + '.jpg'
    if not os.path.exists(os.path.join(photos, name)):
        save_jpg(ImageOps.fit(im, (480, 480), Image.LANCZOS), name, 78)
    return name


used, res = set(), []
for k in sorted(items):
    p = items[k] or {}
    src = p.get('src') or ''
    it = {'caption': str(p.get('caption') or '')[:40], 'hero': bool(p.get('hero'))}
    try:
        if src.startswith('data:image'):
            raw = base64.b64decode(src.split(',', 1)[1])
            key = hashlib.sha1(raw).hexdigest()[:12]
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
            im.thumbnail((1400, 1400), Image.LANCZOS)
            name = 'g-' + key + '.jpg'
            if not os.path.exists(os.path.join(photos, name)):
                save_jpg(im, name, 82)
            it['src'] = 'photos/' + name
        elif src.startswith('photos/') and os.path.exists(os.path.join(root, src)):
            key = hashlib.sha1(open(os.path.join(root, src), 'rb').read()).hexdigest()[:12]
            im = ImageOps.exif_transpose(Image.open(os.path.join(root, src))).convert('RGB')
            name = src[len('photos/'):]
            it['src'] = src
        else:
            if src:
                it['src'] = src
                res.append(it)
            continue
    except Exception as e:
        print('Photo ignorée', k, e)
        continue
    used.add(name)
    it['th'] = 'photos/' + thumb_of(im, key)
    used.add(it['th'][len('photos/'):])
    res.append(it)

for f in os.listdir(photos):
    if (f.startswith('g-') or f.startswith('t-')) and f not in used:
        os.remove(os.path.join(photos, f))
json.dump({'at': at, 'items': res}, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
print('Galerie copiée :', len(res), 'photos')
