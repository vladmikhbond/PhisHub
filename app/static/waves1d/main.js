// src/models/oscillator.ts
var Oscillator = class {
  i = 0;
  amp = 0;
  ph = 0;
  // поточна фаза
  dph = 0;
  // приріст фази
  space;
  vx = 0;
  constructor(a, q, lambda, vx, i, space2) {
    this.i = i;
    this.amp = a;
    this.space = space2;
    let v = Math.sqrt(space2.k);
    if (lambda) {
      q = 2 * Math.PI / lambda;
    }
    this.dph = q * v;
    this.ph = -this.dph;
    this.vx = vx ? 1 / vx | 0 : 0;
  }
  step() {
    this.ph += this.dph;
    let f = Math.sin(this.ph);
    return f * this.amp;
  }
  killself() {
    let idx = this.space.oscillators.indexOf(this);
    if (idx != -1) {
      this.space.oscillators.splice(idx, 1);
    }
  }
};
var Mono = class extends Oscillator {
  constructor(a, q, lambda, i, space2) {
    super(a, q, lambda, 0, i, space2);
    this.ph = -Math.PI / 2 - this.dph;
  }
  step() {
    if (this.ph > 1.5 * Math.PI) {
      this.killself();
    }
    this.ph += this.dph;
    return -(Math.sin(this.ph) + 1) * this.amp / 2;
  }
};

// src/models/receiver.ts
var Receiver = class {
  i = 0;
  loss = 0;
  space;
  energy = 0;
  constructor(i, loss2, space2) {
    this.i = i;
    this.loss = loss2;
    this.space = space2;
  }
  step() {
    const v = this.space.nodes[this.i].v;
    this.energy += v ** 2 * this.loss * (2 - this.loss) / 2;
  }
};

// src/models/space.ts
var Node = class {
  u = 0;
  // shift 
  v = 0;
  // velo
  loss = 0;
  is_stone = false;
};
var Space = class {
  size;
  margin;
  k = 0;
  // = k/m
  time = 0;
  // такти часу
  nodes = [];
  oscillators = [];
  receivers = [];
  selNodeIdx = -1;
  constructor(w2, margin2, k2, loss2) {
    this.size = w2 - 2 * margin2;
    this.margin = margin2;
    this.nodes = new Array(this.n);
    for (let i = 0; i < this.n; i++) {
      this.nodes[i] = new Node();
    }
    this.k = k2;
    this.loss = loss2;
    this.setAbsorbers();
  }
  get n() {
    return this.size + this.margin * 2;
  }
  set loss(val) {
    for (let i = this.margin; i < this.margin + this.size; i++) {
      this.nodes[i].loss = val;
    }
  }
  get loss() {
    let i = this.nodes.length / 2 | 0;
    return this.nodes[i].loss;
  }
  getOscillatorAt(n) {
    for (const osc of this.oscillators) {
      if (Math.abs(osc.i - n) < 3) {
        return osc;
      }
    }
    return null;
  }
  getReceiverAt(n) {
    for (const rec of this.receivers) {
      if (Math.abs(rec.i - n) < 3) {
        return rec;
      }
    }
    return null;
  }
  calm() {
    for (let node of this.nodes) {
      node.v = 0;
      node.u = 0;
    }
    for (let osc of this.oscillators) {
      osc.ph = 0;
    }
    this.time = 0;
  }
  setAbsorbers() {
    for (let i = 0; i < this.margin; i++) {
      let xLeft = this.margin - i;
      let xRight = this.size + this.margin + i;
      let loss2 = (i / this.margin) ** 2;
      this.nodes[xLeft].loss = loss2;
      this.nodes[xRight].loss = loss2;
    }
  }
  addOscillator(o) {
    this.oscillators.push(o);
  }
  remOscillator(o) {
    const idx = this.oscillators.indexOf(o);
    if (idx != -1) {
      this.oscillators.splice(idx, 1);
    }
  }
  addReceiver(r) {
    this.receivers.push(r);
    this.nodes[r.i].loss = r.loss;
  }
  remReceiver(r) {
    const idx = this.receivers.indexOf(r);
    if (idx != -1) {
      this.receivers.splice(idx, 1);
      this.nodes[r.i].loss = this.loss;
    }
  }
  deleteAt(i) {
    this.nodes[i].is_stone = false;
    for (const o of this.oscillators.slice()) {
      if (Math.abs(o.i - i) < 3)
        this.remOscillator(o);
    }
    for (const r of this.receivers.slice()) {
      if (Math.abs(r.i - i) < 3)
        this.remReceiver(r);
    }
  }
  step() {
    const N = this.n;
    for (let n = 1; n < N - 1; n++) {
      let U = this.nodes[n + 1].u + this.nodes[n - 1].u - 2 * this.nodes[n].u;
      let a = this.k * U;
      this.nodes[n].v += a;
      this.nodes[n].v *= 1 - this.nodes[n].loss;
    }
    let c = Math.sqrt(this.k);
    let xL = this.margin + 1;
    this.nodes[xL].v = -c * (this.nodes[xL].u - this.nodes[xL + 1].u);
    let xR = this.size + this.margin - 2;
    this.nodes[xR].v = -c * (this.nodes[xR].u - this.nodes[xR - 1].u);
    for (let n = 1; n < N - 1; n++) {
      if (!this.nodes[n].is_stone) {
        this.nodes[n].u += this.nodes[n].v;
      }
    }
    for (let o of this.oscillators) {
      this.nodes[o.i].u = o.step();
    }
    for (let o of this.receivers) {
      o.step();
    }
    for (let o of this.oscillators) {
      if (o.vx && this.time % o.vx == 0) {
        this.nodes[o.i].v = (this.nodes[o.i - 1].v + this.nodes[o.i + 1].v) / 2;
        this.nodes[o.i].u = (this.nodes[o.i - 1].u + this.nodes[o.i + 1].u) / 2;
        if (o.vx > 0) o.i++;
        if (o.vx < 0) o.i--;
        if (o.i <= 0 || o.i >= N - 1) {
          o.killself();
          break;
        }
      }
    }
    this.time++;
  }
  energy() {
    let beg = this.margin + 1;
    let end = this.size + this.margin - 1;
    let e = 0;
    for (let i = beg; i < end; i++) {
      e += this.nodes[i].v ** 2;
    }
    for (let i = beg; i < end - 1; i++) {
      e += (this.nodes[i + 1].u - this.nodes[i].u) ** 2;
    }
    return e / 2;
  }
};

