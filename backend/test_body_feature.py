"""
Body Format Feature - API Test Suite
Tests: DB persistence and proxy runner logic
"""
import requests, json, sys

BASE_API = "http://localhost:5000/api"
PASS = 0
FAIL = 0

def test(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} -- {detail}")

print("=== 1. Authentication ===")
r = requests.post(f"{BASE_API}/auth/login", json={"username":"testuser","password":"Test1234"})
test("Login succeeds", r.status_code == 200, f"status={r.status_code}")
token = r.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}

print("\n=== 2. Proxy Runner (Testing Payload Construction) ===")
# Test proxy.py runner with urlencoded
body_url = {"_mode": "urlencoded", "data": {"foo": "bar", "sayi": "123"}}
r = requests.post(
    f"{BASE_API}/proxy/run", 
    headers=headers,
    json={
        "method": "POST",
        "url": "https://httpbin.org/post",
        "headers": {},
        "params": {},
        "body": body_url
    }
)
test("Proxy accepts urlencoded format", r.status_code == 200, f"status={r.status_code}, text={r.text[:200]}")
if r.status_code == 200:
    resp_body = json.loads(r.json().get("body", "{}"))
    form_received = resp_body.get("form", {})
    test("HTTPBin received urlencoded data", form_received.get("foo") == "bar" and form_received.get("sayi") == "123", f"got {form_received}")

# Test proxy.py runner with formdata (mapped to data internally)
body_fd = {"_mode": "formdata", "data": {"name": "test", "val": "55"}}
r = requests.post(
    f"{BASE_API}/proxy/run", 
    headers=headers,
    json={
        "method": "POST",
        "url": "https://httpbin.org/post",
        "headers": {},
        "params": {},
        "body": body_fd
    }
)
test("Proxy accepts formdata format", r.status_code == 200, f"status={r.status_code}")
if r.status_code == 200:
    resp_body = json.loads(r.json().get("body", "{}"))
    form_received = resp_body.get("form", {})
    test("HTTPBin received formdata data", form_received.get("name") == "test" and form_received.get("val") == "55", f"got {form_received}")

print("\n=== 3. Database Persistence Testing ===")
# Get a collection constraint
cols = requests.get(f"{BASE_API}/collections", headers=headers).json()
if len(cols) == 0:
    test("Found collection", False, "No collections available to test endpoint persistence")
else:
    ep_id = None
    eps = requests.get(f"{BASE_API}/collections/{cols[0]['id']}/endpoints", headers=headers).json()
    if len(eps) > 0:
        ep_id = eps[0]["id"]
    
    if ep_id:
        body_config_to_save = {
            "mode": "formdata",
            "raw": "",
            "options": {"raw": {"language": "json"}},
            "formdata": [{"key": "testkey", "value": "testvalue"}],
            "urlencoded": []
        }
        r = requests.put(f"{BASE_API}/endpoints/{ep_id}", headers=headers, json={"body": body_config_to_save})
        test("Update DB succeeds", r.status_code == 200, f"status={r.status_code}")
        
        r2 = requests.get(f"{BASE_API}/endpoints/{ep_id}", headers=headers)
        if r2.status_code == 200:
            persisted = r2.json().get("body", {})
            test("Mode persisted", persisted.get("mode") == "formdata", f"got {persisted.get('mode')}")
            fd_list = persisted.get("formdata", [])
            test("Formdata array persisted", len(fd_list) == 1 and fd_list[0].get("key") == "testkey", f"got {fd_list}")
        else:
            test("Get endpoint failed", False, f"status={r2.status_code}")

print(f"\nRESULTS: {PASS} passed, {FAIL} failed")
sys.exit(0 if FAIL == 0 else 1)
