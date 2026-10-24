// src/models/oscillator.ts
var Oscillator = class {
  r = 0;
  c = 0;
  amp = 0;
  ph = 0;
  dph = 0;
  space;
  vx = 0;
  constructor(r, c, a, q, lambda, vx, space) {
    this.r = r;
    this.c = c;
    this.amp = a;
    this.space = space;
    let v = Math.sqrt(space.k);
    if (lambda) {
      q = 2 * Math.PI / lambda;
    }
    this.dph = q * v;
    this.ph = -this.dph;
    this.vx = vx ? 1 / vx | 0 : 0;
  }
  next_s() {
    this.ph += this.dph;
    return Math.sin(this.ph) * this.amp;
  }
};
var Mono = class extends Oscillator {
  constructor(r, c, a, q, lambda, space) {
    super(r, c, a, q, lambda, 0, space);
    this.ph = -Math.PI / 2 - this.dph;
  }
  next_s() {
    if (this.ph > 1.5 * Math.PI) {
      this.killself();
    }
    this.ph += this.dph;
    return -(Math.sin(this.ph) + 1) * this.amp / 2;
  }
  killself() {
    let idx = this.space.oscillators.indexOf(this);
    if (idx != -1) {
      this.space.oscillators.splice(idx, 1);
    }
  }
};

// src/models/receiver.ts
var Receiver = class {
  r = 0;
  c = 0;
  loss = 0;
  space;
  energy = 0;
  constructor(r, c, loss, space) {
    this.r = r;
    this.c = c;
    this.loss = loss;
    this.space = space;
  }
  step() {
    const v = this.space.nodes[this.r][this.c].v;
    this.energy += v ** 2 * this.loss * (2 - this.loss) / 2;
  }
};

