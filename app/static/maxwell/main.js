var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/gl-matrix/esm/common.js
var EPSILON = 1e-6;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = Math.random;
function round(a) {
  if (a >= 0) return Math.round(a);
  return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
}
var degree = Math.PI / 180;
var radian = 180 / Math.PI;

// node_modules/gl-matrix/esm/vec2.js
var vec2_exports = {};
__export(vec2_exports, {
  add: () => add,
  angle: () => angle,
  ceil: () => ceil,
  clone: () => clone,
  copy: () => copy,
  create: () => create,
  cross: () => cross,
  dist: () => dist,
  distance: () => distance,
  div: () => div,
  divide: () => divide,
  dot: () => dot,
  equals: () => equals,
  exactEquals: () => exactEquals,
  floor: () => floor,
  forEach: () => forEach,
  fromValues: () => fromValues,
  inverse: () => inverse,
  len: () => len,
  length: () => length,
  lerp: () => lerp,
  max: () => max,
  min: () => min,
  mul: () => mul,
  multiply: () => multiply,
  negate: () => negate,
  normalize: () => normalize,
  random: () => random,
  rotate: () => rotate,
  round: () => round2,
  scale: () => scale,
  scaleAndAdd: () => scaleAndAdd,
  set: () => set,
  signedAngle: () => signedAngle,
  sqrDist: () => sqrDist,
  sqrLen: () => sqrLen,
  squaredDistance: () => squaredDistance,
  squaredLength: () => squaredLength,
  str: () => str,
  sub: () => sub,
  subtract: () => subtract,
  transformMat2: () => transformMat2,
  transformMat2d: () => transformMat2d,
  transformMat3: () => transformMat3,
  transformMat4: () => transformMat4,
  zero: () => zero
});
function create() {
  var out = new ARRAY_TYPE(2);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}
function clone(a) {
  var out = new ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}
function round2(out, a) {
  out[0] = round(a[0]);
  out[1] = round(a[1]);
  return out;
}
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}
function scaleAndAdd(out, a, b, scale2) {
  out[0] = a[0] + b[0] * scale2;
  out[1] = a[1] + b[1] * scale2;
  return out;
}
function distance(a, b) {
  var x = b[0] - a[0], y = b[1] - a[1];
  return Math.sqrt(x * x + y * y);
}
function squaredDistance(a, b) {
  var x = b[0] - a[0], y = b[1] - a[1];
  return x * x + y * y;
}
function length(a) {
  var x = a[0], y = a[1];
  return Math.sqrt(x * x + y * y);
}
function squaredLength(a) {
  var x = a[0], y = a[1];
  return x * x + y * y;
}
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}
function inverse(out, a) {
  out[0] = 1 / a[0];
  out[1] = 1 / a[1];
  return out;
}
function normalize(out, a) {
  var x = a[0], y = a[1];
  var len2 = x * x + y * y;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
  }
  out[0] = a[0] * len2;
  out[1] = a[1] * len2;
  return out;
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}
function lerp(out, a, b, t) {
  var ax = a[0], ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}
function random(out, scale2) {
  scale2 = scale2 === void 0 ? 1 : scale2;
  var r = RANDOM() * 2 * Math.PI;
  out[0] = Math.cos(r) * scale2;
  out[1] = Math.sin(r) * scale2;
  return out;
}
function transformMat2(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}
function transformMat2d(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}
function transformMat3(out, a, m) {
  var x = a[0], y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}
function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}
function rotate(out, a, b, rad) {
  var p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}
function angle(a, b) {
  var ax = a[0], ay = a[1], bx = b[0], by = b[1];
  return Math.abs(Math.atan2(ay * bx - ax * by, ax * bx + ay * by));
}
function signedAngle(a, b) {
  var ax = a[0], ay = a[1], bx = b[0], by = b[1];
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}
function zero(out) {
  out[0] = 0;
  out[1] = 0;
  return out;
}
function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
function equals(a, b) {
  var a0 = a[0], a1 = a[1];
  var b0 = b[0], b1 = b[1];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1));
}
var len = length;
var sub = subtract;
var mul = multiply;
var div = divide;
var dist = distance;
var sqrDist = squaredDistance;
var sqrLen = squaredLength;
var forEach = (function() {
  var vec = create();
  return function(a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 2;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }
    return a;
  };
})();

