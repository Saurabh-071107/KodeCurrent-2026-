import urllib.request
import json

tests = [
    ("Backend Health", "http://localhost:5000/api/health"),
    ("FastAPI AI Health", "http://127.0.0.1:8000/health"),
    ("Bare Acts Catalog", "http://localhost:5000/api/bare-acts"),
    ("Document Verification Sample", "http://localhost:5000/api/verify/sample"),
    ("Legal Templates Catalog", "http://localhost:5000/api/templates"),
    ("Citizen Helpline Glossary", "http://localhost:5000/api/citizen/glossary"),
    ("Legal Library Resources", "http://localhost:5000/api/library"),
]

print("=== VERIFYING LIVE APPLICATION SERVICES & AI API FEATURES ===")
for name, url in tests:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DraftMateVerifier/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
            print(f"[PASS] {name:<30} -> HTTP {status} (Keys: {list(data.keys())})")
    except Exception as e:
        print(f"[FAIL] {name:<30} -> Error: {e}")
