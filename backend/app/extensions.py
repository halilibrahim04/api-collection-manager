"""
Flask extension'larının merkezi başlatma noktası.
Circular import'ları önlemek için extension'lar burada tanımlanır.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
