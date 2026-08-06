"""
HTTP istek çalıştırma servisi.
Endpoint bilgilerini alarak gerçek HTTP isteği gönderir.
"""
import time
import requests as http_client


def run_request(endpoint):
    """
    Endpoint bilgilerine göre HTTP isteği gönderir.

    Args:
        endpoint: Endpoint model nesnesi

    Returns:
        dict: İstek sonucu (status_code, response_time, headers, body)
    """
    url = f"{endpoint.base_url}{endpoint.path}"

    # Query parametrelerini ekle
    params = endpoint.query_params or {}

    # Headers
    headers = endpoint.headers or {}

    # Body
    body = None
    if endpoint.body and endpoint.body.get("raw"):
        body = endpoint.body["raw"]
        if "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"

    # İsteği gönder ve süreyi ölç
    start_time = time.time()

    try:
        response = http_client.request(
            method=endpoint.method,
            url=url,
            headers=headers,
            params=params,
            data=body,
            timeout=30,
        )
        elapsed = round((time.time() - start_time) * 1000)  # ms cinsinden

        # Response body'yi parse et
        try:
            response_body = response.json()
        except ValueError:
            response_body = response.text

        return {
            "status_code": response.status_code,
            "response_time_ms": elapsed,
            "headers": dict(response.headers),
            "body": response_body,
        }

    except http_client.exceptions.Timeout:
        return {"error": "İstek zaman aşımına uğradı (30 saniye).", "status_code": 408}
    except http_client.exceptions.ConnectionError:
        return {"error": "Bağlantı kurulamadı.", "status_code": 503}
