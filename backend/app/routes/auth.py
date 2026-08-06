"""
Kimlik doğrulama (Authentication) route'ları.
Register ve Login endpoint'leri.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..extensions import db
from ..models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Yeni kullanıcı kaydı."""
    data = request.get_json()

    # Validasyon
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({"error": "Tüm alanlar zorunludur."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Bu kullanıcı adı zaten kullanılıyor."}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Bu e-posta adresi zaten kullanılıyor."}), 409

    # Kullanıcı oluştur
    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Kayıt başarılı.", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Kullanıcı girişi, JWT token döner."""
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not all([username, password]):
        return jsonify({"error": "Kullanıcı adı ve şifre zorunludur."}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Geçersiz kullanıcı adı veya şifre."}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 200