// src/models/space.ts
var Node = class {
  z = 0;
  v = 0;
  l = 0;
  is_stone = false;
  constructor(loss) {
    this.l = loss;
  }
};
var Space = class {
  size;
  k = 0;
  time = 0;
  // такти часу
  nodes = [];
  oscillators = [];
  receivers = [];
  bars = [];
  constructor(size, k_m, loss) {
    this.size = size;
    this.k = k_m;
    this.nodes = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      this.nodes[i] = new Array(this.size);
      for (let j = 0; j < this.size; j++) {
        this.nodes[i][j] = new Node(loss);
      }
    }
  }
  getOscillatorAt(r, c) {
    for (const osc of this.oscillators) {
      if (Math.abs(osc.r - r) < 3 && Math.abs(osc.c - c) < 3) {
        return osc;
      }
    }
    return null;
  }
  getReceiverAt(r, c) {
    for (const rec of this.receivers) {
      if (Math.abs(rec.r - r) < 3 && Math.abs(rec.c - c) < 3) {
        return rec;
      }
    }
    return null;
  }
  addOscillator(osc) {
    this.oscillators.push(osc);
  }
  addReceiver(rec) {
    this.receivers.push(rec);
    this.nodes[rec.r][rec.c].l = rec.loss;
  }
  remReceiver(rec) {
    const idx = this.receivers.indexOf(rec);
    if (idx != -1) {
      this.receivers.splice(idx, 1);
      this.nodes[rec.r][rec.c].l = this.loss;
    }
  }
  addBar(bar) {
    this.bars.push(bar);
    this.throwStones();
  }
  DeleteInRect(r1, c1, r2, c2) {
    this.bars = this.bars.filter((b) => !(r1 < b.r1 && b.r1 < r2 && c1 < b.c1 && b.c1 < c2 && r1 < b.r2 && b.r2 < r2 && c1 < b.c2 && b.c2 < c2));
    this.oscillators = this.oscillators.filter((o) => !(r1 < o.r && o.r < r2 && c1 < o.c && o.c < c2));
    const receiversToRemove = this.receivers.filter((o) => r1 < o.r && o.r < r2 && c1 < o.c && o.c < c2);
    for (const rec of receiversToRemove) {
      this.remReceiver(rec);
    }
    this.throwStones();
  }
  throwStones() {
    for (let r = 0; r < this.size - 1; r++) {
      for (let c = 0; c < this.size - 1; c++) {
        this.nodes[r][c].is_stone = false;
      }
    }
    for (let bar of this.bars) {
      let c1 = bar.c1, c0 = bar.c2, r1 = bar.r1, r0 = bar.r2;
      if (Math.abs(c1 - c0) < Math.abs(r1 - r0)) {
        if (r1 < r0)
          [r0, r1, c0, c1] = [r1, r0, c1, c0];
        for (let r = r0; r <= r1; r++) {
          let c = (r - r0) * (c1 - c0) / (r1 - r0) + c0 | 0;
          this.nodes[r][c].is_stone = true;
        }
      } else {
        if (c1 < c0)
          [r0, r1, c0, c1] = [r1, r0, c1, c0];
        for (let c = c0; c <= c1; c++) {
          let r = (c - c0) * (r1 - r0) / (c1 - c0) + r0 | 0;
          this.nodes[r][c].is_stone = true;
        }
      }
    }
  }
  step() {
    const n = this.size;
    for (let r = 1; r < n - 1; r++) {
      for (let c = 1; c < n - 1; c++) {
        let z = this.nodes[r - 1][c].z + this.nodes[r + 1][c].z + this.nodes[r][c - 1].z + this.nodes[r][c + 1].z - 4 * this.nodes[r][c].z;
        let a = this.k * z;
        this.nodes[r][c].v += a;
        this.nodes[r][c].v *= 1 - this.nodes[r][c].l;
      }
    }
    let vPhase = Math.sqrt(this.k);
    let cL = 1;
    let cR = this.size - 2;
    for (let r = 1; r < n - 1; r++) {
      this.nodes[r][cL].v = -vPhase * (this.nodes[r][cL].z - this.nodes[r][cL + 1].z);
      this.nodes[r][cR].v = -vPhase * (this.nodes[r][cR].z - this.nodes[r][cR - 1].z);
    }
    let rU = 1;
    let rL = this.size - 2;
    for (let c = 1; c < n - 1; c++) {
      this.nodes[rU][c].v = -vPhase * (this.nodes[rU][c].z - this.nodes[rU + 1][c].z);
      this.nodes[rL][c].v = -vPhase * (this.nodes[rL][c].z - this.nodes[rL - 1][c].z);
    }
    for (let r = 1; r < n - 1; r++) {
      for (let c = 1; c < n - 1; c++) {
        if (!this.nodes[r][c].is_stone)
          this.nodes[r][c].z += this.nodes[r][c].v;
      }
    }
    for (let osc of this.oscillators) {
      this.nodes[osc.r][osc.c].z = osc.next_s();
    }
    for (let rec of this.receivers) {
      rec.step();
    }
    for (let o of this.oscillators) {
      if (o.vx && this.time % o.vx == 0) {
        this.nodes[o.r][o.c].v = (this.nodes[o.r][o.c - 1].v + this.nodes[o.r][o.c + 1].v + this.nodes[o.r - 1][o.c].v + this.nodes[o.r + 1][o.c].v) / 4;
        this.nodes[o.r][o.c].z = (this.nodes[o.r][o.c - 1].z + this.nodes[o.r][o.c + 1].z + this.nodes[o.r - 1][o.c].z + this.nodes[o.r + 1][o.c].z) / 4;
        if (o.vx > 0) o.c++;
        if (o.vx < 0) o.c--;
      }
    }
    this.time++;
  }
  set loss(l) {
    const beg = 0, end = beg + this.size;
    for (let r = beg; r < end; r++) {
      for (let c = beg; c < end; c++) {
        this.nodes[r][c].l = l;
      }
    }
  }
  get loss() {
    let i = this.nodes.length / 2 | 0;
    return this.nodes[i][i].l;
  }
  // заспокоює хвилі
  calm() {
    const n = this.size;
    for (let r = 1; r < this.size - 1; r++) {
      for (let c = 1; c < this.size - 1; c++) {
        this.nodes[r][c].z = 0;
        this.nodes[r][c].v = 0;
      }
    }
    for (let o of this.oscillators) {
      o.ph = -Math.PI / 2 - o.dph;
    }
    this.time = 0;
  }
  energy() {
    const n = this.size;
    let e = 0;
    for (let r = 1; r < n - 1; r++) {
      for (let c = 1; c < n - 1; c++) {
        e += this.nodes[r][c].v ** 2;
      }
    }
    for (let r = 1; r < n - 2; r++) {
      for (let c = 1; c < n - 2; c++) {
        e += (this.nodes[r][c + 1].z - this.nodes[r][c].z) ** 2 + (this.nodes[r + 1][c].z - this.nodes[r][c].z) ** 2;
      }
    }
    return e / 2;
  }
};

