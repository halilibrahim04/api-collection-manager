"""
Collection (Koleksiyon) yönetimi route'ları.
Import, listeleme, silme işlemleri.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.collection import Collection
from ..services.parser import parse_collection_file

collections_bp = Blueprint("collections", __name__)


@collections_bp.route("", methods=["GET"])
@jwt_required()
def list_collections():
    """Kullanıcının tüm koleksiyonlarını listele."""
    user_id = get_jwt_identity()
    collections = Collection.query.filter_by(user_id=user_id).all()
    return jsonify([c.to_dict() for c in collections]), 200


@collections_bp.route("/import", methods=["POST"])
@jwt_required()
def import_collection():
    """Postman veya Bruno collection dosyasını import et."""
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "Dosya yüklenmedi."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Dosya adı boş."}), 400

    try:
        collection = parse_collection_file(file, user_id)
        db.session.add(collection)
        db.session.commit()
        return jsonify({
            "message": "Collection başarıyla import edildi.",
            "collection": collection.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@collections_bp.route("/<int:collection_id>", methods=["DELETE"])
@jwt_required()
def delete_collection(collection_id):
    """Koleksiyonu sil."""
    user_id = get_jwt_identity()
    collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()

    if not collection:
        return jsonify({"error": "Koleksiyon bulunamadı."}), 404

    db.session.delete(collection)
    db.session.commit()
    return jsonify({"message": "Koleksiyon silindi."}), 200


@collections_bp.route("/<int:collection_id>/endpoints", methods=["GET"])
@jwt_required()
def list_collection_endpoints(collection_id):
    """Koleksiyondaki endpoint'leri listele."""
    user_id = get_jwt_identity()
    collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()

    if not collection:
        return jsonify({"error": "Koleksiyon bulunamadı."}), 404

    return jsonify([e.to_dict() for e in collection.endpoints]), 200
