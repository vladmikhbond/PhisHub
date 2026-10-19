## Вимоги до клієнтских додатків

Папку додатку покласти в папку app/static.

Головна сторінка додатку - index.html.

На сторінці index.html є посилиння на main.js і є 4 елемента

```sh
          <button id="saveSceneButton" class="scene-btn" title="Save script">✔</button>
          <input id="sceneName" type="text" class="scene-name" title="Scene name" >
          <select id="sceneSelect" class="scene-select" ></select>
          <button id="removeSceneButton" class="scene-btn" title="Delete script">❌</button>
```

В main.js додатку є класс Controller, а в ньому метод addDataHandlers().
Цей метод замінюється.