# API Collection Manager

Postman ve Bruno Collection dosyalarını import ederek API'leri web arayüzü üzerinden yönetip çalıştırmanızı sağlayan bir uygulama.

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Backend | Flask (Python) |
| Frontend | React (Vite) |
| Veritabanı | SQLite (PostgreSQL'e geçiş yapılabilir) |
| Authentication | JWT |

## Proje Yapısı

```
api-collection-manager/
├── backend/          # Flask API
│   ├── app/
│   │   ├── models/   # Veritabanı modelleri
│   │   ├── routes/   # API endpoint'leri
│   │   ├── services/ # İş mantığı (parser, runner)
│   │   └── utils/    # Yardımcı fonksiyonlar
│   ├── run.py        # Uygulama başlatma
│   └── requirements.txt
├── frontend/         # React (Vite) arayüzü
└── samples/          # Örnek collection dosyaları
```

## Kurulum

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### Veritabanı Oluşturma

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### Çalıştırma

```bash
python run.py
```

Backend varsayılan olarak `http://localhost:5000` adresinde çalışır.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend varsayılan olarak `http://localhost:5173` adresinde çalışır.

## API Endpoint'leri

| Method | Rota | Açıklama |
|---|---|---|
| `POST` | `/api/auth/register` | Kullanıcı kaydı |
| `POST` | `/api/auth/login` | Kullanıcı girişi |
| `GET` | `/api/collections` | Koleksiyon listesi |
| `POST` | `/api/collections/import` | Koleksiyon import |
| `DELETE` | `/api/collections/<id>` | Koleksiyon silme |
| `GET` | `/api/collections/<id>/endpoints` | Endpoint listesi |
| `PUT` | `/api/endpoints/<id>` | Endpoint güncelleme |
| `POST` | `/api/endpoints/<id>/run` | Endpoint çalıştırma |
