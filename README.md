# JSON Key-Value API

FastAPI-сервіс для збереження JSON у SQLite. Користувачі автентифікуються через JWT; ключі та значення належать окремому користувачу.

## Розробка у VS Code Dev Container

1. Встановіть розширення VS Code **Dev Containers**.
2. Відкрийте кореневий каталог проєкту у VS Code і виконайте **Dev Containers: Reopen in Container**.
3. Після створення контейнера VS Code автоматично створить `.venv` та встановить залежності з `requirements-dev.txt`.

Контейнер використовує образ `mcr.microsoft.com/devcontainers/python:1-3.12-bullseye`. Запустіть API в інтегрованому терміналі:

```sh
uvicorn app.main:app --reload --host 0.0.0.0
```

Порт `8000` буде перенаправлено на хост; Swagger доступний за адресою `http://localhost:8000/docs`. Для запуску тестів виконайте `pytest`. Локальна SQLite-база за замовчуванням зберігається у `app.db` в каталозі проєкту.

## Запуск у Linux-контейнері

1. Створіть `.env` на основі `.env.example` і задайте випадковий секрет для `JWT_SECRET_KEY` (наприклад, `openssl rand -hex 32`).
2. Запустіть сервіс:

   ```sh
   docker compose up --build
   ```

API буде доступне на `http://localhost:8000`, документація Swagger — на `http://localhost:8000/docs`. База зберігається в окремому Docker volume `sqlite-data`.

Для локальної розробки без Docker:

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Тести: `pytest`.

## API

- `POST /auth/register` — створення користувача, JSON `{"username":"alice","password":"strong-password"}`.
- `POST /auth/token` — вхід через форму `username`/`password`; повертає JWT.
- `PUT /data/{key}` — створити або оновити значення. Тіло запиту — будь-яке валідне JSON.
- `GET /data/{key}` — отримати значення.
- `DELETE /data/{key}` — видалити значення.
- `GET /health` — перевірка стану сервісу.

Для операцій із `/data` передавайте токен у заголовку `Authorization: Bearer <token>`.

Приклад:

```sh
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"strong-password"}'

curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=alice&password=strong-password'

curl -X PUT http://localhost:8000/data/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","notifications":true}'
```

Access token дійсний 30 хвилин. Не використовуйте `.env.example` секрет у production і не додавайте `.env` до системи контролю версій. Для локального запуску без Docker встановіть власне значення `JWT_SECRET_KEY`.
