"""
File Upload Proxy Feature - API Test Suite
"""
import requests, json, sys, base64

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

print("\n=== 2. Proxy Runner File Upload Test ===")
# Create a dummy text file content and base64 encode it
test_content = b"Hello from API Manager Sandbox File Upload Test!"
encoded_content = base64.b64encode(test_content).decode("utf-8")

payload = {
    "_mode": "formdata",
    "data": {
        "regular_text_field": "some_value"
    },
    "files": {
        "document": {
            "filename": "test-doc.txt",
            "content": encoded_content
        }
    }
}

r = requests.post(
    f"{BASE_API}/proxy/run", 
    headers=headers,
    json={
        "method": "POST",
        "url": "https://httpbin.org/post",
        "headers": {},
        "params": {},
        "body": payload
    }
)
test("Proxy accepts file payload format", r.status_code == 200, f"status={r.status_code} text={r.text[:200]}")

if r.status_code == 200:
    resp_body = r.json().get("body", "{}")
    if isinstance(resp_body, str):
        resp_json = json.loads(resp_body)
    else:
        resp_json = resp_body
        
    form_received = resp_json.get("form", {})
    files_received = resp_json.get("files", {})
    
    test("HTTPBin received text formdata", form_received.get("regular_text_field") == "some_value", f"got {form_received}")
    
    # httpbin.org returns nested files under the key they were uploaded with
    received_file_content = files_received.get("document", "")
    test("HTTPBin received base64-decoded binary file", received_file_content == "Hello from API Manager Sandbox File Upload Test!", f"got [{received_file_content}]")

print(f"\nRESULTS: {PASS} passed, {FAIL} failed")
sys.exit(0 if FAIL == 0 else 1)
