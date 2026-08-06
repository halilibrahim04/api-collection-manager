"""
Collection (Koleksiyon) modeli.
"""
from datetime import datetime, timezone
from ..extensions import db


class Collection(db.Model):
    """API koleksiyon tablosu."""
    __tablename__ = "collections"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    source_type = db.Column(db.String(50), nullable=False)  # "postman" veya "bruno"
    imported_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # İlişkiler
    endpoints = db.relationship("Endpoint", backref="collection", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        """Koleksiyon bilgilerini sözlük olarak döndür."""
        return {
            "id": self.id,
            "name": self.name,
            "source_type": self.source_type,
            "imported_at": self.imported_at.isoformat() if self.imported_at else None,
            "endpoint_count": len(self.endpoints),
        }

    def __repr__(self):
        return f"<Collection {self.name}>"
