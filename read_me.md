## Вимоги до клієнтских додатків

Папку додатку покласти в папку app/static.

Головна сторінка додатку - index.html.

На сторінці index.html повино бути посилиння на main.js і повинно бути 4 елемента:

```sh
          <button id="saveSceneButton" class="scene-btn" title="Save script">✔</button>
          <input id="sceneName" type="text" class="scene-name" title="Scene name" >
          <select id="sceneSelect" class="scene-select" ></select>
          <button id="removeSceneButton" class="scene-btn" title="Delete script">❌</button>
```

``` css
:root {
    --canvas-width: 500px;
    --canvas-height: 500px;
    --element-height: 44px;
}

/* ------------------ bottom panel ---------------- */
.bottom-panel {
   margin-top: 8px;
} 

.scene-select {
    display: inline; 
    height: var(--element-height);
    width: calc(var(--canvas-width) - 305px);
}
.scene-name {
    display: inline; 
    width: 150px !important;
}
.scene-btn {
    vertical-align: top; 
    background-color: lightblue;
    width: 70px;
}```



В main.js додатку має бути класс Controller, а в ньому методи:

// повертає серіалізовану модель у вигляді рядку JSON
getCurrentModelAsJson(): string {
    return ""
}


// оновлює модель з рядку JSON
setCurrentModelWithJson(jsonStr: string ) {

}

addDataHandlers() 


метод addDataHandlers() замінюється на наведений нижче.

Перед заміною встановити унік знач константи KEY_PREFIX
і в файлі main.js прибрати останній рядок - мепінг до ts.


``` javascript
///////////////////////////////////////////////////////////////////////
  addDataHandlers() 
  {
    const KEY_PREFIX = "maxwell.";
    const sceneSelect = document.getElementById("sceneSelect");
    const sceneName = document.getElementById("sceneName");
    const saveSceneButton = document.getElementById("saveSceneButton");
    const removeSceneButton = document.getElementById("removeSceneButton");

    const getCsrfToken = () => {
      const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("csrf_token="));
      return cookie ? decodeURIComponent(cookie.slice("csrf_token=".length)) : "";
    };

    // Наповнює список сцен і завантажує першу сцену
    fillOptions().then(s => {
      if (sceneSelect.children.length)
        sceneSelect.dispatchEvent(new Event("change"));
    });

    // Зберегти сцену в базі даних
    //
    saveSceneButton.addEventListener("click", async () => {
      try {
        const val = this.getCurrentModelAsJson();                                  ////
        const key = KEY_PREFIX + sceneName.value;
        const putResponse = await fetch(`/data/${key}`, {
          method: "PUT",
          headers: {
            "X-CSRF-Token": getCsrfToken(),
            "Content-Type": "application/json",
          },
          body: val,
        });

        if (putResponse.ok) {
          await fillOptions();
        }
      } catch (error) {
        console.error(error.message);
      }
    });
    
    // Завантажити сцену з бази даних
    //
    sceneSelect.addEventListener("change", async () => {
      let key = KEY_PREFIX + sceneSelect.selectedOptions[0].value;
      try {
        const dataResponse = await fetch(`/data/${key}`);

        if (dataResponse.ok) {
          const keyValueObject = await dataResponse.json();
          this.setCurrentModelWithJson(JSON.stringify(keyValueObject.value));
        }
      } catch (error) {
        console.error(error.message);
      } 
    });

    // Видалити сцену з бази даних
    //     
    removeSceneButton.addEventListener("click", async () => {

      const key = KEY_PREFIX + sceneName.value;
      try {
        //
        const delResponse = await fetch(`/data/${key}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": getCsrfToken() },
        });

        if (delResponse.ok) { 
          await fillOptions();
        }
      } catch (error) {
        console.error(error.message);
      }
    });

    // Наповнює список сцен
    async function fillOptions() {
      let json;
      try {
        const dataResponse = await fetch(`/data/keys/${KEY_PREFIX}`);
        json = await dataResponse.json();
      } catch (error) {
        console.error(error.message);
      } 
      if (json) {
        sceneSelect.innerHTML = "";        
        json.keys.forEach((key) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = key;
          sceneSelect.appendChild(option);
        });
      }        
    }
  }
///////////////////////////////////////////////////////////////////////

```

# TODO




саморегістрація

