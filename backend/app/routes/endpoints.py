"""
Endpoint yönetimi ve çalıştırma route'ları.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.endpoint import Endpoint
from ..models.collection import Collection
from ..services.runner import run_request

endpoints_bp = Blueprint("endpoints", __name__)


@endpoints_bp.route("/<int:endpoint_id>", methods=["GET"])
@jwt_required()
def get_endpoint(endpoint_id):
    """Tek bir endpoint'in detaylarını getir."""
    user_id = get_jwt_identity()
    endpoint = _get_user_endpoint(endpoint_id, user_id)

    if not endpoint:
        return jsonify({"error": "Endpoint bulunamadı."}), 404

    return jsonify(endpoint.to_dict()), 200


@endpoints_bp.route("/<int:endpoint_id>", methods=["PUT"])
@jwt_required()
def update_endpoint(endpoint_id):
    """Endpoint bilgilerini güncelle."""
    user_id = get_jwt_identity()
    endpoint = _get_user_endpoint(endpoint_id, user_id)

    if not endpoint:
        return jsonify({"error": "Endpoint bulunamadı."}), 404

    data = request.get_json()

    # Güncellenebilir alanlar
    updatable_fields = ["name", "method", "base_url", "path", "headers", "query_params", "body", "auth", "scripts"]
    for field in updatable_fields:
        if field in data:
            setattr(endpoint, field, data[field])

    db.session.commit()
    return jsonify({"message": "Endpoint güncellendi.", "endpoint": endpoint.to_dict()}), 200


@endpoints_bp.route("/<int:endpoint_id>/run", methods=["POST"])
@jwt_required()
def execute_endpoint(endpoint_id):
    """Endpoint'i çalıştır ve sonucu döndür."""
    user_id = get_jwt_identity()
    endpoint = _get_user_endpoint(endpoint_id, user_id)

    if not endpoint:
        return jsonify({"error": "Endpoint bulunamadı."}), 404

    try:
        result = run_request(endpoint)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"İstek çalıştırılırken hata oluştu: {str(e)}"}), 500


def _get_user_endpoint(endpoint_id, user_id):
    """Kullanıcıya ait endpoint'i getir (yetki kontrolü)."""
    endpoint = Endpoint.query.get(endpoint_id)
    if not endpoint:
        return None

    collection = Collection.query.filter_by(id=endpoint.collection_id, user_id=user_id).first()
    if not collection:
        return None

    return endpoint