// src/globals.ts
var glo = {
  Ke: 1e3,
  // стала в законі Кулона 
  Kb: 2e-3,
  // стала в законі Ампера      
  SCALE: 1,
  TIME_INTERVAL: 5,
  time: 0,
  // time in ticks (1 sec = 1000/INTERVAL ticks)
  isB: true,
  isE: true,
  isTracing: true
};
var doc = {
  canvas: document.getElementById("canvas"),
  canvas2: document.getElementById("canvas2"),
  info: document.getElementById("info")
};

// src/controller/Handler.ts
var select = document.getElementById("createMode");
var Handler = class {
  currentX = 0;
  currentY = 0;
  isDrawing = false;
  draggingObject = null;
  view;
  space;
  controller;
  constructor(controller) {
    this.controller = controller;
    this.space = controller.space;
    this.view = controller.view;
  }
  mousedown(e) {
    this.currentX = e.offsetX;
    this.currentY = e.offsetY;
    this.isDrawing = true;
    doc.canvas.focus({ focusVisible: true });
  }
  mousemove(e) {
    if (!this.isDrawing) {
      return;
    }
    if (this.draggingObject) {
      let dx = e.offsetX - this.currentX;
      let dy = e.offsetY - this.currentY;
      this.currentX = e.offsetX;
      this.currentY = e.offsetY;
      this.draggingObject.move(dx, dy);
      this.view.draw();
    }
  }
  mouseup(e) {
    let offsetX = e.offsetX - this.view.translateX, offsetY = e.offsetY - this.view.translateY;
    if (this.space.trySelectCharge(offsetX, offsetY)) {
      select.value = "Charge";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (this.space.trySelectWire(offsetX)) {
      select.value = "Wire";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  keydown(e) {
    switch (e.key) {
      // do one step
      case "1":
        this.controller.stop();
        this.controller.step();
        break;
      case "i":
      case "I":
        select.value = "Info";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      case "c":
      case "C":
        select.value = "Charge";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      case "w":
      case "W":
        select.value = "Wire";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        break;
    }
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
var chargeParams = document.getElementById("chargeParams");
var wireParams = document.getElementById("wireParams");
function setChargeParams(ch) {
  chargeParams.value = `q: ${ch.q}, vx: ${ch.v[0].toFixed(1)}, vy: ${ch.v[1].toFixed(1)}, m: ${ch.m}, fixed: ${ch.fixed ? 1 : 0}`;
}
function setWireParams(wire) {
  wireParams.value = `x: ${wire.x}, j: ${wire.j}`;
}

// src/models/Charge.ts
var Charge = class {
  r;
  v;
  q;
  m;
  fixed;
  track;
  constructor(q, x, y, vx, vy, m = 1, fixed = false) {
    this.r = vec2_exports.fromValues(x, y);
    this.v = vec2_exports.fromValues(vx, vy);
    this.q = q;
    this.m = m;
    this.fixed = fixed;
    this.track = [[x, y]];
  }
  // Напруженість електричного поля, яку створює цей заряд в точці r
  EatR(r, out = vec2_exports.create()) {
    const dx = r[0] - this.r[0];
    const dy = r[1] - this.r[1];
    const diffSquared = dx * dx + dy * dy;
    if (diffSquared < 5) {
      return vec2_exports.set(out, 0, 0);
    }
    const scale2 = glo.Ke * this.q / (diffSquared * Math.sqrt(diffSquared));
    out[0] = dx * scale2;
    out[1] = dy * scale2;
    return out;
  }
  // Напруженість магнітного поля, яку створює рухомий заряд в точці r
  BatR(r) {
    if (this.fixed) {
      return 0;
    }
    const dx = r[0] - this.r[0];
    const dy = r[1] - this.r[1];
    const dist_square = dx * dx + dy * dy;
    if (dist_square < 4) {
      return 0;
    }
    const VxD = this.v[0] * dy - this.v[1] * dx;
    const Bz = VxD * glo.Kb * this.q / (dist_square * Math.sqrt(dist_square));
    return Bz;
  }
  get blindRadius() {
    const K = 4;
    return Math.abs(this.q) ** 0.25 * K;
  }
  isInside(r) {
    return vec2_exports.distance(r, this.r) < this.blindRadius;
  }
  move(dx, dy) {
    const N_TRACK = 300;
    if (this.track.length > N_TRACK) {
      this.track.splice(0, N_TRACK / 10);
    }
    let last = this.track[this.track.length - 1];
    if (Math.hypot(this.r[0] + dx - last[0], this.r[1] + dx - last[1]) > 5) {
      this.track.push([this.r[0], this.r[1]]);
    }
    this.r[0] += dx;
    this.r[1] += dy;
  }
};

// src/controller/ChargeHandler.ts
var CLICK_DIST = 3;
var ChargeHandler = class extends Handler {
  mousedown(e) {
    super.mousedown(e);
    let sel = this.space.selectedCharge;
    let offsetX = e.offsetX - this.view.translateX, offsetY = e.offsetY - this.view.translateY;
    if (sel && sel.isInside(vec2_exports.fromValues(offsetX, offsetY))) {
      this.draggingObject = sel;
    }
  }
  mousemove(e) {
    super.mousemove(e);
    if (!this.isDrawing)
      return;
    let currentX = this.currentX - this.view.translateX, currentY = this.currentY - this.view.translateY, offsetX = e.offsetX - this.view.translateX, offsetY = e.offsetY - this.view.translateY;
    this.view.draw();
    this.view.drawGrayArc(currentX, currentY, offsetX, offsetY);
  }
  mouseup(e) {
    super.mouseup(e);
    if (!this.isDrawing)
      return;
    this.isDrawing = false;
    if (this.draggingObject) {
      this.draggingObject = null;
      return;
    }
    let x1 = this.currentX - this.view.translateX, y1 = this.currentY - this.view.translateY, x2 = e.offsetX - this.view.translateX, y2 = e.offsetY - this.view.translateY;
    let drawDist = Math.hypot(x2 - x1, y2 - y1);
    if (drawDist <= CLICK_DIST) {
      this.space.trySelectCharge(x1, y1);
      if (this.space.selectedCharge) {
        setChargeParams(this.space.selectedCharge);
      }
    } else {
      let params = getParams("chargeParams");
      if (params) {
        let vx = (x2 - x1) / 10;
        let vy = (y2 - y1) / 10;
        const newCharge = new Charge(params.q, x1, y1, vx, vy, params.m, params.fixed == 1);
        this.space.charges.push(newCharge);
        this.space.selectedCharge = newCharge;
        setChargeParams(newCharge);
      }
    }
    this.view.draw();
  }
  keydown(e) {
    super.keydown(e);
    switch (e.key) {
      case "Delete":
        if (this.space.selectedCharge) {
          this.space.removeSelectedCharge();
        }
        this.view.draw();
        break;
    }
  }
};

// src/models/Space.ts
var Space = class {
  charges = [];
  wires = [];
  steadyMagnetic = 0;
  // 0.01
  electricFieldScratch = vec2_exports.create();
  chargeFieldScratch = vec2_exports.create();
  selectedCharge = null;
  selectedWire = null;
  constructor() {
  }
  step() {
    for (let ch of this.charges) {
      if (ch.fixed)
        continue;
      const q$m = ch.q / ch.m;
      const eps0$q$m = q$m / (glo.Ke * 4 * Math.PI);
      if (glo.isE) {
        const E = this.EatR(ch.r, this.electricFieldScratch);
        ch.v[0] += E[0] * eps0$q$m;
        ch.v[1] += E[1] * eps0$q$m;
      }
      if (glo.isB) {
        const Bz = this.BatR(ch.r);
        const bqm = Bz * q$m;
        const vx = ch.v[0];
        const vy = ch.v[1];
        const k = Math.sqrt(1 + bqm * bqm);
        ch.v[0] = (vx + vy * bqm) / k;
        ch.v[1] = (vy - vx * bqm) / k;
      }
      ch.move(ch.v[0], ch.v[1]);
    }
  }
  // Підраховує сумарну напруженість електричного поля в точці r
  EatR(r, out = vec2_exports.create()) {
    out[0] = 0;
    out[1] = 0;
    for (let c of this.charges) {
      const field = c.EatR(r, this.chargeFieldScratch);
      out[0] += field[0];
      out[1] += field[1];
    }
    return out;
  }
  // Підраховує сумарну напруженість магнітного поля Bz в точці r
  BatR(r) {
    let sum = this.steadyMagnetic;
    for (let ch of this.charges) {
      sum += ch.BatR(r);
    }
    for (let wi of this.wires) {
      sum += wi.BatR(r);
    }
    return sum;
  }
  // ---------------------- SEL Charge
  trySelectCharge(x, y) {
    this.selectedCharge = null;
    for (let ch of this.charges) {
      if (ch.isInside(vec2_exports.fromValues(x, y))) {
        this.selectedCharge = ch;
        return true;
      }
    }
    return false;
  }
  removeSelectedCharge() {
    if (!this.selectedCharge)
      return;
    let idx = this.charges.indexOf(this.selectedCharge);
    this.charges.splice(idx, 1);
    this.selectedCharge = null;
  }
  // ---------------------- SEL Wire
  trySelectWire(x) {
    this.selectedWire = null;
    for (let wi of this.wires) {
      if (Math.abs(wi.x - x) < 3) {
        this.selectedWire = wi;
        return true;
      }
    }
    return false;
  }
  removeSelectedWire() {
    if (!this.selectedWire)
      return;
    let idx = this.wires.indexOf(this.selectedWire);
    this.wires.splice(idx, 1);
    this.selectedWire = null;
  }
};

// src/models/Wire.ts
var Wire = class {
  x = 0;
  j = 0;
  constructor(x, j) {
    this.x = x;
    this.j = j;
  }
  // Напруженість магнітного поля, яку створює провідник в точці r
  BatR(r) {
    const radius = r[0] - this.x;
    if (Math.abs(radius) < 5) {
      return 0;
    }
    const Bz = 2 * this.j / (glo.Ke * glo.Kb * glo.Kb * radius);
    return Bz;
  }
  move(dx, dy) {
    this.x += dx;
  }
};

// src/data/Store.ts
var Store = class {
  // Перетворює аргумент в json-рядок
  static serialize(space2) {
    return JSON.stringify(space2);
  }
  static deserialize(json) {
    try {
      const spc = JSON.parse(json);
      const space2 = new Space();
      Object.assign(space2, spc);
      space2.charges = [];
      for (let ch of spc.charges) {
        let charge = new Charge(ch.q, ch.r[0], ch.r[1], ch.v[0], ch.v[1], ch.m, ch.fixed);
        space2.charges.push(charge);
      }
      space2.wires = [];
      for (let wi of spc.wires) {
        let wire = new Wire(wi.x, wi.j);
        space2.wires.push(wire);
      }
      return space2;
    } catch {
      return null;
    }
  }
};

// src/controller/WireHandler.ts
var CLICK_DIST2 = 3;
var WireHandler = class extends Handler {
  mousedown(e) {
    super.mousedown(e);
    let sel = this.space.selectedWire;
    let offsetX = e.offsetX - this.view.translateX;
    if (sel && Math.abs(sel.x - offsetX) < 3) {
      this.draggingObject = sel;
    }
  }
  mousemove(e) {
    super.mousemove(e);
    if (!this.isDrawing)
      return;
    this.view.draw();
    let offsetX = e.offsetX - this.view.translateX;
    this.view.drawGrayVerLine(offsetX);
  }
  mouseup(e) {
    super.mouseup(e);
    if (!this.isDrawing)
      return;
    this.isDrawing = false;
    if (this.draggingObject) {
      this.draggingObject = null;
      return;
    }
    let x1 = this.currentX - this.view.translateX, y1 = this.currentY - this.view.translateY, x2 = e.offsetX - this.view.translateX, y2 = e.offsetY - this.view.translateY;
    let drawDist = Math.hypot(x2 - x1, y2 - y1);
    if (drawDist <= CLICK_DIST2) {
      if (this.space.trySelectWire(x1)) {
        setWireParams(this.space.selectedWire);
      }
    } else {
      let params = getParams("wireParams");
      const newWire = new Wire(x2, params.j);
      this.space.wires.push(newWire);
      this.space.selectedWire = newWire;
      setWireParams(this.space.selectedWire);
    }
    this.view.draw();
  }
  keydown(e) {
    super.keydown(e);
    switch (e.key) {
      case "Delete":
        if (this.space.selectedWire) {
          this.space.removeSelectedWire();
        }
        this.view.draw();
        break;
    }
  }
};

// src/controller/InfoHandler.ts
var InfoHandler = class extends Handler {
  mousedown(e) {
    super.mousedown(e);
  }
  mousemove(e) {
    super.mousemove(e);
    if (this.isDrawing) {
      let dx = e.offsetX - this.currentX;
      let dy = e.offsetY - this.currentY;
      this.currentX = e.offsetX;
      this.currentY = e.offsetY;
      this.view.translateX += dx;
      this.view.translateY += dy;
      this.view.draw();
      this.view.clearCanvas2();
    }
    let r = vec2_exports.fromValues(e.offsetX, e.offsetY);
    let E = this.space.EatR(r);
    let b = this.space.BatR(r);
    let x = e.offsetX - this.view.translateX;
    let y = e.offsetY - this.view.translateY;
    doc.info.innerHTML = `Ex = ${E[0].toFixed(2)}, Ey = ${E[1].toFixed(2)}, Bz = ${b.toFixed(4)} (${Math.round(x)}, ${Math.round(y)})`;
  }
  mouseup(e) {
    super.mouseup(e);
    this.isDrawing = false;
  }
  keydown(e) {
    super.keydown(e);
  }
};

// src/controller/Controller.ts
var CreateMode = /* @__PURE__ */ ((CreateMode2) => {
  CreateMode2[CreateMode2["Info"] = 0] = "Info";
  CreateMode2[CreateMode2["Charge"] = 1] = "Charge";
  CreateMode2[CreateMode2["Wire"] = 2] = "Wire";
  return CreateMode2;
})(CreateMode || {});
var Controller = class {
  space;
  view;
  chargeHandler;
  wireHandler;
  infoHandler;
  timer = 0;
  constructor(space2, view2) {
    this.space = space2;
    this.view = view2;
    this.chargeHandler = new ChargeHandler(this);
    this.wireHandler = new WireHandler(this);
    this.infoHandler = new InfoHandler(this);
    this.addEventHandlers();
    this.addDataHandlers();
    document.getElementById("infoParams").dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true
    }));
    document.getElementById("bRange").dispatchEvent(new Event("change"));
    document.getElementById("eRange").dispatchEvent(new Event("change"));
    document.getElementById("createMode").dispatchEvent(new Event("change"));
    document.getElementById("saveSceneButton").dispatchEvent(new Event("click"));
  }
  changeSpaceSize() {
    let [w, h] = [doc.canvas.width, doc.canvas.height];
    document.documentElement.style.setProperty("--canvas-width", w + "px");
    document.documentElement.style.setProperty("--canvas-height", h + "px");
    doc.canvas.height = h;
    doc.canvas.width = w;
    doc.canvas2.height = h;
    doc.canvas2.width = w;
  }
  // Restore the space from a storage by a key.
  // 
  restoreSpace(key, storage) {
    const jsonStr = storage.getItem(key);
    if (jsonStr) {
      this.setCurrentModelWithJson(jsonStr);
    }
  }
  //#region CreateMode property
  _creationMode = 0 /* Info */;
  set creationMode(mode) {
    let infoParams = document.getElementById("infoParams").style;
    let chargeParams2 = document.getElementById("chargeParams").style;
    let wireParams2 = document.getElementById("wireParams").style;
    let magnetParams = document.getElementById("magnetParams").style;
    infoParams.display = chargeParams2.display = wireParams2.display = magnetParams.display = "none";
    this._creationMode = mode;
    switch (mode) {
      case 0 /* Info */:
        this.switchHandlers(this.infoHandler);
        infoParams.display = "inline";
        break;
      case 1 /* Charge */:
        this.switchHandlers(this.chargeHandler);
        chargeParams2.display = "inline";
        break;
      case 2 /* Wire */:
        this.switchHandlers(this.wireHandler);
        wireParams2.display = "inline";
        break;
    }
  }
  get creationMode() {
    return this._creationMode;
  }
  switchHandlers(handler) {
    doc.canvas.onmousedown = (e) => handler.mousedown(e);
    doc.canvas.onmousemove = (e) => handler.mousemove(e);
    doc.canvas.onmouseup = (e) => handler.mouseup(e);
    doc.canvas.onkeydown = (e) => handler.keydown(e);
  }
  //#endregion CreateMode
  addEventHandlers() {
    document.getElementById("infoParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const params = getParams("infoParams");
        doc.canvas.width = params.w;
        doc.canvas.height = params.h;
        this.space.steadyMagnetic = params.sm;
        glo.isE = params.Ke > 0;
        glo.isB = params.Kb > 0;
        glo.Ke = params.Ke;
        glo.Kb = params.Kb;
        this.changeSpaceSize();
        this.view.draw();
      }
    });
    document.getElementById("chargeParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const params = getParams("chargeParams");
        const selCharge = this.space.selectedCharge;
        if (params && selCharge) {
          selCharge.v = vec2_exports.fromValues(params.vx, params.vy);
          selCharge.q = params.q;
          selCharge.m = params.m;
          selCharge.fixed = params.fixed == 1;
          this.view.draw();
        }
      }
    });
    document.getElementById("wireParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const params = getParams("wireParams");
        const selWire = this.space.selectedWire;
        if (params && selWire) {
          selWire.x = params.x;
          selWire.j = params.j;
        }
        this.view.draw();
      }
    });
    document.getElementById("createMode").addEventListener("change", (e) => {
      let str2 = e.target.value;
      const key = str2;
      this.creationMode = CreateMode[key];
    });
    document.getElementById("eRange")?.addEventListener("change", (e) => {
      let value = e.target.value;
      this.view.Emin = 1.1 ** Number(value);
      this.view.draw();
    });
    document.getElementById("bRange")?.addEventListener("change", (e) => {
      let value = e.target.value;
      this.view.Bmax = 2 ** -value;
      this.view.draw();
    });
    document.getElementById("tracingCheckbox")?.addEventListener("change", (e) => {
      glo.isTracing = e.target.checked;
      if (!glo.isTracing) {
        this.view.clearCanvas2();
      }
      this.view.draw();
    });
    document.getElementById("runButton")?.addEventListener("click", (e) => {
      const KEY = "run";
      if (this.timer) {
        this.stop();
      } else {
        this.run();
        if (e.ctrlKey) {
          this.restoreSpace(KEY, sessionStorage);
        } else {
          const val = Store.serialize(this.space);
          sessionStorage.setItem(KEY, val);
        }
      }
    });
    document.getElementById("helpButton").addEventListener("click", () => {
      window.open("help.html", "_blank")?.focus();
    });
  }
  getCurrentModelAsJson() {
    return Store.serialize(this.space);
  }
  setCurrentModelWithJson(jsonStr) {
    let space2 = Store.deserialize(jsonStr);
    if (space2) {
      Object.assign(this.space, space2);
      this.view.draw();
      this.view.clearCanvas2();
      this.stop();
    }
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

  //#region step-stop-run
  timestamp = Date.now();
  step() {
    this.space.step();
    this.view.draw();
    glo.time++;
    const DELTA_T = 10;
    if (glo.time % DELTA_T == 0) {
      let t = DELTA_T / (Date.now() - this.timestamp);
      this.timestamp = Date.now();
      doc.info.innerHTML = `${glo.time} --${t.toFixed(2)}--`;
    }
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = 0;
    }
  }
  run() {
    if (this.timer)
      return;
    this.timer = setInterval(() => {
      this.timestamp = Date.now();
      this.step();
    }, glo.TIME_INTERVAL);
  }
  //#endregion
};

