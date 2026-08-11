"""
API Proxy route'ları.
Harici API'lere doğrudan (bir veritabanı endpoint'ine bağlı olmadan) istek göndermek için kullanılır.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import requests as http_client
import time

proxy_bp = Blueprint("proxy", __name__)

@proxy_bp.route("/run", methods=["POST"])
@jwt_required()
def run_proxy():
    """Gelen ham istek verilerini kullanarak HTTP isteği gönderir."""
    data = request.get_json()
    
    method = data.get("method", "GET")
    url = data.get("url")
    headers = data.get("headers", {})
    query_params = data.get("params", {})
    body = data.get("body")

    if not url:
        return jsonify({"error": "URL zorunludur."}), 400

    # İsteği gönder ve süreyi ölç
    start_time = time.time()

    try:
        # String body gelirse json olarak değil data olarak gönder
        req_params = {
            "method": method,
            "url": url,
            "headers": headers,
            "params": query_params,
            "timeout": 30
        }
        
        # Eğer body string ise ve try-parse edilebiliyorsa json olarak atalım:
        import json
        import base64
        if isinstance(body, dict) and body.get("_mode") in ["formdata", "urlencoded"]:
            req_params["data"] = body.get("data", {})
            if "files" in body and body["files"]:
                req_params["files"] = {}
                for f_key, f_data in body["files"].items():
                    req_params["files"][f_key] = (
                        f_data.get("filename", "upload.bin"),
                        base64.b64decode(f_data.get("content", ""))
                    )
        elif isinstance(body, str) and body.strip():
            try:
                # Eger json ise json gonder (Requests otomatik content-type ayarlar)
                # Amma eger kullanici ozellikle content-type ayarladiysa data olarak atalim ki karismasin
                if headers and "content-type" in {k.lower() for k in headers.keys()}:
                    req_params["data"] = body.encode('utf-8')
                else:
                    try:
                        req_params["json"] = json.loads(body)
                    except:
                        req_params["data"] = body.encode('utf-8')
            except:
                pass
        elif body:
               req_params["json"] = body

        response = http_client.request(**req_params)
        
        elapsed = round((time.time() - start_time) * 1000)

        # Response body parsing
        try:
            response_body = response.json()
        except ValueError:
            response_body = response.text

        return jsonify({
            "status_code": response.status_code,
            "elapsed_time": elapsed / 1000.0, # Frontend saniye cinsinden bekleyebilir ancak biz milisaniye olarak verelim de float çevirelim. Aslında endpoints api'miz nasıl dönüyor ona bakalım.
            "headers": dict(response.headers),
            "body": response_body,
        }), 200

    except http_client.exceptions.Timeout:
        return jsonify({"error": "İstek zaman aşımına uğradı (30 saniye).", "status_code": 408}), 408
    except http_client.exceptions.ConnectionError:
        return jsonify({"error": "Bağlantı kurulamadı.", "status_code": 503}), 503
    except Exception as e:
        return jsonify({"error": f"Hata oluştu: {str(e)}", "status_code": 500}), 500
