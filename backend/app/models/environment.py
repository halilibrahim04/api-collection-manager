"""
Ortam (Environment) modeli.
"""
from datetime import datetime, timezone
from ..extensions import db

class Environment(db.Model):
    """Ortamları (Dev, Prod vb.) ve değişkenlerini tutan tablo."""
    __tablename__ = "environments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    variables = db.Column(db.JSON, default=dict)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Ortam bilgilerini API yanıtı için formatlar."""
        return {
            "id": self.id,
            "name": self.name,
            "variables": self.variables or {},
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Environment {self.name}>"