// src/view/View.ts
var RAYS = 6;
var View = class {
  space;
  ctx;
  ctx2;
  // лише траси
  Bmax = 0;
  // макс напруж магнітного поля (встановлюється слайдером)
  Emin = 1;
  // мін напруж електричного поля (встановлюється слайдером)
  translateX = 0;
  translateY = 0;
  constructor(space2) {
    this.space = space2;
    this.ctx = doc.canvas.getContext("2d");
    this.ctx2 = doc.canvas2.getContext("2d");
  }
  clearCanvas2() {
    this.ctx2.clearRect(0, 0, doc.canvas2.width, doc.canvas2.height);
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, doc.canvas.width, doc.canvas.height);
    ctx.save();
    ctx.translate(this.translateX, this.translateY);
    if (glo.isB) {
      this.drawB();
    }
    if (glo.isE) {
      this.drawE();
    }
    for (let ch of this.space.charges) {
      this.drawCharge(ch);
      if (glo.isTracing) {
        ctx.beginPath();
        let last = ch.track[ch.track.length - 1];
        ctx.moveTo(last[0], last[1]);
        for (let i = ch.track.length - 1; i > 0; i--) {
          ctx.lineTo(ch.track[i][0], ch.track[i][1]);
        }
        ctx.stroke();
      }
    }
    for (let wi of this.space.wires) {
      this.drawWire(wi);
    }
    ctx.restore();
  }
  drawWire(wire) {
    const ctx = this.ctx;
    ctx.lineWidth = this.space.selectedWire == wire ? 6 : 4;
    let x = wire.x;
    let y = -this.translateY, y1 = doc.canvas.height - this.translateY;
    ctx.strokeStyle = "pink";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + doc.canvas.height);
    ctx.stroke();
    const T = 20;
    let J = 10;
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    y -= Math.sign(wire.j) * glo.time % T;
    while (y < y1) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + J);
      y += T;
    }
    ctx.stroke();
  }
  // Draws magnetic field in the whole space.
  //
  drawB() {
    const d = 8, d2 = d / 2;
    const ctx = this.ctx;
    for (let x_ = 0; x_ < doc.canvas.width; x_ += d) {
      for (let y_ = 0; y_ < doc.canvas.height; y_ += d) {
        let x = x_ - this.translateX, y = y_ - this.translateY;
        let r = vec2_exports.fromValues(x - d2, y - d2);
        let B = this.space.BatR(r);
        let deep = 255 * (1 - Math.abs(B) / this.Bmax);
        if (deep > 255) deep = 255;
        if (B < 0) {
          ctx.fillStyle = `rgb(${deep} 255 255 / 50%)`;
        } else {
          ctx.fillStyle = `rgb(255 255 ${deep} / 50%)`;
        }
        ctx.fillRect(x - d2, y - d2, d, d);
      }
    }
  }
  // Draws electric field in the whole space.
  drawE() {
    this.ctx.strokeStyle = "rgb(0 0 255 / 50%)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let ch of this.space.charges) {
      let radius = ch.blindRadius;
      let n = rayCount(ch);
      for (let i = 0; i < n; i++) {
        let angle2 = 2 * Math.PI * i / n;
        let r = vec2_exports.fromValues(radius * Math.cos(angle2), radius * Math.sin(angle2));
        let start = vec2_exports.add(vec2_exports.create(), r, ch.r);
        this.drawRay(start, ch);
      }
    }
    this.ctx.stroke();
  }
  // Draw one charge as a white circle with a sign inside.
  //
  drawCharge(ch) {
    let d = 1;
    if (ch === this.space.selectedCharge) {
      d = 2;
    }
    const ctx = this.ctx;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ch.r[0], ch.r[1], ch.blindRadius, 0, 2 * Math.PI);
    ctx.fill();
    if (ch.q < 0) {
      ctx.fillStyle = "blue";
      ctx.fillRect(ch.r[0] - 4 * d, ch.r[1] - d, 8 * d, 2 * d);
    } else {
      ctx.fillStyle = "red";
      ctx.fillRect(ch.r[0] - 4 * d, ch.r[1] - d, 8 * d, 2 * d);
      ctx.fillRect(ch.r[0] - d, ch.r[1] - 4 * d, 2 * d, 8 * d);
    }
  }
  drawRay(start, charge) {
    const K = 0.5;
    const N_SEG = 1e3;
    const sign = Math.sign(charge.q);
    const position = vec2_exports.clone(start);
    let seg_count = 0;
    while (seg_count < N_SEG) {
      const E = this.space.EatR(position);
      const magnitude = vec2_exports.length(E);
      if (magnitude < this.Emin)
        break;
      seg_count++;
      const dx = sign * E[0] * K / magnitude;
      const dy = sign * E[1] * K / magnitude;
      this.ctx.moveTo(position[0], position[1]);
      this.ctx.lineTo(position[0] + dx, position[1] + dy);
      position[0] += dx;
      position[1] += dy;
      const magnitude1 = vec2_exports.length(this.space.EatR(position));
      if (magnitude1 > magnitude)
        break;
    }
  }
  //#region Gray Zone
  drawGrayArc(x0, y0, x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.translateX, this.translateY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = ctx.fillStyle = "gray";
    let radius = Math.hypot(x0 - x, y0 - y) / 2;
    ctx.beginPath();
    ctx.arc(x0, y0, radius, 0, Math.PI * 2);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
  }
  drawGrayVerLine(x) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.translateX, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, doc.canvas.height);
    ctx.stroke();
    ctx.restore();
  }
  //#endregion Gray Zone    
};
function rayCount(ch) {
  return RAYS * Math.abs(ch.q) ** 0.5 | 0;
}

// src/main.ts
var space = new Space();
var view = new View(space);
new Controller(space, view);
view.draw();
