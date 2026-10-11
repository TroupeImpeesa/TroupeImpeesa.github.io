"""Copy the patrol files (data/p1.json ...) into the Claude admin page.

Usage: python3 apply_data.py <full admin page.html> <out content.html>
Writes <out> (the page without its outer skeleton, ready to publish) and
prints CHANGED or UNCHANGED depending on whether scouts/meetings differ.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datamerge import apply_all

page, out = sys.argv[1], sys.argv[2]
src = open(page, encoding="utf-8").read()
m = re.search(r'(id="state">)([\s\S]*?)(</script>)', src)
state = json.loads(m.group(2))
before = json.dumps([state["scouts"], state["meetings"]], sort_keys=True)
apply_all(state, os.path.dirname(os.path.abspath(__file__)))
after = json.dumps([state["scouts"], state["meetings"]], sort_keys=True)
js = json.dumps(state, ensure_ascii=False).replace("<", "\\u003c")
full = src[: m.start(2)] + js + src[m.end(2):]
body = full[full.index("<title>"):]
if body.rstrip().endswith("</body></html>"):
    body = body.rstrip()[: -len("</body></html>")]
open(out, "w", encoding="utf-8").write(body)
print("CHANGED" if before != after else "UNCHANGED")