// src/view/view.ts
var timeEl = document.getElementById("time");
var infoEl = document.getElementById("info");
var scale = { shift: 100, velo: 1e3 };
var View = class {
  space;
  canvas;
  ctx;
  constructor(space2) {
    this.space = space2;
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.backgroundPrepare();
    this.show();
  }
  get is_velo_visible() {
    const stateElem = document.getElementById("v_range");
    return stateElem.value != "0";
  }
  backgroundPrepare() {
    let canvasBG = document.getElementById("canvasBG");
    let ctx = canvasBG.getContext("2d");
    let x0 = 0, y0 = 0, x1 = this.space.margin, y1 = this.canvas.height;
    const gradientL = ctx.createLinearGradient(x0, 0, x1, 0);
    gradientL.addColorStop(0, "lightgray");
    gradientL.addColorStop(1, "white");
    ctx.fillStyle = gradientL;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    x0 = this.space.n - this.space.margin, y0 = 0, x1 = this.space.n, y1 = this.canvas.height;
    const gradientR = ctx.createLinearGradient(x0, 0, x1, 0);
    gradientR.addColorStop(0, "white");
    gradientR.addColorStop(1, "lightgray");
    ctx.fillStyle = gradientR;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.beginPath();
    ctx.strokeStyle = "lightgray";
    for (let x = 100; x < this.canvas.width; x += 100) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
    }
    ctx.stroke();
    ctx.strokeStyle = "black";
    ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
  }
  show() {
    const end = 2 * this.space.margin + this.space.size;
    const b = this.canvas.height / 2;
    const ctx = this.ctx;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.is_velo_visible) {
      ctx.strokeStyle = "red";
      ctx.beginPath();
      for (let i = 0; i < end; i++) {
        let node = this.space.nodes[i];
        let y = node.v * scale.velo + b;
        ctx.lineTo(i, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    for (let i = 0; i < end; i++) {
      let node = this.space.nodes[i];
      let y = node.u * scale.shift + b;
      ctx.lineTo(i, y);
    }
    ctx.stroke();
    ctx.fillStyle = "green";
    for (let o of this.space.oscillators) {
      let x = o.i;
      let y = this.space.nodes[o.i].u * scale.shift + b;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    ctx.fillStyle = "red";
    for (let r of this.space.receivers) {
      let x = r.i;
      let y = this.space.nodes[r.i].u * scale.shift + b;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    ctx.fillStyle = "black";
    for (let i = 0; i < end; i++) {
      if (this.space.nodes[i].is_stone)
        ctx.fillRect(i - 3, b - 3, 6, 6);
    }
    if (this.space.selNodeIdx != -1) {
      const i = this.space.selNodeIdx;
      const node = this.space.nodes[i];
      ctx.strokeStyle = "lightgray";
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.canvas.height);
      ctx.stroke();
    }
  }
  showSelObject() {
    const idx = this.space.selNodeIdx;
    if (idx == -1) return;
    let osc = this.space.getOscillatorAt(idx);
    if (osc) {
      const grad = Math.round(osc.ph % (2 * Math.PI) * 360 / (2 * Math.PI));
      infoEl.innerHTML = `osc: #${osc.i}:  amp=${osc.amp.toFixed(1)} ph=${grad}\xB0`;
      return;
    }
    let rec = this.space.getReceiverAt(idx);
    if (rec) {
      infoEl.innerHTML = `rec: #${rec.i}:  energy=${rec.energy.toFixed(5)}`;
      return;
    }
    let node = this.space.nodes[idx];
    if (node) {
      infoEl.innerHTML = `node: #${idx}:  u=${node.u.toFixed(3)} v=${node.v.toFixed(4)}`;
    }
  }
  showTimeAndEnergy() {
    timeEl.innerHTML = `T=${this.space.time} &nbsp;&nbsp; E=${this.space.energy().toFixed(4)}`;
  }
};

// src/conroller/params.ts
function getSizeParams() {
  const paramsElement = document.getElementById("sizeParams");
  let ps2;
  try {
    ps2 = new Function(
      "",
      "let W, H, ma;" + paramsElement.value + "; return [W, H, ma]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (ps2[0] == void 0 || ps2[0] < 100 || ps2[0] > 1e4)
    return errMesage("W: (100 <= W <= 10000)", paramsElement);
  if (ps2[1] == void 0 || ps2[1] < 100 || ps2[1] > 1e4)
    return errMesage("H: (100 <= H <= 10000)", paramsElement);
  if (ps2[2] == void 0 || ps2[2] < 0 || ps2[2] > ps2[0] / 2)
    return errMesage("Margin: 0 < ma < W/2", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps2;
}
function getSpaceParams() {
  const paramsElement = document.getElementById("spaceParams");
  let ps2;
  try {
    ps2 = new Function(
      "",
      "let k, loss;" + paramsElement.value + "; return [k,  loss]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (ps2[0] == void 0 || ps2[0] < 0 || ps2[0] > 1)
    return errMesage("K: 0 < k < 1", paramsElement);
  if (ps2[1] == void 0 || ps2[1] < 0 || ps2[1] > 1)
    return errMesage("Loss: 0 < loss < 1", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps2;
}
function getOscilParams() {
  const paramsElement = document.getElementById("oscilParams");
  let ps2;
  try {
    ps2 = new Function(
      "",
      "let amp, q, vx, la;" + paramsElement.value + "; return [amp, q, vx, la]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (ps2[0] == void 0)
    return errMesage("Amplitude (amp) is undefined", paramsElement);
  if (ps2[1] == void 0 && ps2[3] == void 0)
    return errMesage("Wave number (q) and Wave length (la) are undefined", paramsElement);
  if (ps2[2] == void 0)
    return errMesage("Hor velocity (vx) is undefined", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps2;
}
function getReceiverParams() {
  const paramsElement = document.getElementById("recieverParams");
  let ps2;
  try {
    ps2 = new Function(
      "",
      "let loss;" + paramsElement.value + "; return [loss];"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (ps2[0] == void 0 || ps2[0] < 0 || ps2[0] > 1)
    return errMesage("Loss: 0 <= loss <= 1", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps2;
}
function errMesage(mes, el) {
  alert(mes);
  el.style.backgroundColor = "pink";
  return null;
}

// src/conroller/utils.ts
function sceneToJson(space2) {
  const data = {
    size: space2.size,
    margin: space2.margin,
    k: space2.k,
    time: space2.time,
    selNodeIdx: space2.selNodeIdx,
    nodes: space2.nodes.map((node) => ({
      u: node.u,
      v: node.v,
      loss: node.loss,
      is_stone: node.is_stone
    })),
    oscillators: space2.oscillators.map((osc) => ({
      type: osc instanceof Mono ? "Mono" : "Oscillator",
      amp: osc.amp,
      ph: osc.ph,
      dph: osc.dph,
      vx: osc.vx,
      i: osc.i
    })),
    receivers: space2.receivers.map((rec) => ({
      i: rec.i,
      loss: rec.loss,
      energy: rec.energy
    }))
  };
  return JSON.stringify(data, null, 2);
}
function restoreOscillator(data, space2) {
  if (!data || typeof data !== "object") {
    return null;
  }
  const amp = Number(data.amp) || 0;
  const vx = Number(data.vx) || 0;
  const i = Number(data.i) || 0;
  let osc;
  if (data.type === "Mono") {
    osc = new Mono(amp, 0, 0, i, space2);
  } else {
    osc = new Oscillator(amp, 0, 0, vx, i, space2);
  }
  if (typeof data.dph === "number") {
    osc.dph = data.dph;
  }
  if (typeof data.ph === "number") {
    osc.ph = data.ph;
  }
  osc.vx = vx;
  osc.i = i;
  return osc;
}
function restoreSceneFromJson(json, space2) {
  if (!json) {
    return;
  }
  let data;
  try {
    data = JSON.parse(json);
  } catch (error) {
    console.error("restoreSceneFromJson: invalid JSON", error);
    return;
  }
  if (!data || typeof data !== "object") {
    return;
  }
  if (typeof data.size === "number") {
    space2.size = data.size;
  }
  if (typeof data.margin === "number") {
    space2.margin = data.margin;
  }
  if (typeof data.k === "number") {
    space2.k = data.k;
  }
  if (typeof data.time === "number") {
    space2.time = data.time;
  }
  space2.selNodeIdx = typeof data.selNodeIdx === "number" ? data.selNodeIdx : -1;
  const nodeCount = space2.size + space2.margin * 2;
  space2.nodes = new Array(nodeCount);
  const savedNodes = Array.isArray(data.nodes) ? data.nodes : [];
  for (let idx = 0; idx < nodeCount; idx++) {
    const saved = savedNodes[idx] || {};
    const node = new Node();
    node.u = typeof saved.u === "number" ? saved.u : 0;
    node.v = typeof saved.v === "number" ? saved.v : 0;
    node.loss = typeof saved.loss === "number" ? saved.loss : 0;
    node.is_stone = Boolean(saved.is_stone);
    space2.nodes[idx] = node;
  }
  space2.oscillators = [];
  if (Array.isArray(data.oscillators)) {
    for (const oscData of data.oscillators) {
      const osc = restoreOscillator(oscData, space2);
      if (osc) {
        space2.addOscillator(osc);
      }
    }
  }
  space2.receivers = [];
  if (Array.isArray(data.receivers)) {
    for (const recData of data.receivers) {
      if (!recData || typeof recData !== "object") {
        continue;
      }
      const i = Number(recData.i) || 0;
      const loss2 = Number(recData.loss) || 0;
      const receiver = new Receiver(i, loss2, space2);
      receiver.energy = Number(recData.energy) || 0;
      space2.addReceiver(receiver);
    }
  }
}

// src/conroller/controller.ts
var modeElement = document.getElementById("mode");
var timer = 0;
var Controller = class {
  space;
  view;
  constructor(space2, view2, height) {
    this.space = space2;
    this.view = view2;
    this.addListeners();
    this.addDataHandlers();
    this.initCanvases(space2.n, height);
  }
  initCanvases(w2, h2) {
    document.documentElement.style.setProperty("--canvas-width", w2 + "px");
    document.documentElement.style.setProperty("--canvas-height", h2 + "px");
    const canvas = document.getElementById("canvas");
    const canvasBG = document.getElementById("canvasBG");
    canvas.width = w2;
    canvas.height = h2;
    canvasBG.width = w2;
    canvasBG.height = h2;
    this.view.backgroundPrepare();
  }
  addListeners() {
    document.getElementById("runButton").addEventListener("click", () => {
      if (timer)
        this.stop();
      else
        this.run();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key == "s" || e.key == "\u0456") {
        stop();
        this.step();
        this.view.showSelObject();
      }
    });
    document.getElementById("sizeParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        this.stop();
        const ps2 = getSizeParams();
        if (ps2 == null)
          return;
        let [w2, h2, margin2] = ps2;
        this.view.space = this.space = new Space(w2, margin2, this.space.k, this.space.loss);
        this.initCanvases(w2, h2);
        this.view.show();
      }
    });
    document.getElementById("spaceParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        this.stop();
        const ps2 = getSpaceParams();
        if (ps2 == null)
          return;
        let [k2, loss2] = ps2;
        if (this.space.k != k2 || this.space.loss != loss2) {
          this.space.k = k2;
          this.space.loss = loss2;
        } else {
          this.space.calm();
        }
        this.view.show();
      }
    });
    document.getElementById("oscilParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        getOscilParams();
      }
    });
    document.getElementById("recieverParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        getReceiverParams();
      }
    });
    document.getElementById("canvas").addEventListener("mousedown", (e) => {
      const x = e.offsetX;
      const [ampl, q, vx, lambda] = getOscilParams();
      if (e.button == 2) {
        this.space.deleteAt(x);
        this.view.show();
        return;
      }
      switch (this.mode) {
        case 0 /* Inf */:
          this.space.selNodeIdx = x;
          this.view.showSelObject();
          break;
        case 1 /* Osc */:
          this.space.addOscillator(new Oscillator(ampl, q, lambda, vx, x, this.space));
          break;
        case 2 /* Mon */:
          this.space.addOscillator(new Mono(ampl, q, lambda, x, this.space));
          break;
        case 3 /* Rec */:
          const ps2 = getReceiverParams();
          if (ps2) {
            this.space.addReceiver(new Receiver(x, ps2[0], this.space));
          }
          break;
        case 4 /* Sto */:
          this.space.nodes[x].is_stone = true;
          break;
        case 5 /* Del */:
          this.space.deleteAt(x);
          break;
      }
      this.view.show();
    });
    document.getElementById("s_range").addEventListener("change", (e) => {
      scale.shift = +e.target.value;
      this.view.show();
    });
    document.getElementById("v_range").addEventListener("change", (e) => {
      scale.velo = +e.target.value;
      this.view.show();
    });
    document.getElementById("mode").addEventListener("change", (e) => {
      document.getElementById("oscilParams").style.display = this.mode == 1 /* Osc */ || this.mode == 2 /* Mon */ ? "inline" : "none";
      document.getElementById("recieverParams").style.display = this.mode == 3 /* Rec */ ? "inline" : "none";
    });
    document.getElementById("helpButton").addEventListener("click", () => {
      window.open("help.html", "_blank")?.focus();
    });
  }
  // повертає серіалізовану модель у вигляді рядку JSON
  getCurrentModelAsJson() {
    return sceneToJson(this.space);
  }
  // оновлює модель з рядку JSON
  setCurrentModelWithJson(jsonStr) {
    restoreSceneFromJson(jsonStr, this.space);
    this.stop();
    this.space.time = 0;
    this.view.show();
  }
  
///////////////////////////////////////////////////////////////////////
  addDataHandlers() 
  {
    const KEY_PREFIX = "waves1d.";
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



  // ---------------- Props -------------------
  get mode() {
    switch (modeElement.value) {
      case "Osc":
        return 1 /* Osc */;
      case "Sto":
        return 4 /* Sto */;
      case "Mon":
        return 2 /* Mon */;
      case "Rec":
        return 3 /* Rec */;
      case "Del":
        return 5 /* Del */;
      default:
        return 0 /* Inf */;
    }
  }
  // ------------------- Time methods -------------------
  step() {
    this.space.step();
    this.view.show();
    if (this.space.time % 10 === 0) {
      this.view.showTimeAndEnergy();
    }
  }
  stop() {
    if (timer) {
      clearInterval(timer);
      timer = 0;
      this.view.showSelObject();
    }
  }
  run() {
    if (timer)
      return;
    timer = setInterval(() => this.step(), 10);
  }
};

// src/main.ts
var ps = getSizeParams();
var [w, h, margin] = ps;
var [k, loss] = getSpaceParams();
var space = new Space(w, margin, k, loss);
var view = new View(space);
new Controller(space, view, h);
view.show();

