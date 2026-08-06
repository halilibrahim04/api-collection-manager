"""
Kullanıcı modeli.
"""
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class User(db.Model):
    """Kullanıcı tablosu."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # İlişkiler
    collections = db.relationship("Collection", backref="owner", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """Şifreyi hash'leyerek kaydet."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Şifreyi doğrula."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Kullanıcı bilgilerini sözlük olarak döndür."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.username}>"
