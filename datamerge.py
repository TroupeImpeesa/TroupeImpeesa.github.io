"""Apply the patrol files written by the website's Espace CP (data/p1.json ...) to a site state."""
import json, os

def apply_patrol(st, d):
    pid = d.get("patrol")
    if not pid or not isinstance(d.get("members"), list):
        return
    old = {x["id"] for x in st["scouts"] if x["patrol"] == pid}
    mine = [{"id": m["id"], "name": m["name"], "patrol": pid, "role": m.get("role", ""), "stage": int(m.get("stage", 0)),
             "badges": len(m.get("badges") or []), "badgeList": list(m.get("badges") or [])} for m in d["members"]]
    idx = next((i for i, x in enumerate(st["scouts"]) if x["patrol"] == pid), None)
    rest = [x for x in st["scouts"] if x["patrol"] != pid]
    cut = len(rest) if idx is None else len([x for x in st["scouts"][:idx] if x["patrol"] != pid])
    st["scouts"] = rest[:cut] + mine + rest[cut:]
    old |= {x["id"] for x in mine}
    for m in st["meetings"]:
        m["patrols"] = [x for x in m["patrols"] if x != pid]
        m["present"] = [x for x in m["present"] if x not in old]
    for x in d.get("meetings") or []:
        if not x.get("date"):
            continue
        m = next((y for y in st["meetings"] if y["date"] == x["date"]), None)
        if m is None:
            m = {"id": "m-" + x["date"], "date": x["date"], "patrols": [], "present": []}
            st["meetings"].append(m)
        m["patrols"].append(pid)
        m["present"] += [i for i in x.get("present") or [] if i not in m["present"]]
    st["meetings"] = sorted([m for m in st["meetings"] if m["patrols"]], key=lambda m: m["date"])


def apply_all(state, root):
    pf = os.path.join(root, "data", "points.json")
    if os.path.exists(pf):
        d = json.load(open(pf, encoding="utf-8"))
        if isinstance(d.get("log"), list):
            state["log"] = d["log"]
    for p in state.get("patrols", []):
        f = os.path.join(root, "data", p["id"] + ".json")
        if os.path.exists(f):
            apply_patrol(state, json.load(open(f, encoding="utf-8")))