// src/view/view3d.ts
import * as THREE from "three";
var canvas3d;
var time;
var renderer;
var scene;
var camera;
var ambientLight;
var directionalLight;
var mesh = null;
var positions = null;
var nVisCurrent = 0;
var oscGroup;
var recGroup;
var barsGroup;
var barGeometry = new THREE.CylinderGeometry(2, 2, 1, 16);
var barMaterial = new THREE.MeshStandardMaterial({ color: 16777215, metalness: 0.2, roughness: 0.7 });
function init3d(n) {
  canvas3d = document.getElementById("canvas3d");
  canvas3d.width = canvas3d.height = n;
  canvas3d.style.width = canvas3d.style.height = `${2 * n}px`;
  time = document.getElementById("time");
  renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas3d.width, canvas3d.height, false);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(8900331);
  let camera_angle = 30;
  let camera_dist = canvas3d.width / (2 * Math.tan(Math.PI / 180 * (camera_angle / 2)));
  camera = new THREE.PerspectiveCamera(camera_angle, canvas3d.width / canvas3d.height, 0.1, 5e3);
  camera.position.set(0, -camera_dist, 0);
  camera.lookAt(0, 0, 0);
  ambientLight = new THREE.AmbientLight(16777215, 0.8);
  directionalLight = new THREE.DirectionalLight(16777215, 1.2);
  directionalLight.position.set(1, -2, 2);
  scene.add(ambientLight, directionalLight);
  mesh = null;
  positions = null;
  nVisCurrent = 0;
  oscGroup = new THREE.Group();
  recGroup = new THREE.Group();
  barsGroup = new THREE.Group();
  scene.add(oscGroup);
  scene.add(recGroup);
  scene.add(barsGroup);
}
function createBarMesh(start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const bar = new THREE.Mesh(barGeometry, barMaterial);
  if (length > 0) {
    bar.scale.set(1, length, 1);
    bar.position.copy(start).add(end).multiplyScalar(0.5);
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  } else {
    bar.position.copy(start);
  }
  return bar;
}
function createGrid(n) {
  const geometry = new THREE.PlaneGeometry(n, n, n - 1, n - 1);
  geometry.rotateX(Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: 49151,
    wireframe: false,
    side: THREE.DoubleSide,
    metalness: 0.3,
    roughness: 0.5,
    flatShading: false
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);
  positions = geometry.attributes.position.array;
  nVisCurrent = n;
}
function updateSurface(space) {
  const n = space.size;
  if (!mesh || nVisCurrent !== n) {
    if (mesh) scene.remove(mesh);
    createGrid(n);
  }
  if (!positions || !mesh) return;
  const rowSize = n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const node = space.nodes[r][c];
      const idx = 3 * (r * rowSize + c);
      positions[idx + 1] = node.z * zScale;
    }
  }
  const geometry = mesh.geometry;
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
}
function updateBars(space) {
  barsGroup.clear();
  const n2 = space.size / 2;
  for (const b of space.bars) {
    const x1 = b.c1 - n2 + 0.5;
    const z1 = -(b.r1 - n2 + 0.5);
    const x2 = b.c2 - n2 + 0.5;
    const z2 = -(b.r2 - n2 + 0.5);
    const start = new THREE.Vector3(x1, 0, z1);
    const end = new THREE.Vector3(x2, 0, z2);
    barsGroup.add(createBarMesh(start, end));
  }
}
function updateOscillators(space) {
  oscGroup.clear();
  const n2 = space.size / 2;
  const sphereGeom = new THREE.SphereGeometry(2, 10, 10);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 16724787, emissive: 3342336 });
  for (const o of space.oscillators) {
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    let x = o.c - n2 + 0.5;
    let z = -(o.r - n2 + 0.5);
    sphere.position.set(x, o.amp * 3, z);
    oscGroup.add(sphere);
  }
}
function updateReceivers(space) {
  recGroup.clear();
  const n2 = space.size / 2;
  const sphereGeom = new THREE.SphereGeometry(2, 10, 10);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 16776960, emissive: 3342336 });
  for (const rec of space.receivers) {
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    let x = rec.c - n2 + 0.5;
    let z = -(rec.r - n2 + 0.5);
    sphere.position.set(x, 0, z);
    oscGroup.add(sphere);
  }
}
function show3d(space) {
  updateSurface(space);
  updateBars(space);
  updateOscillators(space);
  updateReceivers(space);
  renderer.render(scene, camera);
  time.textContent = space.time.toString();
}

