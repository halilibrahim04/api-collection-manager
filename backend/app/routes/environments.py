from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.environment import Environment
from ..extensions import db

bp = Blueprint("environments", __name__, url_prefix="/api/environments")

@bp.route("", methods=["GET"])
@jwt_required()
def get_environments():
    user_id = get_jwt_identity()
    envs = Environment.query.filter_by(user_id=user_id).order_by(Environment.created_at.desc()).all()
    return jsonify({"environments": [e.to_dict() for e in envs]}), 200

@bp.route("", methods=["POST"])
@jwt_required()
def create_environment():
    user_id = get_jwt_identity()
    data = request.json
    name = data.get("name")
    
    if not name:
        return jsonify({"error": "Ortam adı gereklidir."}), 400
        
    env = Environment(
        name=name,
        variables=data.get("variables", {}),
        user_id=user_id
    )
    db.session.add(env)
    db.session.commit()
    
    return jsonify({"message": "Ortam oluşturuldu", "environment": env.to_dict()}), 201

@bp.route("/<int:env_id>", methods=["PUT"])
@jwt_required()
def update_environment(env_id):
    user_id = get_jwt_identity()
    env = Environment.query.filter_by(id=env_id, user_id=user_id).first()
    
    if not env:
        return jsonify({"error": "Ortam bulunamadı."}), 404
        
    data = request.json
    if "name" in data:
        env.name = data["name"]
    if "variables" in data:
        env.variables = data["variables"]
        
    db.session.commit()
    return jsonify({"message": "Ortam güncellendi", "environment": env.to_dict()}), 200

@bp.route("/<int:env_id>", methods=["DELETE"])
@jwt_required()
def delete_environment(env_id):
    user_id = get_jwt_identity()
    env = Environment.query.filter_by(id=env_id, user_id=user_id).first()
    
    if not env:
        return jsonify({"error": "Ortam bulunamadı."}), 404
        
    db.session.delete(env)
    db.session.commit()
    return jsonify({"message": "Ortam silindi"}), 200
