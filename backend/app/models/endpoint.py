"""
Endpoint modeli.
"""
from ..extensions import db


class Endpoint(db.Model):
    """API endpoint tablosu."""
    __tablename__ = "endpoints"

    id = db.Column(db.Integer, primary_key=True)
    collection_id = db.Column(db.Integer, db.ForeignKey("collections.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    method = db.Column(db.String(10), nullable=False)  # GET, POST, PUT, PATCH, DELETE
    base_url = db.Column(db.String(500), default="")
    path = db.Column(db.String(500), nullable=False)
    headers = db.Column(db.JSON, default=dict)
    query_params = db.Column(db.JSON, default=dict)
    body = db.Column(db.JSON, default=dict)
    auth = db.Column(db.JSON, default=dict)
    scripts = db.Column(db.JSON, default=dict)

    def to_dict(self):
        """Endpoint bilgilerini sözlük olarak döndür."""
        return {
            "id": self.id,
            "collection_id": self.collection_id,
            "name": self.name,
            "method": self.method,
            "base_url": self.base_url,
            "path": self.path,
            "headers": self.headers,
            "query_params": self.query_params,
            "body": self.body,
            "auth": self.auth,
            "scripts": self.scripts,
        }

    def __repr__(self):
        return f"<Endpoint {self.method} {self.path}>"
