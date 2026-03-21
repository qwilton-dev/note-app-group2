# FocusFlow (Note App) 

Современное веб-приложение для управления задачами, списками и заметками. Проект состоит из продающего лендинга, основного веб-приложения (SPA) и быстрого REST API. 

## 🛠 Технологический стек

* **Бэкенд:** Python, FastAPI, SQLAlchemy, SQLite (aiosqlite)
* **Фронтенд (App & Landing):** React, TypeScript, Vite
* **Инфраструктура:** Docker, Docker Compose, Nginx
* **Авторизация:** JWT токены (безопасные HttpOnly Cookies)

## 📂 Структура проекта

```text
├── backend/                  # REST API на FastAPI
├── frontend/                 # Основное SPA приложение 
├── landing/                  # Лендинг 
├── nginx/                    # Конфигурации Nginx 
├── docker-compose.yml        # Compose-файл для Production (с поддержкой SSL/Certbot)
├── docker-compose-local.yml  # Compose-файл для локальной разработки 
└── init-ssl.sh               # Скрипт для первичной генерации SSL-сертификатов
```

---

## 💻 Запуск локально (Development)

Для локальной разработки используется отдельный конфиг `docker-compose-local.yml`, который работает по HTTP без привязки к реальным доменам.

### 1. Переменные окружения
Создайте файл `.env` в папке `backend/` со следующими переменными:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET_KEY=change-me-to-a-random-secret-at-least-32-chars
FRONTEND_URL=http://localhost:3000
LANDING_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

```
Google client id и secret можно получить по [ссылке](https://console.cloud.google.com/). Создайте проект, потом APIs and services, сперва зарегайте OAuth в OAuth consest screen. 

После перейдите в Credentials, создайте OAuth client ID, зайдите в его настройки. Там во первых будет айди и секрет, во вторых установите Authorised redirect URIs на нужный домен (для локалки http://localhost/auth/callback, для прода https://your_domain/auth/callback)
### 2. Сборка и запуск
Выполните команду в корне проекта, явно указав локальный compose-файл:
```bash
docker-compose -f docker-compose-local.yml up --build
```

### 3. Доступ к приложению
* 🌐 **Лендинг:** [http://localhost](http://localhost)
* 💻 **Основное приложение:** [http://localhost/app/](http://localhost/app/)
* ⚙️ **Документация API (Swagger):** [http://localhost/docs](http://localhost/docs)

---

## Запуск на сервере

Для запуска на реальном сервере используется основной `docker-compose.yml`, который настроен на работу с HTTPS и Certbot.

### 1. Подготовка

В файле `backend/.env` укажите реальные домены, получить айди и секрет гугла, а также сгенерируйте jwt secret:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET_KEY=change-me-to-a-random-secret-at-least-32-chars
FRONTEND_URL=https://your-domain/app
LANDING_URL=https://your-domain/app
BACKEND_URL=https://your-domain/app
```

### 2. Получение SSL-сертификатов
Перед первым запуском Nginx с HTTPS нужно сгенерировать сертификаты Let's Encrypt. Для этого запустите подготовленный скрипт:
```bash
chmod +x init-ssl.sh
./init-ssl.sh
```

### 3. Запуск проекта
После успешного получения сертификатов запустите продакшен-конфигурацию в фоновом режиме:
```bash
docker-compose up -d --build
```

---