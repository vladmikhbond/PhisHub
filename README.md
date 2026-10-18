# PhisHub

FastAPI-сервіс для збереження сцен у SQLite.

Користувачі автентифікуються через JWT; ключі та значення належать окремому користувачу.

## Вимоги до клієнтских додатків

Папка додатку знаходиться в папці app/static.

В папці додатку є сторінка index.html.

На сторінці index.html є посилання на JS і елементи

```sh
  <button id="saveSceneButton" class="scene-btn" title="Save script">✔</button>
  <input id="sceneName" type="text" class="scene-name" title="Scene name" >
  <select id="savingSelect" class="scene-select" ></select>
  <button id="removeSceneButton" class="scene-btn" title="Delete script">❌</button>
```

В JS додатку є класс Controller, а в ньому метод addDataHandlers().
Цей метод замінюється на

```js
  addDataHandlers() {
    const savingSelect = document.getElementById("savingSelect");
    const sceneName = document.getElementById("sceneName");
    const saveSceneButton = document.getElementById("saveSceneButton");
    const removeSceneButton = document.getElementById("removeSceneButton");

    fillOptions().then();

    // Зберегти сцену в базі даних
    //
    saveSceneButton.addEventListener("click", async () => {
      if (!sceneName.value) 
        return;
      try {
        //
        const accessToken = sessionStorage.getItem("accessToken");
        const val = Store.serialize(this.space);

        const putResponse = await fetch(`/data/${sceneName.value}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}`, 
                    "Content-Type": "application/json", },
          body: val,
        });

        if (putResponse.ok) {
          const option = document.createElement("option");
          option.value = sceneName.value;
          option.textContent = sceneName.value;
          savingSelect.appendChild(option);
        }
      } catch (error) {
        alert(error.message);
      }
    });
    
    // Завантажити сцену з бази даних
    //
    savingSelect.addEventListener("change", async () => {
      
      let key = savingSelect.selectedOptions[0].value;
      let json;
      try {
        const accessToken = sessionStorage.getItem("accessToken");
        const dataResponse = await fetch(`/data/${key}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        json = await dataResponse.json();
      } catch (error) {
        alert(error.message);
      } 
      if (json) {
        let space2 = Store.deserialize( JSON.stringify( json.value));
        if (space2) {
          Object.assign(this.space, space2);
          this.view.draw();
          this.view.clearCanvas2();
          this.stop();
        }
      }
      savingSelect.selectedIndex = -1;
    });

    // Видалити сцену з бази даних
    //     
    removeSceneButton.addEventListener("click", async () => {

      if (!sceneName.value) 
        return;
      try {
        //
        const accessToken = sessionStorage.getItem("accessToken");
        const delResponse = await fetch(`/data/${sceneName.value}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}`, },
        });

        if (delResponse.ok) { 
          // delete from UI         
          const option = Array.from(savingSelect.options).find(
            (option) => option.value === sceneName.value
          );
          if (option) option.remove();
        }
      } catch (error) {
        alert(error.message);
      }
    });

    // Наповнює список сцен
    async function fillOptions() {
      
      let json;
      try {
        const accessToken = sessionStorage.getItem("accessToken");
        const dataResponse = await fetch("/data/keys", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        json = await dataResponse.json();
      } catch (error) {
        alert(error.message);
      } 
      if (json) {
        savingSelect.innerHTML = "";        
        json.keys.forEach((key) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = key;
          savingSelect.appendChild(option);
        });
      }        
    }
  }
```

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
Сторінка `http://localhost:8000/` дає змогу наявному користувачу отримати токен і переглянути запис `/data/kkk`.

Для локальної розробки без Docker:

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

## Запуск тестів

`python -m pytest`

## API

- `POST /auth/register` — створення користувача, JSON `{"username":"alice","password":"strong-password"}`.
- `POST /auth/token` — вхід через форму `username`/`password`; повертає JWT.
- `PUT /data/{key}` — створити або оновити значення. Тіло запиту — будь-яке валідне JSON.
- `GET /data/{key}` — отримати значення.
- `DELETE /data/{key}` — видалити значення.
- `GET /health` — перевірка стану сервісу.
- `GET /` — сторінка входу, яка отримує токен та запитує `GET /data/kkk`.

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

Access token дійсний 90 хвилин. Не використовуйте `.env.example` секрет у production і не додавайте `.env` до системи контролю версій. Для локального запуску без Docker встановіть власне значення `JWT_SECRET_KEY`.

