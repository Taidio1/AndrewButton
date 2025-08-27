# 🐳 Docker Deployment - Audio Button Grid

## 📋 Wymagania

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 2GB RAM na VPS
- Porty 5000 (HTTP) i opcjonalnie 80/443 (HTTPS)

## 🚀 Szybki Start

### 1. Klonowanie i przygotowanie

```bash
# Sklonuj projekt
git clone <your-repo>
cd ButtonKrisu

# Nadaj uprawnienia do skryptu deploy
chmod +x deploy.sh
```

### 2. Uruchomienie w trybie development

```bash
# Uruchomienie podstawowe
./deploy.sh

# Lub ręcznie
docker-compose up --build -d
```

### 3. Uruchomienie w trybie produkcji

```bash
# Uruchomienie z Nginx i SSL
./deploy.sh prod

# Lub ręcznie
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔧 Konfiguracja

### Zmienne środowiskowe

Możesz utworzyć plik `.env` z własnymi ustawieniami:

```env
NODE_ENV=production
PORT=5000
MAX_FILE_SIZE=100MB
```

### Porty

- **5000** - Aplikacja główna
- **80** - HTTP (redirect do HTTPS w produkcji)
- **443** - HTTPS (tylko w produkcji)

## 📁 Struktura plików Docker

```
ButtonKrisu/
├── Dockerfile                 # Główny obraz Docker
├── .dockerignore             # Pliki wykluczone z build
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Produkcja z Nginx
├── nginx.prod.conf          # Konfiguracja Nginx
├── deploy.sh                # Skrypt automatycznego deploy
└── README-Docker.md         # Ta dokumentacja
```

## 🛠️ Zarządzanie

### Podstawowe komendy

```bash
# Status kontenerów
docker-compose ps

# Logi aplikacji
docker-compose logs -f audio-app

# Restart aplikacji
docker-compose restart audio-app

# Zatrzymanie
docker-compose down

# Zatrzymanie z usunięciem danych
docker-compose down -v
```

### Zarządzanie w produkcji

```bash
# Status
docker-compose -f docker-compose.prod.yml ps

# Logi
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart
```

## 🔒 SSL/HTTPS

### Automatyczne generowanie (self-signed)

Skrypt `deploy.sh` automatycznie generuje self-signed certyfikaty.

### Własne certyfikaty

Umieść swoje certyfikaty w katalogu `ssl/`:

```bash
ssl/
├── cert.pem    # Certyfikat publiczny
└── key.pem     # Klucz prywatny
```

## 📊 Monitoring i Logi

### Health Check

Aplikacja ma wbudowany health check dostępny pod `/api/health`

### Logi

```bash
# Logi aplikacji
docker-compose logs audio-app

# Logi Nginx (produkcja)
docker-compose -f docker-compose.prod.yml logs nginx

# Logi systemowe
docker system df
docker stats
```

## 🚨 Troubleshooting

### Problem: Port już zajęty

```bash
# Sprawdź co używa portu
sudo netstat -tulpn | grep :5000

# Zatrzymaj i uruchom ponownie
docker-compose down
docker-compose up -d
```

### Problem: Brak pamięci

```bash
# Sprawdź użycie pamięci
docker stats

# Wyczyść nieużywane obrazy
docker system prune -a
```

### Problem: Błędy FFmpeg

```bash
# Sprawdź logi aplikacji
docker-compose logs audio-app

# Upewnij się że FFmpeg jest zainstalowany w kontenerze
docker exec -it audio-button-grid which ffmpeg
```

### Problem: Pliki audio nie są zapisywane

```bash
# Sprawdź uprawnienia do katalogu
docker exec -it audio-button-grid ls -la /app/public/sounds

# Sprawdź wolumeny
docker volume ls
docker volume inspect buttonkrisu_audio_sounds
```

## 🔄 Aktualizacje

### Aktualizacja aplikacji

```bash
# Pobierz najnowsze zmiany
git pull origin main

# Przebuduj i uruchom ponownie
./deploy.sh prod --clean
```

### Aktualizacja Docker

```bash
# Aktualizuj obrazy
docker-compose pull

# Przebuduj i uruchom ponownie
docker-compose up --build -d
```

## 📈 Skalowanie

### Zwiększenie zasobów

Edytuj `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G      # Zwiększ z 2G
      cpus: '2.0'     # Zwiększ z 1.0
```

### Load Balancing

Dla większego ruchu możesz uruchomić kilka instancji:

```yaml
deploy:
  replicas: 3
```

## 🎯 Optymalizacje

### Cache

- Pliki audio są cachowane przez Nginx (1 rok)
- Gzip compression włączone
- Static files są serwowane przez Nginx

### Bezpieczeństwo

- Rate limiting na API
- Security headers
- Non-root user w kontenerze
- SSL/TLS w produkcji

## 📞 Wsparcie

W przypadku problemów:

1. Sprawdź logi: `docker-compose logs`
2. Sprawdź status: `docker-compose ps`
3. Sprawdź health check: `curl http://localhost:5000/api/health`
4. Restart: `docker-compose restart`

## 🔗 Przydatne linki

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [FFmpeg](https://ffmpeg.org/)
