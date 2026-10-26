# PhysHub

FastAPI-сервіс для збереження сцен у SQLite.

Користувачі автентифікуються через JWT; ключі та значення належать окремому користувачу.

## Клієнтські сторінки та автентифікація

Сторінки інтерфейсу розміщені в `app/static/`; головна сторінка входу — `home.html`, а інтерфейс Maxwell — `maxwell/index.html`.

Після входу сервер встановлює JWT у cookie `access_token` з атрибутом `HttpOnly`; токен не повертається JavaScript-коду й не зберігається у Web Storage. Окрема cookie `csrf_token` доступна клієнтському коду. Запити `PUT` і `DELETE` мають передавати її значення в заголовку `X-CSRF-Token`. Cookie мають `SameSite=Lax`; `AUTH_COOKIE_SECURE` за замовчуванням увімкнений, тому розгортання має використовувати HTTPS. Для локального запуску через HTTP встановіть `AUTH_COOKIE_SECURE=false`.

## Розробка у VS Code Dev Container

1. Встановіть розширення VS Code **Dev Containers**.
2. Відкрийте кореневий каталог проєкту у VS Code і виконайте **Dev Containers: Reopen in Container**.
3. Після створення контейнера VS Code автоматично встановить залежності з `requirements-dev.txt` для поточного користувача; віртуальне середовище не використовується.

Контейнер використовує образ `mcr.microsoft.com/devcontainers/python:1-3.12-bullseye`. Запустіть API в інтегрованому терміналі:

```sh
AUTH_COOKIE_SECURE=false python -m uvicorn app.main:app --reload --host 0.0.0.0
```

Порт `8000` буде перенаправлено на хост; Swagger доступний за адресою `http://localhost:8000/docs`. Для запуску тестів виконайте `pytest`. Локальна SQLite-база за замовчуванням зберігається у `app.db` в каталозі проєкту.

## Запуск у Linux-контейнері

1. Створіть `.env` на основі `.env.example` і задайте випадковий секрет для `JWT_SECRET_KEY` (наприклад, `openssl rand -hex 32`).
2. Для локального HTTP-запуску встановіть `AUTH_COOKIE_SECURE=false` і запустіть сервіс:

   ```sh
   AUTH_COOKIE_SECURE=false docker compose up --build
   ```

API буде доступне на `http://localhost:8000`, документація Swagger — на `http://localhost:8000/docs`. База зберігається в окремому Docker volume `sqlite-data`.
Сторінка `http://localhost:8000/` дає змогу увійти наявному користувачу. Для production використовуйте HTTPS і `AUTH_COOKIE_SECURE=true`.

Для локальної розробки без Docker:

```sh
python3 -m pip install --user -r requirements-dev.txt
AUTH_COOKIE_SECURE=false python3 -m uvicorn app.main:app --reload
```

## Запуск тестів

`python -m pytest`

## API

- `POST /auth/register` — створення користувача, JSON `{"username":"alice","password":"strong-password"}`.
- `POST /auth/token` — вхід через форму `username`/`password`; встановлює HttpOnly cookie автентифікації та CSRF-cookie.
- `POST /auth/logout` — видаляє cookie автентифікації; потребує заголовок `X-CSRF-Token`.
- `PUT /data/{key}` — створити або оновити значення. Тіло запиту — будь-яке валідне JSON; потребує CSRF-заголовок.
- `GET /data/{key}` — отримати значення.
- `GET /data/keys` — отримати ключі поточного користувача.
- `DELETE /data/{key}` — видалити значення; потребує CSRF-заголовок.
- `GET /health` — перевірка стану сервісу.
- `GET /` — сторінка входу.

Для запитів із браузера cookie надсилаються автоматично. Для `PUT` і `DELETE` JavaScript має прочитати `csrf_token` і передати його в `X-CSRF-Token`; сам JWT доступний лише серверу.

Приклад для локального HTTP-сервера (`AUTH_COOKIE_SECURE=false`):

```sh
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"strong-password"}'

curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=alice&password=strong-password' \
  -c cookies.txt

CSRF_TOKEN=$(awk -F '\t' '$6 == "csrf_token" {print $7}' cookies.txt)
curl -X PUT http://localhost:8000/data/settings \
  -b cookies.txt \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","notifications":true}'
```

Access token дійсний 90 хвилин. Не використовуйте `.env.example` секрет у production і не додавайте `.env` до системи контролю версій. Для production встановіть власний `JWT_SECRET_KEY` і залиште `AUTH_COOKIE_SECURE=true`.