// src/view/view2d.ts
var canvas2d;
var ctx;
var iData;
var data;
function init2d(n) {
  document.documentElement.style.setProperty("--canvas-width", 2 * n + "px");
  document.documentElement.style.setProperty("--canvas-height", 2 * n + "px");
  canvas2d = document.getElementById("canvas2d");
  canvas2d.width = canvas2d.height = n;
  canvas2d.style.width = canvas2d.style.height = `${2 * n}px`;
  ctx = canvas2d.getContext("2d");
  iData = ctx.getImageData(0, 0, canvas2d.width, canvas2d.height);
  data = iData.data;
  for (let y = 0; y < canvas2d.height; y++) {
    for (let x = 0; x < canvas2d.width; x++) {
      color(x, y, 255, 2);
    }
  }
  ctx.putImageData(iData, 0, 0);
}
function color(x, y, depth, channel) {
  let i1 = (y * canvas2d.width + x) * 4 + channel;
  let i2 = i1 + 4;
  let i3 = i1 + canvas2d.width * 4;
  let i4 = i3 + 4;
  data[i1] = data[i2] = data[i3] = data[i4] = depth;
}
function show2d(space) {
  for (let r = 0; r < space.size; r++) {
    for (let c = 0; c < space.size; c++) {
      let x = c;
      let y = r;
      let level = 127 + 127 * zScale * space.nodes[r][c].z | 0;
      if (level > 255)
        level = 255;
      if (level < 0)
        level = 0;
      color(x, y, level, 3);
      if (space.nodes[r][c].is_stone) {
        color(x, y, 0, 3);
        color(x + 1, y, 0, 3);
        color(x, y + 1, 0, 3);
        color(x + 1, y + 1, 0, 3);
      }
    }
  }
  ctx.putImageData(iData, 0, 0);
  for (let o of space.oscillators) {
    let x = o.c;
    let y = o.r;
    ctx.fillStyle = "red";
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  for (let o of space.receivers) {
    let x = o.c;
    let y = o.r;
    ctx.fillStyle = "yellow";
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
}
function grayLine2d(x1, y1, x2, y2) {
  ctx.strokeStyle = "lightgray";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function grayRect2d(x1, y1, x2, y2) {
  ctx.strokeStyle = "lightgray";
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}
function clearCanvas2d() {
  ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
}

// src/models/bar.ts
var Bar = class {
  r1 = 0;
  c1 = 0;
  r2 = 0;
  c2 = 0;
  constructor(r1, c1, r2, c2) {
    this.r1 = r1;
    this.c1 = c1;
    this.r2 = r2;
    this.c2 = c2;
  }
};

// src/controller/params.ts
function getParams(elementId) {
  const paramsElement = document.getElementById(elementId);
  try {
    return new Function(
      "",
      `return {${paramsElement.value}};`
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
}
function errMesage(mes, el) {
  alert(mes);
  el.style.backgroundColor = "pink";
  return null;
}

// src/controller/utils.ts
function sceneToJson(space) {
  const scene2 = {
    size: space.size,
    k: space.k,
    time: space.time,
    loss: space.loss,
    oscillators: space.oscillators.map((osc) => ({
      r: osc.r,
      c: osc.c,
      amp: osc.amp,
      ph: osc.ph,
      dph: osc.dph,
      vx: osc.vx,
      type: osc instanceof Mono ? "Mono" : "Oscillator"
    })),
    receivers: space.receivers.map((rec) => ({
      r: rec.r,
      c: rec.c,
      loss: rec.loss,
      energy: rec.energy
    })),
    bars: space.bars.map((bar) => ({
      r1: bar.r1,
      c1: bar.c1,
      r2: bar.r2,
      c2: bar.c2
    })),
    paramsValue: document.getElementById("spaceParams").value
  };
  return JSON.stringify(scene2, null, 2);
}
function restoreSceneFromJson(json, space) {
  if (!json) {
    return;
  }
  let scene2;
  try {
    scene2 = JSON.parse(json);
  } catch (er) {
    alert(er);
    return;
  }
  space.size = scene2.size;
  space.k = scene2.k;
  space.time = scene2.time;
  space.nodes = new Array(space.size);
  for (let i = 0; i < space.size; i++) {
    space.nodes[i] = new Array(space.size);
    for (let j = 0; j < space.size; j++) {
      space.nodes[i][j] = new Node(scene2.loss);
    }
  }
  space.bars = scene2.bars.map((bar) => new Bar(bar.r1, bar.c1, bar.r2, bar.c2));
  space.throwStones();
  space.oscillators = [];
  for (const oscData of scene2.oscillators) {
    const oscillator = oscData.type === "Mono" ? new Mono(oscData.r, oscData.c, oscData.amp, 0, 0, space) : new Oscillator(oscData.r, oscData.c, oscData.amp, 0, 0, oscData.vx, space);
    oscillator.ph = oscData.ph;
    oscillator.dph = oscData.dph;
    space.addOscillator(oscillator);
  }
  space.receivers = [];
  for (const receiverData of scene2.receivers) {
    const receiver = new Receiver(receiverData.r, receiverData.c, receiverData.loss, space);
    receiver.energy = receiverData.energy;
    space.addReceiver(receiver);
  }
  document.getElementById("spaceParams").value = scene2.paramsValue;
}

// src/controller/controller.ts
var canvas2d2 = document.getElementById("canvas2d");
var canvas3d2 = document.getElementById("canvas3d");
var modeElement = document.getElementById("mode");
var timeElement = document.getElementById("time");
var infoElement = document.getElementById("info");
var zScale = 50;
var show = show2d;
var Controller = class {
  space;
  timer = 0;
  viewMode = 0 /* Two */;
  constructor() {
    const ps = getParams("infoParams");
    this.space = new Space(ps.size, ps.k, ps.loss);
    this.addOtherListeners();
    this.addMouseListeners(canvas2d2);
    this.addDataHandlers();
    this.initCanvases();
  }
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
  initCanvases() {
    const n = this.space.size;
    document.documentElement.style.setProperty("--canvas-width", 2 * n + "px");
    document.documentElement.style.setProperty("--canvas-height", 2 * n + "px");
    init2d(n);
    init3d(n);
    show(this.space);
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
    show(this.space);
  }

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
  

  //#region other listeners
  addOtherListeners() {
    document.getElementById("runButton").addEventListener("click", () => {
      if (this.timer) this.stop();
      else this.run();
    });
    document.getElementById("dButton").addEventListener("click", (e) => {
      if (this.viewMode == 0 /* Two */) {
        this.viewMode = 1 /* Three */;
        show = show3d;
        clearCanvas2d();
        canvas3d2.style.display = "block";
        e.target.innerHTML = "2d";
      } else {
        this.viewMode = 0 /* Two */;
        show = show2d;
        canvas3d2.style.display = "none";
        e.target.innerHTML = "3d";
      }
      show(this.space);
    });
    document.getElementById("helpButton").addEventListener("click", () => {
      window.open("help.html", "_blank")?.focus();
    });
    document.getElementById("zScale").addEventListener("change", (e) => {
      zScale = +e.target.value;
      show(this.space);
      document.getElementById("zScaleValue").innerHTML = "1:" + zScale;
    });
    document.getElementById("mode").addEventListener("change", (e) => {
      let infoParams = document.getElementById("infoParams").style;
      let oscilParams = document.getElementById("oscilParams").style;
      let recieverParams = document.getElementById("recieverParams").style;
      infoParams.display = oscilParams.display = recieverParams.display = "none";
      switch (this.mode) {
        case 0 /* Inf */:
          infoParams.display = "inline";
          break;
        case (1 /* Osc */, 2 /* Mon */):
          oscilParams.display = "inline";
          break;
        case 3 /* Rec */:
          recieverParams.display = "inline";
          break;
      }
    });
    document.getElementById("infoParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        document.getElementById("zScale").focus();
        this.stop();
        const ps = getParams("infoParams");
        if (this.space.size != ps.size) {
          this.space = new Space(ps.size, ps.k, ps.loss);
          this.initCanvases();
          return;
        }
        if (this.space.k != ps.k || this.space.loss != ps.loss) {
          this.space.k = ps.k;
          this.space.loss = ps.loss;
        } else {
          this.space.calm();
        }
        show(this.space);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key == "s") {
        this.stop();
        this.step();
      }
    });
  }
  step() {
    this.space.step();
    show(this.space);
    if (this.space.time % 10 == 0) {
      timeElement.innerHTML = `T=${this.space.time} &nbsp;&nbsp; E=${this.space.energy().toFixed(4)}`;
    }
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = 0;
    }
  }
  run() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.step();
    }, 1);
  }
  //#endregion otner listeners
  //#region mouse listeners
  addMouseListeners(canvas) {
    const scale = 2;
    let x0 = 0, y0 = 0, mousedown = false;
    canvas.addEventListener("mousedown", (e) => {
      x0 = e.offsetX;
      y0 = e.offsetY;
      mousedown = true;
    });
    canvas.addEventListener("mousemove", (e) => {
      const c0 = x0 / scale | 0;
      const r0 = y0 / scale | 0;
      const c = e.offsetX / scale | 0;
      const r = e.offsetY / scale | 0;
      if (mousedown) {
        show(this.space);
        if (this.viewMode == 1 /* Three */) {
          clearCanvas2d();
        }
        if (this.mode == 5 /* Del */) {
          grayRect2d(c0, r0, c, r);
        } else {
          grayLine2d(c0, r0, c, r);
        }
      }
      if (this.space.nodes[r][c]) {
        infoElement.innerHTML = `r:${r}, c:${c}, z:${this.space.nodes[r][c].z.toFixed(3)}`;
        let osc = this.space.getOscillatorAt(r, c);
        if (osc)
          infoElement.innerHTML = `r:${osc.r}, c:${osc.c}, Osc: amp=${osc.amp.toFixed(3)} ph=${osc.ph.toFixed(3)}`;
        let rec = this.space.getReceiverAt(r, c);
        if (rec)
          infoElement.innerHTML = `r:${rec.r}, c:${rec.c}, Rec: energy${rec.energy.toFixed(6)}`;
      }
    });
    canvas.addEventListener("mouseup", (e) => {
      const c0 = x0 / scale | 0;
      const r0 = y0 / scale | 0;
      const c1 = e.offsetX / scale | 0;
      const r1 = e.offsetY / scale | 0;
      mousedown = false;
      switch (this.mode) {
        case 1 /* Osc */:
        case 2 /* Mon */:
          this.addOscillators(r0, c0, r1, c1);
          break;
        case 4 /* Sto */:
          this.addBars(r0, c0, r1, c1);
          break;
        case 3 /* Rec */:
          const ps = getParams("receiverParams");
          this.addReceivers(r0, c0, r1, c1, ps.loss);
          break;
        case 5 /* Del */:
          this.space.DeleteInRect(r0, c0, r1, c1);
          break;
      }
      show(this.space);
      if (this.viewMode == 1 /* Three */) {
        clearCanvas2d();
      }
    });
  }
  addOscillators(r0, c0, r1, c1) {
    const ps = getParams("oscilParams");
    if (c0 == c1 && r0 == r1) {
      let osc = this.mode == 1 /* Osc */ ? new Oscillator(r0, c0, ps.amp, ps.q, ps.lambda, ps.vx, this.space) : new Mono(r0, c0, ps.amp, ps.q, ps.lambda, this.space);
      this.space.addOscillator(osc);
      return;
    }
    if (Math.abs(c1 - c0) < Math.abs(r1 - r0)) {
      if (r1 < r0)
        [r0, r1, c0, c1] = [r1, r0, c1, c0];
      for (let r = r0; r <= r1; r += 2) {
        let c = (r - r0) * (c1 - c0) / (r1 - r0) + c0 | 0;
        let osc = this.mode == 1 /* Osc */ ? new Oscillator(r, c, ps.amp / 2, ps.q, ps.lambda, ps.vx, this.space) : new Mono(r, c, ps.amp / 2, ps.q, ps.lambda, this.space);
        this.space.addOscillator(osc);
      }
    } else {
      if (c1 < c0)
        [r0, r1, c0, c1] = [r1, r0, c1, c0];
      for (let c = c0; c <= c1; c += 2) {
        let r = (c - c0) * (r1 - r0) / (c1 - c0) + r0 | 0;
        let osc = this.mode == 1 /* Osc */ ? new Oscillator(r, c, ps.amp / 2, ps.q, ps.lambda, ps.vx, this.space) : new Mono(r, c, ps.amp / 2, ps.q, ps.lambda, this.space);
        this.space.addOscillator(osc);
      }
    }
  }
  addReceivers(r0, c0, r1, c1, loss) {
    if (c0 == c1 && r0 == r1) {
      this.space.addReceiver(new Receiver(r0, c0, loss, this.space));
      return;
    }
    if (Math.abs(c1 - c0) < Math.abs(r1 - r0)) {
      if (r1 < r0)
        [r0, r1, c0, c1] = [r1, r0, c1, c0];
      for (let r = r0; r <= r1; r += 2) {
        let c = (r - r0) * (c1 - c0) / (r1 - r0) + c0 | 0;
        this.space.addReceiver(new Receiver(r, c, loss, this.space));
      }
    } else {
      if (c1 < c0)
        [r0, r1, c0, c1] = [r1, r0, c1, c0];
      for (let c = c0; c <= c1; c += 2) {
        let r = (c - c0) * (r1 - r0) / (c1 - c0) + r0 | 0;
        this.space.addReceiver(new Receiver(r, c, loss, this.space));
      }
    }
  }
  addBars(r0, c0, r1, c1) {
    this.space.addBar(new Bar(r0, c0, r1, c1));
  }
  //#endregion mouse listeners
};

// src/main.ts
new Controller();

