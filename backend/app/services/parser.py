"""
Postman ve Bruno collection dosyalarını parse eden servis.
"""
import json
from ..models.collection import Collection
from ..models.endpoint import Endpoint


def parse_collection_file(file, user_id):
    """
    Yüklenen dosyayı parse ederek Collection ve Endpoint nesneleri oluşturur.

    Args:
        file: Flask FileStorage nesnesi
        user_id: Dosyayı yükleyen kullanıcının ID'si

    Returns:
        Collection: Parse edilmiş koleksiyon nesnesi (endpoint'leriyle birlikte)

    Raises:
        ValueError: Dosya formatı desteklenmiyorsa
    """
    try:
        content = json.loads(file.read().decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Geçersiz JSON dosyası.")

    # Postman Collection formatı kontrolü
    if "info" in content and "item" in content:
        return _parse_postman(content, user_id)

    # Bruno Collection formatı kontrolü
    if "version" in content and "collection" in content and "requests" in content:
        return _parse_bruno(content, user_id)
        
    # Eğer bu kök seviyede tek bir Bruno isteği ise (veya klasörlü bir yapı ise)
    if isinstance(content, dict) and content.get("name") and content.get("type") == "http":
        return _parse_bruno_single(content, user_id)

    raise ValueError("Desteklenmeyen collection formatı.")

def _parse_bruno(data, user_id):
    """Bruno Collection formatını parse et."""
    collection_name = data.get("collection", {}).get("name", "Bruno Koleksiyonu")

    collection = Collection(
        user_id=user_id,
        name=collection_name,
        source_type="bruno"
    )

    requests = data.get("requests", [])
    for req in requests:
        if req.get("type") == "http":
            _add_bruno_endpoint(req, collection)

    return collection

def _parse_bruno_single(data, user_id):
    """Eğer dosya tekil bir Bruno isteği ise onu tek elemanlı bir koleksiyon yap."""
    collection = Collection(
        user_id=user_id,
        name=data.get("name", "Bruno İsteği"),
        source_type="bruno"
    )
    _add_bruno_endpoint(data, collection)
    return collection

def _add_bruno_endpoint(req, collection):
    """Bruno isteğini DB Endpoint'ine çevir."""
    request_data = req.get("request", {})
    
    url = request_data.get("url", "")
    method = request_data.get("method", "GET")
    
    # Headers
    headers = {}
    for header in request_data.get("headers", []):
        if header.get("enabled", True):
            headers[header.get("name", "")] = header.get("value", "")
            
    # Query Params
    query_params = {}
    for param in request_data.get("params", []):
        if param.get("enabled", True):
            query_params[param.get("name", "")] = param.get("value", "")
            
    # Body
    body = {}
    body_data = request_data.get("body", {})
    if body_data:
        mode = body_data.get("mode", "none")
        if mode == "json":
            body = {"mode": "raw", "raw": body_data.get("json", "")}
        elif mode == "text":
            body = {"mode": "raw", "raw": body_data.get("text", "")}
        else:
            body = {"mode": mode, "raw": ""}
            
    # Auth
    auth = {}
    auth_data = request_data.get("auth", {})
    if auth_data and auth_data.get("mode") == "bearer":
        auth = {"token": auth_data.get("bearer", {}).get("token", "")}

    endpoint = Endpoint(
        name=req.get("name", "İsimsiz Endpoint"),
        method=method.upper(),
        base_url="",
        path=url,
        headers=headers,
        query_params=query_params,
        body=body,
        auth=auth,
    )
    collection.endpoints.append(endpoint)



def _parse_postman(data, user_id):
    """Postman Collection v2.1 formatını parse et."""
    collection_name = data.get("info", {}).get("name", "İsimsiz Koleksiyon")

    collection = Collection(
        user_id=user_id,
        name=collection_name,
        source_type="postman"
    )

    # Endpoint'leri recursive olarak parse et (klasör desteği)
    _parse_postman_items(data.get("item", []), collection)

    return collection


def _parse_postman_items(items, collection):
    """Postman item'larını recursive olarak parse et."""
    for item in items:
        # Eğer item bir klasörse (alt item'ları var)
        if "item" in item:
            _parse_postman_items(item["item"], collection)
            continue

        # Endpoint bilgilerini çıkar
        request_data = item.get("request", {})
        url_data = request_data.get("url", {})

        # URL bilgilerini oluştur
        if isinstance(url_data, str):
            base_url = ""
            path = url_data
        else:
            host = ".".join(url_data.get("host", []))
            protocol = url_data.get("protocol", "https")
            base_url = f"{protocol}://{host}" if host else ""
            path = "/" + "/".join(url_data.get("path", []))

        # Headers
        headers = {}
        for header in request_data.get("header", []):
            headers[header.get("key", "")] = header.get("value", "")

        # Query Parameters
        query_params = {}
        for param in url_data.get("query", []) if isinstance(url_data, dict) else []:
            query_params[param.get("key", "")] = param.get("value", "")

        # Body
        body = {}
        body_data = request_data.get("body", {})
        if body_data:
            body = {
                "mode": body_data.get("mode", ""),
                "raw": body_data.get("raw", ""),
                "formdata": body_data.get("formdata", []),
                "urlencoded": body_data.get("urlencoded", []),
                "options": body_data.get("options", {})
            }

        # Auth
        auth = request_data.get("auth", {})

        # Scripts (Pre-request & Tests from Postman 'event' array)
        scripts = {"prerequest": "", "tests": ""}
        for event in item.get("event", []):
            script_dict = event.get("script", {})
            exec_lines = script_dict.get("exec", [])
            script_content = "\n".join(exec_lines) if isinstance(exec_lines, list) else str(exec_lines)
            
            if event.get("listen") == "prerequest":
                scripts["prerequest"] = script_content
            elif event.get("listen") == "test":
                scripts["tests"] = script_content

        endpoint = Endpoint(
            name=item.get("name", "İsimsiz Endpoint"),
            method=request_data.get("method", "GET"),
            base_url=base_url,
            path=path,
            headers=headers,
            query_params=query_params,
            body=body,
            auth=auth,
            scripts=scripts,
        )
        collection.endpoints.append(endpoint)
