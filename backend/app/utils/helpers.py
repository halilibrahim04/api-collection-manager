"""
Genel yardımcı fonksiyonlar.
"""


def allowed_file(filename):
    """Dosya uzantısının izin verilen türlerden olup olmadığını kontrol et."""
    allowed_extensions = {"json"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions
