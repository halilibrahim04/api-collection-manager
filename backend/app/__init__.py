"""
API Collection Manager - Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS
from .config import Config
from .extensions import db, jwt, migrate


def create_app(config_class=Config):
    """Flask uygulama factory fonksiyonu."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extension'ları başlat
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Blueprint'leri kaydet
    from .routes.auth import auth_bp
    from .routes.collections import collections_bp
    from .routes.endpoints import endpoints_bp
    from .routes.proxy import proxy_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(collections_bp, url_prefix="/api/collections")
    app.register_blueprint(endpoints_bp, url_prefix="/api/endpoints")
    app.register_blueprint(proxy_bp, url_prefix="/api/proxy")

    return app
