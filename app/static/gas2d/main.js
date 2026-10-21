// src/globals/globals.ts
var glo = {
  BOLTZ: 1 / 30,
  // 0.005,       // стала Больцмана (в житті = 1.380649e−23) // was 1/30
  g: 0.1,
  // сила тяжіння
  gBall: 0,
  // чи впливає тяжіння на кулі (0-ні, 1-впливає) 
  metr: 10,
  // інтервал між вимірюваннями (у кроках)
  quant: 5,
  // квант простору             
  strikes: 0
  // заг. кількість зіткнень    
};
var doc = {
  canvas: document.getElementById("canvas"),
  canvas2: document.getElementById("canvas2")
};

// src/model/Geometry.ts
function dist(a, b) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function angle(a, b) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  return Math.atan2(dy, dx);
}
function turn(x, y, alpha) {
  let x1 = x * Math.cos(alpha) + y * Math.sin(alpha);
  let y1 = -x * Math.sin(alpha) + y * Math.cos(alpha);
  return { x: x1, y: y1 };
}
function turnV(a, alpha) {
  let va = turn(a.vx, a.vy, alpha);
  a.vx = va.x;
  a.vy = va.y;
}
function distToInfiniteLine(p, line) {
  let a = line.A, b = line.B, c = line.C;
  return Math.abs(a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
}
function cross(x1, y1, x2, y2, x3, y3, x4, y4) {
  let zn = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (zn == 0)
    return null;
  let t12 = x1 * y2 - y1 * x2, t34 = x3 * y4 - y3 * x4;
  let x = (t12 * (x3 - x4) - (x1 - x2) * t34) / zn;
  let y = (t12 * (y3 - y4) - (y1 - y2) * t34) / zn;
  return { x, y };
}
function inside(x1, y1, x2, y2, x, y) {
  return (x1 == x2 || x1 <= x && x <= x2 || x2 <= x && x <= x1) && (y1 == y2 || y1 <= y && y <= y2 || y2 <= y && y <= y1);
}
function crossSegSeg(a, b) {
  const c = cross(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2);
  if (c == null) return null;
  const isInside = inside(a.x1, a.y1, a.x2, a.y2, c.x, c.y) && inside(b.x1, b.y1, b.x2, b.y2, c.x, c.y);
  return isInside ? c : null;
}

// src/globals/utils.ts
function quanty(x) {
  return Math.round(x / glo.quant) * glo.quant;
}
function confirmAction(message) {
  let confirm = document.getElementById("info2");
  confirm.innerHTML = message;
  confirm.style.display = "inline";
  setTimeout(function() {
    confirm.innerHTML = "";
    confirm.style.display = "none";
  }, 500);
}

// src/model/Line.ts
var Line = class {
  x1;
  y1;
  x2;
  y2;
  c;
  constructor(x1, y1, x2, y2, c) {
    if (x1 > x2) [x1, x2] = [x2, x1];
    if (y1 > y2) [y1, y2] = [y2, y1];
    [x1, x2, y1, y2] = [x1, x2, y1, y2].map((x) => quanty(x));
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.c = c;
  }
  // вспомогательные параметры линии для разных формул
  get A() {
    return this.y2 - this.y1;
  }
  get B() {
    return this.x1 - this.x2;
  }
  get C() {
    return this.x2 * this.y1 - this.x1 * this.y2;
  }
  get k() {
    return (this.y1 - this.y2) / (this.x1 - this.x2);
  }
  get b() {
    return this.y1 + this.x1 * (this.y2 - this.y1) / (this.x1 - this.x2);
  }
  get p1() {
    return { x: this.x1, y: this.y1 };
  }
  get p2() {
    return { x: this.x2, y: this.y2 };
  }
  isInside(x, y) {
    let d = distToInfiniteLine({ x, y }, this);
    return d < 5 && inside(this.x1, this.y1, this.x2, this.y2, x, y);
  }
  get isHor() {
    return Math.abs(this.y1 - this.y2) < glo.quant;
  }
  move(dx, dy) {
    this.x1 += dx;
    this.x2 += dx;
    this.y1 += dy;
    this.y2 += dy;
  }
  justify() {
    this.x1 = quanty(this.x1);
    this.x2 = quanty(this.x2);
    this.y1 = quanty(this.y1);
    this.y2 = quanty(this.y2);
  }
  // virtuals for Plunger
  clearMeterings() {
  }
  measure() {
  }
};

// src/model/Plunger.ts
var Plunger = class _Plunger extends Line {
  static GAP = 40;
  top;
  bottom;
  realTop;
  realBottom;
  m = 100;
  // payload
  u = 0;
  // outer work
  loss = 0;
  // plunger loss
  t = 0;
  // temperature
  velo = 0;
  // velocity
  impulse = 0;
  withFriction = false;
  fixed = false;
  space = null;
  lastMetering;
  meterings;
  scales = { V: 1, P: 1, T: 1, S: 1, X: 1, w: 1 };
  constructor(x1, y1, x2, y2, y) {
    super(x1, y, x2, y, "green");
    this.top = y1 + _Plunger.GAP / 4;
    this.bottom = y2 - _Plunger.GAP;
    this.realTop = y1;
    this.realBottom = y2;
    this.lastMetering = { n: 0, p: 0, v: this.volume, t: 0, u: 0, q: 0, s: 0 };
    this.meterings = [this.lastMetering];
  }
  get pressure() {
    return this.m * glo.g / (this.x2 - this.x1);
  }
  get volume() {
    return (this.x2 - this.x1) * (this.realBottom - this.y1);
  }
  // get realBottom(): number {
  //    return this.bottom + Plunger.GAP;
  // }
  payloadRect() {
    let w = this.x2 - this.x1;
    w = w > 120 ? 100 : w - 20;
    let h = 5 * this.m / w;
    let x = (this.x1 + this.x2 - w) / 2;
    let y = this.y1 - h;
    return { x, y, w, h };
  }
  // 
  // a = globus.g  + this.impulse / dt / (this.m + Plunger.M0)            WHERE this.impulse / dt = f (сила)
  // dv = a * dt
  //
  moveByForces() {
    let dv = glo.g + this.impulse / this.m;
    this.velo += dv;
    if (this.withFriction) {
      const k = 1.1 ** -((5 * this.velo) ** 2);
      this.velo *= k;
      this.loss += (1 - k ** 2) * this.velo ** 2 * this.m / 2;
    }
    let y = this.y1 + this.velo;
    if (y < this.top && this.velo < 0) {
      this.y1 = this.y2 = this.top;
      this.loss += this.velo ** 2 * this.m / 2;
      this.velo = 0;
    }
    if (y > this.bottom && this.velo > 0) {
      this.y1 = this.y2 = this.bottom;
      this.loss += this.velo ** 2 * this.m / 2;
      this.velo = 0;
    }
    this.move(0, this.velo);
  }
  move(dx, dy) {
    let xLeft = this.x1;
    let xRight = this.x2;
    let yTop = dy > 0 ? this.y1 : this.y1 + dy;
    let yBottom = dy <= 0 ? this.y1 : this.y1 + dy;
    for (let ball of this.space.balls()) {
      if (xLeft <= ball.x && ball.x <= xRight && yTop <= ball.y && ball.y <= yBottom) {
        const delta = dy < 0 ? -1e-3 : 1e-3;
        ball.y = this.y1 + dy + delta;
      }
    }
    this.y2 = this.y1 += dy;
    this.u -= dy * this.m * glo.g;
    this.impulse = 0;
  }
  sumEnergyUnderPlunger() {
    if (!this.space) {
      throw Error("No reference to the space in the heater.");
    }
    let n = 0, doublesumE = 0;
    for (let ball of this.space.balls()) {
      if (this.isUnderPlunger(ball.x, ball.y)) {
        n++;
        let ball_vv = ball.vx ** 2 + ball.vy ** 2;
        doublesumE += ball.m * ball_vv;
      }
    }
    return [doublesumE / 2, n];
  }
  measureTemperature() {
    let [sumE, n] = this.sumEnergyUnderPlunger();
    return sumE / n / glo.BOLTZ;
  }
  // вимір робиться у прямокутнику під поршнем
  //
  measure() {
    let [sumE, n] = this.sumEnergyUnderPlunger();
    let v = (this.x2 - this.x1) * (this.realBottom - this.y1);
    let p = sumE / v;
    this.t = sumE / n / glo.BOLTZ;
    let u = this.u;
    let q = this.space.givenHeat - this.space.takenHeat;
    let de = (q - this.lastMetering.q) / this.t;
    if (!de)
      de = 0;
    let e = this.lastMetering.s + de;
    this.lastMetering = { n, p, v, t: this.t, u, q, s: e };
    this.meterings.push(this.lastMetering);
  }
  isUnderPlunger(x, y) {
    return this.x1 < x && x < this.x2 && this.y1 < y && y < this.realBottom;
  }
  clearMeterings() {
    this.meterings = [this.lastMetering];
    this.u = 0;
    this.loss = 0;
    this.space.givenHeat = this.space.takenHeat = 0;
  }
  scale(x) {
    const coef = 1.1;
    if (x == "P") {
      this.scales.P *= coef;
    } else if (x == "p") {
      this.scales.P /= coef;
    } else if (x == "T") {
      this.scales.T *= coef;
    } else if (x == "t") {
      this.scales.T /= coef;
    } else if (x == "V") {
      this.scales.V *= coef;
    } else if (x == "v") {
      this.scales.V /= coef;
    } else if (x == "S") {
      this.scales.S *= coef;
    } else if (x == "s") {
      this.scales.S /= coef;
    } else if (x == "X") {
      this.scales.X *= coef;
    } else if (x == "x") {
      this.scales.X /= coef;
    }
  }
};

// src/model/Ball.ts
var Ball = class _Ball {
  static id = 0;
  x;
  y;
  vx;
  vy;
  r;
  c;
  m;
  space = null;
  moved = false;
  id = 0;
  // попередні координати (для виміру вільного пробігу)
  prevX;
  prevY;
  constructor(x, y, vx, vy, r = 1, m = 1, c = "lightgray") {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.c = c;
    this.m = m;
    this.id = ++_Ball.id;
  }
  isInside(x, y) {
    return dist(this, { x, y }) <= 3;
  }
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  justify() {
  }
  // virtual
  step() {
    if (this.space == null)
      throw new Error("Ball is out of a box.");
    let neighbours = this.space.population(this);
    let i = neighbours.indexOf(this);
    for (let j = i + 1; j < neighbours.length; j++) {
      this.ballStriking(neighbours[j]);
    }
    if (glo.gBall) {
      this.vy += glo.g;
    }
    let moved = this.wallStriking();
    if (!moved) {
      this.prevX = this.x;
      this.prevY = this.y;
      this.x += this.vx;
      this.y += this.vy;
    }
  }
  ballStriking(b2) {
    let b1 = this;
    let d = dist(b1, b2);
    if (d > b1.r + b2.r)
      return;
    let dx = b2.x - b1.x, dy = b2.y - b1.y;
    let dvx = b2.vx - b1.vx, dvy = b2.vy - b1.vy;
    let scalar = dx * dvx + dy * dvy;
    if (scalar >= 0)
      return;
    let alpha = angle(b1, b2);
    turnV(b1, alpha);
    turnV(b2, alpha);
    let avx = ((b1.m - b2.m) * b1.vx + 2 * b2.m * b2.vx) / (b1.m + b2.m);
    let bvx = ((b2.m - b1.m) * b2.vx + 2 * b1.m * b1.vx) / (b1.m + b2.m);
    b1.vx = avx;
    b2.vx = bvx;
    turnV(b1, -alpha);
    turnV(b2, -alpha);
    glo.strikes++;
  }
  // Вибудовує траекторю декількох зіткнень зі стінками.
  // Повертає true, коли є хоч одне зіткнення.
  //
  wallStriking() {
    const ball = this;
    let sdata0 = {
      p1: { x: ball.x, y: ball.y },
      p2: { x: ball.x + ball.vx, y: ball.y + ball.vy },
      v: { x: ball.vx, y: ball.vy },
      prevLine: null
    };
    const FUSE = 10;
    for (let i = 0; i < FUSE; i++) {
      let sdata = this.strikeOneWall(sdata0);
      if (sdata == null) {
        if (i > 0) {
          ball.prevX = ball.x;
          ball.prevY = ball.y;
          ball.x = sdata0.p2.x;
          ball.y = sdata0.p2.y;
          ball.vx = sdata0.v.x;
          ball.vy = sdata0.v.y;
          return true;
        } else {
          return false;
        }
      }
      sdata0 = sdata;
    }
    return true;
  }
  // Будує траекторю зіткнення з одною стінкою.
  // коли зіткнення немає, повертає в p1 значення null
  strikeOneWall(strikeData) {
    let { p1, p2, v, prevLine } = strikeData;
    let crossPoint = null;
    let nearestLine = null;
    let minDist = Number.MAX_VALUE;
    for (let line of this.space.lines()) {
      if (prevLine == line)
        continue;
      let c = crossSegSeg({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, line);
      if (c) {
        let d = dist(p1, c);
        if (d < minDist) {
          minDist = d;
          crossPoint = c;
          nearestLine = line;
        }
      }
    }
    if (crossPoint == null)
      return null;
    if (nearestLine.isHor) {
      p2 = { x: p2.x, y: 2 * crossPoint.y - p2.y };
      v.y = -v.y;
    } else {
      p2 = { y: p2.y, x: 2 * crossPoint.x - p2.x };
      v.x = -v.x;
    }
    p1 = crossPoint;
    if (nearestLine instanceof Plunger && !nearestLine.fixed) {
      const M = nearestLine.m;
      const m = this.m;
      v.y = -v.y;
      const plung_vy = ((M - m) * nearestLine.velo + 2 * m * v.y) / (M + m);
      const ball_vy = ((m - M) * v.y + 2 * M * nearestLine.velo) / (M + m);
      nearestLine.impulse += M * (plung_vy - nearestLine.velo);
      v.y = ball_vy;
    }
    return { p1, p2, v, prevLine: nearestLine };
  }
};

// src/model/SpaceConts.ts
var BallCont = class {
  arr;
  // [r][c][]
  space;
  constructor(space2) {
    this.space = space2;
    let nrows = space2.height / this.space.cell | 0 || 1;
    let ncols = space2.width / this.space.cell | 0 || 1;
    let arr = new Array(nrows);
    for (let r = 0; r < nrows; r++) {
      arr[r] = new Array(ncols);
      for (let c = 0; c < ncols; c++) {
        arr[r][c] = [];
      }
    }
    this.arr = arr;
  }
  population(point) {
    let row = point.y / this.space.cell | 0;
    if (row < 0) row = 0;
    if (row >= this.arr.length) row = this.arr.length - 1;
    let col = point.x / this.space.cell | 0;
    if (col < 0) col = 0;
    if (col >= this.arr[row].length) col = this.arr[row].length - 1;
    return this.arr[row][col];
  }
  // Проходить по всім елементам, що в контейнері.
  // Напрямок проходження (прямий або зворотний) залежить від мометну часу.
  //
  *values() {
    let arr = this.arr;
    if (this.space.time % 2) {
      for (let r = 0; r < arr.length; r++) {
        for (let c = 0; c < arr[0].length; c++) {
          for (let i = 0; i < arr[r][c].length; i++) {
            yield arr[r][c][i];
          }
        }
      }
    } else {
      for (let r = arr.length - 1; r >= 0; r--) {
        for (let c = arr[0].length - 1; c >= 0; c--) {
          for (let i = 0; i < arr[r][c].length; i++) {
            yield arr[r][c][i];
          }
        }
      }
    }
  }
  add(ball) {
    this.population(ball).push(ball);
  }
  select(x, y) {
    this.space.selectedBall = null;
    let selBolls = [];
    for (let ball of this.values()) {
      if (ball.isInside(x, y)) {
        selBolls.push(ball);
      }
    }
    selBolls.sort((a, b) => a.r - b.r);
    if (selBolls.length > 0) {
      this.space.selectedBall = selBolls[0];
    }
  }
  removeSelected() {
    if (this.space.selectedBall == null) {
      return;
    }
    let arr = this.arr;
    for (let r = 0; r < arr.length; r++) {
      for (let c = 0; c < arr[0].length; c++) {
        let i = arr[r][c].indexOf(this.space.selectedBall);
        if (i > -1) {
          arr[r][c].splice(i, 1);
          this.space.selectedBall = null;
          return;
        }
      }
    }
  }
  clear() {
    for (let r = 0; r < this.arr.length; r++) {
      for (let c = 0; c < this.arr[0].length; c++) {
        this.arr[r][c].length = 0;
      }
    }
  }
};
var WallCont = class {
  arr = [];
  space;
  constructor(box) {
    this.space = box;
  }
  values() {
    return this.arr;
  }
  add(line) {
    if (line.x1 > line.x2) {
      let t = line.x1;
      line.x1 = line.x2;
      line.x2 = t;
      t = line.y1;
      line.y1 = line.y2;
      line.y2 = t;
    }
    this.arr.push(line);
    if (line instanceof Plunger)
      line.space = this.space;
  }
  select(x, y) {
    if (this.arr.length == 0) {
      return;
    }
    for (let l of this.arr) {
      if (l.isInside(x, y)) {
        this.space.selectedLine = l;
        return;
      }
    }
    this.space.selectedLine = null;
  }
  removeSelected() {
    if (this.space.selectedLine == null) {
      return;
    }
    let i = this.arr.indexOf(this.space.selectedLine);
    if (i > -1) {
      this.arr.splice(i, 1);
      this.space.selectedLine = null;
    }
  }
  clear() {
    this.arr = [];
    this.space.selectedLine = null;
  }
};
var DevCont = class {
  devices = [];
  space;
  constructor(space2) {
    this.space = space2;
  }
  add(device) {
    if (device.x1 > device.x2) {
      let t = device.x1;
      device.x1 = device.x2;
      device.x2 = t;
    }
    if (device.y1 > device.y2) {
      let t = device.y1;
      device.y1 = device.y2;
      device.y2 = t;
    }
    device.space = this.space;
    this.devices.push(device);
  }
  select(x, y) {
    if (this.devices.length == 0) {
      return;
    }
    let devices = this.devices.filter((d) => d.isInside(x, y));
    this.space.selectedDevice = devices.length > 0 ? devices[0] : null;
  }
  removeSelected() {
    if (this.space.selectedDevice == null) {
      return;
    }
    let i = this.devices.indexOf(this.space.selectedDevice);
    if (i > -1) {
      this.devices.splice(i, 1);
      this.space.selectedDevice = null;
    }
  }
  clear() {
    this.devices = [];
    this.space.selectedDevice = null;
  }
};

// src/model/Device.ts
var Device = class {
  x1;
  y1;
  x2;
  y2;
  c;
  // колір куль, на які діє пристрій
  // встановлюється при додаванні девайса до простіру
  space = null;
  constructor(x1, y1, x2, y2, c = "") {
    if (x1 > x2) [x1, x2] = [x2, x1];
    if (y1 > y2) [y1, y2] = [y2, y1];
    [x1, x2, y1, y2] = [x1, x2, y1, y2].map((x) => quanty(x));
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.c = c;
  }
  isInside(x, y) {
    return this.x1 < x && x < this.x2 && this.y1 < y && y < this.y2;
  }
  move(dx, dy) {
    this.x1 += dx;
    this.x2 += dx;
    this.y1 += dy;
    this.y2 += dy;
  }
  justify() {
    this.x1 = quanty(this.x1);
    this.x2 = quanty(this.x2);
    this.y1 = quanty(this.y1);
    this.y2 = quanty(this.y2);
  }
  measure() {
    return { n: 0, t: 0, p: 0 };
  }
  get avatar() {
    return "";
  }
  dispose() {
    if (this.space) {
      let oldSelectedDevice = this.space.selectedDevice;
      this.space.selectedDevice = this;
      this.space.removeSelectedDevice();
      this.space.selectedDevice = oldSelectedDevice;
    }
  }
};

// src/model/Heaters.ts
var Heater = class extends Device {
  erg = 0;
  // given amount of heat
  rate;
  // speed of heating 
  constructor(x1, y1, x2, y2, rate, c) {
    super(x1, y1, x2, y2, c);
    this.rate = rate;
  }
  get avatar() {
    return "H";
  }
  warm() {
    const k = this.rate;
    for (let ball of this.space.balls()) {
      if (this.c && ball.c != this.c)
        continue;
      if (this.isInside(ball.x, ball.y)) {
        ball.vx *= k;
        ball.vy *= k;
        let ball_e = (ball.vx ** 2 + ball.vy ** 2) * ball.m / 2;
        let dE = (k ** 2 - 1) * ball_e;
        this.erg += dE;
        this.space.heatAccounting(dE);
      }
    }
  }
};

// src/model/Space.ts
var CreateMode = /* @__PURE__ */ ((CreateMode2) => {
  CreateMode2[CreateMode2["Info"] = 0] = "Info";
  CreateMode2[CreateMode2["Gas"] = 1] = "Gas";
  CreateMode2[CreateMode2["Wall"] = 2] = "Wall";
  CreateMode2[CreateMode2["Devs"] = 3] = "Devs";
  return CreateMode2;
})(CreateMode || {});
var Space = class {
  width;
  height;
  N = 0;
  // поточна кількість куль
  cell = 20;
  // сторона комірки
  givenHeat = 0;
  // тепло, віддане усіма нагрівачами
  takenHeat = 0;
  // тепло, забране усіма охолоджувачами 
  // підраховує тепло при нагріванні 
  heatAccounting(dE) {
    if (dE > 0) this.givenHeat += dE;
    else this.takenHeat -= dE;
  }
  bcont;
  wcont;
  dcont;
  selectedLine = null;
  selectedBall = null;
  selectedDevice = null;
  bombs = [];
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.resetContainers();
  }
  resetContainers() {
    this.bcont = new BallCont(this);
    this.wcont = new WallCont(this);
    this.dcont = new DevCont(this);
  }
  clear() {
    this.clearBalls();
    this.clearLines();
    this.clearDevices();
    this.givenHeat = this.takenHeat = 0;
  }
  //#region Balls
  addBall(ball) {
    ball.space = this;
    this.bcont.add(ball);
  }
  // Якщо в бомбі задано t, швидкості випадкові. В іншому разі мають бути задані vx, vy.
  //
  addBomb(b) {
    let v = (b.t * 2 * glo.BOLTZ / b.m) ** 0.5;
    for (let i = 0; i < b.n; i++) {
      let x = b.x1 + Math.random() * (b.x2 - b.x1);
      let y = b.y1 + Math.random() * (b.y2 - b.y1);
      let ball;
      if (b.t) {
        let alpha = Math.random() * 2 * Math.PI;
        ball = new Ball(x, y, v * Math.cos(alpha), v * Math.sin(alpha), b.r, b.m, b.c);
      } else {
        ball = new Ball(x, y, b.vx, b.vy, b.r, b.m, b.c);
      }
      this.addBall(ball);
    }
    this.bombs.push(b);
  }
  balls() {
    return this.bcont.values();
  }
  population(point) {
    return this.bcont.population(point);
  }
  selectBall(x, y) {
    this.bcont.select(x, y);
  }
  removeSelectedBall() {
    this.bcont.removeSelected();
  }
  clearBalls() {
    this.bcont.clear();
    this.selectedBall = null;
    this.bombs.length = 0;
  }
  //#endregion Balls
  //#region Lines
  addLine(line) {
    this.wcont.add(line);
    this.selectedLine = line;
  }
  removeSelectedLine() {
    this.wcont.removeSelected();
  }
  selectLine(x, y) {
    this.wcont.select(x, y);
  }
  clearLines() {
    this.wcont.clear();
    this.selectedLine = null;
  }
  lines() {
    return this.wcont.values();
  }
  get plungers() {
    return this.wcont.values().filter((l) => l instanceof Plunger);
  }
  get plunger() {
    return this.plungers[0];
  }
  addRect(x1, y1, x2, y2, color) {
    this.addLine(new Line(x1, y2, x2, y2, color));
    this.addLine(new Line(x1, y1, x1, y2, color));
    this.addLine(new Line(x1, y1, x2, y1, color));
    this.addLine(new Line(x2, y1, x2, y2, color));
  }
  addPlunger(x1, y1, x2, y2, color) {
    this.addRect(x1, y1, x2, y2, color);
    let plunger = new Plunger(x1, y1, x2, y2, y2 - Plunger.GAP);
    this.addLine(plunger);
    return plunger;
  }
  //#endregion
  //#region Devices
  addDevice(device) {
    this.dcont.add(device);
    this.selectedDevice = device;
  }
  removeSelectedDevice() {
    this.dcont.removeSelected();
  }
  selectDevice(x, y) {
    this.dcont.select(x, y);
  }
  clearDevices() {
    this.dcont.clear();
    this.selectedDevice = null;
  }
  devices() {
    return this.dcont.devices;
  }
  //#endregion Devices
  // зміна швидкості куль від нагріву або охолодження
  warming() {
    for (let device of this.devices()) {
      if (device instanceof Heater) {
        device.warm();
      }
    }
  }
  step() {
    for (let plunger of this.lines()) {
      if (plunger instanceof Plunger) {
        if (!plunger.fixed)
          plunger.moveByForces();
      }
    }
    const cont = new BallCont(this);
    this.N = 0;
    glo.strikes = 0;
    for (let ball of this.balls()) {
      ball.step();
      if (ball.x >= 0 && ball.x <= this.width && ball.y >= 0 && ball.y <= this.height) {
        cont.add(ball);
        this.N++;
      }
    }
    this.bcont = cont;
    this.warming();
  }
  measure() {
    this.devices().forEach((d) => d.measure());
    this.plungers.forEach((p) => p.measure());
  }
};

// src/model/Measurer.ts
var Measurer = class _Measurer extends Device {
  static HIST_COLUMNS = 100;
  static METERING_NUMBER = 50;
  // макс кількість замірів для усереднення
  shift = 0;
  // зсув гарфиків по вертикалі
  histogram = [];
  meanFreePath = 0;
  meterings = [];
  space = null;
  get avatar() {
    return "M";
  }
  avg() {
    const meterings = this.meterings.slice(-_Measurer.METERING_NUMBER);
    let accum = [0, 0, 0, 0];
    accum = meterings.reduce((ac, m) => [ac[0] + m.n, ac[1] + m.t, ac[2] + m.p, ac[3] + m.mfp], accum);
    let len = meterings.length;
    if (len) {
      return { n: accum[0] / len, t: accum[1] / len, p: accum[2] / len, mfp: accum[3] / len };
    } else {
      return { n: 0, t: 0, p: 0, mfp: 0 };
    }
  }
  measure() {
    if (this.meterings.length > _Measurer.METERING_NUMBER * 2) {
      this.meterings.splice(0, _Measurer.METERING_NUMBER);
    }
    let ballCount = 0, sumE = 0;
    let maxVV = -1;
    for (let ball of this.space.balls()) {
      if (this.isInside(ball.x, ball.y) && (this.c == "" || this.c == ball.c)) {
        ballCount++;
        let vv = ball.vx ** 2 + ball.vy ** 2;
        sumE += ball.m * vv;
        if (maxVV < vv) maxVV = vv;
      }
    }
    sumE /= 2;
    this.histogram = new Array(_Measurer.HIST_COLUMNS).fill(0);
    let maxV = maxVV ** 0.5;
    let sumPath = 0;
    for (let ball of this.space.balls()) {
      if (this.isInside(ball.x, ball.y) && (this.c == "" || this.c == ball.c)) {
        let v = (ball.vx ** 2 + ball.vy ** 2) ** 0.5;
        let idx = _Measurer.HIST_COLUMNS * v / maxV | 0;
        this.histogram[idx]++;
        sumPath += ((ball.x - ball.prevX) ** 2 + (ball.y - ball.prevY) ** 2) ** 0.5;
      }
    }
    let strikes = glo.strikes * ballCount / this.space.N;
    this.meanFreePath = sumPath / (2 * strikes);
    let metering = {
      n: ballCount,
      t: sumE / ballCount / glo.BOLTZ,
      // t температура - середня кінетична енергія куль                                      
      p: sumE / (this.x2 - this.x1) / (this.y2 - this.y1),
      // p тиск - сумарна кінетична енергія куль в одиниці об'єму
      mfp: this.meanFreePath
    };
    this.meterings.push(metering);
    return metering;
  }
};

// src/view/View.ts
var View = class {
  space;
  ctx;
  ctx2;
  viz = 10;
  // малювати кожну viz-ту частку
  constructor(space2) {
    this.space = space2;
    this.ctx = doc.canvas.getContext("2d");
    this.ctx2 = doc.canvas2.getContext("2d");
  }
  //#region Canvas1  
  draw() {
    const ctx = this.ctx;
    const space2 = this.space;
    ctx.clearRect(0, 0, doc.canvas.width, doc.canvas.height);
    this.drawGrayGrid();
    for (const ball of space2.balls()) {
      if (ball.id % this.viz == 0) {
        this.drawBall(ball);
      }
    }
    for (const line of space2.lines()) {
      this.drawLine(line);
    }
    for (const dev of space2.devices()) {
      this.drawDevice(dev);
    }
  }
  drawLine(line) {
    const ctx = this.ctx;
    let plun = line;
    if (plun instanceof Plunger) {
      let { x, y, w, h } = plun.payloadRect();
      ctx.fillStyle = "#00000044";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "black";
      ctx.fillText(`${plun.m.toFixed(0)} (${plun.pressure.toFixed(2)})`, x + 30, y + h - 10);
      ctx.strokeStyle = plun.c;
      ctx.strokeRect(plun.x1, plun.top, 5, 0.1);
      ctx.strokeRect(plun.x2 - 5, plun.top, 5, 0.1);
      ctx.strokeRect(plun.x1, plun.bottom, 5, 0.1);
      ctx.strokeRect(plun.x2 - 5, plun.bottom, 5, 0.1);
      if (plun.fixed) {
        ctx.strokeRect(plun.x1 - 3, plun.y1 - 3, 6, 6);
        ctx.strokeRect(plun.x2 - 3, plun.y1 - 3, 6, 6);
      }
    }
    ctx.lineCap = "round";
    ctx.strokeStyle = line.c;
    ctx.lineWidth = line == this.space.selectedLine ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  }
  drawBall(ball) {
    const x = ball.x, y = ball.y;
    const ctx = this.ctx;
    ctx.fillStyle = ball.c;
    if (ball.r <= 5) {
      ctx.fillRect(x - 1, y - 2, 2, 4);
      ctx.fillRect(x - 2, y - 1, 4, 2);
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = ball.c;
    ctx.arc(x, y, ball.r, 0, Math.PI * 2);
    if (ball.r > 5) {
      ctx.lineWidth = ball == this.space.selectedBall ? 2 : 1;
      ctx.moveTo(x, y);
      ctx.lineTo(x + ball.vx, y + ball.vy);
    }
    ctx.stroke();
  }
  drawDevice(device) {
    const ctx = this.ctx;
    if (device instanceof Measurer) {
      ctx.strokeStyle = "gray";
      ctx.fillStyle = "#00000011";
    } else {
      if (device.rate > 1) {
        ctx.strokeStyle = "orange";
        ctx.fillStyle = "#FFA50011";
      } else {
        ctx.strokeStyle = "blue";
        ctx.fillStyle = "#0000FF11";
      }
    }
    ctx.lineWidth = device == this.space.selectedDevice ? 2 : 1;
    ctx.fillRect(
      device.x1,
      device.y1,
      device.x2 - device.x1,
      device.y2 - device.y1
    );
    ctx.strokeRect(
      device.x1,
      device.y1,
      device.x2 - device.x1,
      device.y2 - device.y1
    );
    if (device instanceof Heater) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`${device.avatar}:  R=${device.rate.toFixed(4)}`, device.x1, device.y1 - 5);
      ctx.fillText(`E=${device.erg.toFixed(0)}`, device.x1 + 80, device.y1 - 5);
    } else if (device instanceof Measurer) {
      ctx.fillStyle = device.c;
      ctx.fillText(device.c, device.x1, device.y1 - 5);
    }
  }
  //#endregion Canvas1    
  //#region Canvas2
  drawMeasure() {
    this.ctx2.clearRect(0, 0, doc.canvas2.width, doc.canvas2.height);
    for (const device of this.space.devices()) {
      if (device instanceof Measurer) {
        this.drawDeviceMeters(device);
      }
    }
    let plunger = this.space.plungers[0];
    if (plunger) {
      this.drawPlungerMeters(plunger);
    }
  }
  drawDeviceMeters(device) {
    if (device.meterings.length == 0)
      return;
    const HISTORY_DEEP = 24;
    let meterings = device.meterings.slice(-HISTORY_DEEP - 1, device.meterings.length);
    let X = doc.canvas2.width - 55;
    let Y = device.y2 + device.shift;
    let H = 100;
    let Kx = 10;
    const ctx = this.ctx2;
    ctx.fillStyle = "#00000011";
    let x0 = X - HISTORY_DEEP * Kx, y0 = Y - H, w = HISTORY_DEEP * Kx;
    ctx.fillRect(x0, y0, w, H);
    let histogram = device.histogram;
    ctx.strokeStyle = "lightgray";
    ctx.beginPath();
    for (let i = 0; i < histogram.length; i++) {
      ctx.moveTo(x0 + i * 3, Y);
      ctx.lineTo(x0 + i * 3, Y - histogram[i]);
    }
    ctx.stroke();
    const TOP_LIMIT = 100, LOW_LIMIT = 25;
    const forScale = meterings.slice(-5);
    let Kt = 1;
    let maxT = Math.max(...forScale.map((m) => m.t));
    while (maxT * Kt > TOP_LIMIT) Kt /= 2;
    while (maxT * Kt > 0 && maxT * Kt < LOW_LIMIT) Kt *= 2;
    let Kp = 1;
    let maxP = Math.max(...forScale.map((m) => m.p));
    while (maxP * Kp > TOP_LIMIT) Kp /= 2;
    while (maxP * Kp > 0 && maxP * Kp < LOW_LIMIT) Kp *= 2;
    const drawMeters = (prop, Ky, values) => {
      if (!values || values.length == 0)
        return;
      ctx.fillStyle = ctx.strokeStyle = prop == "t" ? "blue" : "brown";
      ctx.lineWidth = device == this.space.selectedDevice ? 2 : 1;
      ctx.beginPath();
      let x = X + (1 - values.length) * Kx;
      let y = Y - Ky * values[0];
      ctx.moveTo(x, y);
      for (let i = 1; i < values.length; i++) {
        x = X + (i - values.length + 1) * Kx;
        y = Y - Ky * values[i];
        ctx.lineTo(x, y);
      }
      ctx.closePath;
      ctx.stroke();
    };
    drawMeters("t", Kt, meterings.map((m) => m.t));
    drawMeters("p", Kp, meterings.map((m) => m.p));
    const avg = device.avg();
    if (!avg.n) {
      return;
    }
    const GAP_Y = 15, GAP_X = 5;
    let yT = Y - Kt * avg.t;
    let yP = Y - Kp * avg.p;
    if (Math.abs(avg.t * Kt - avg.p * Kp) < GAP_Y) {
      if (avg.t * Kt >= avg.p * Kp) {
        yP = yT + GAP_Y;
      } else {
        yT = yP + GAP_Y;
      }
    }
    ctx.fillStyle = "blue";
    if (avg.t)
      ctx.fillText(`T=${avg.t.toFixed(2)}`, X + GAP_X, yT);
    ctx.fillStyle = "brown";
    if (avg.p)
      ctx.fillText(`P=${avg.p.toFixed(3)}`, X + GAP_X, yP);
    ctx.fillStyle = "black";
    let ballNumber = avg.n.toFixed(0);
    ctx.fillText(`n=${ballNumber} , mfp=${avg.mfp.toFixed(0)}`, x0 + 5, y0 + 10);
  }
  drawPlungerMeters(plun) {
    if (plun.meterings.length < 2) {
      return;
    }
    let W = plun.x2 - plun.x1;
    let H = plun.realBottom - plun.top;
    let X = doc.canvas2.width - W - 10;
    let Y = plun.top;
    const ctx = this.ctx2;
    ctx.fillStyle = "#0000000A";
    ctx.fillRect(X, Y, W, H);
    [plun.scales.P, plun.scales.T, plun.scales.S, plun.scales.V, plun.scales.X].forEach((v, i) => {
      ctx.fillStyle = ["red", "black", "green", "gray", "gray"][i];
      ctx.fillText(`${"PTSVX"[i]} = ${v.toPrecision(3)}`, X + W - 50, Y + 10 * (i + 1));
    });
    let meterings = plun.meterings.slice(1);
    let first = meterings[0];
    let last = meterings[meterings.length - 1];
    this.ctx2.lineWidth = plun.scales.w;
    if (plun.scales.P > 0) diagram(3, 0, "red");
    if (plun.scales.T > 0) diagram(3, 1, "black");
    if (plun.scales.S > 0) diagram(4, 2, "green");
    ctx.fillStyle = "black";
    ctx.fillText(`Q+: ${this.space.givenHeat.toPrecision(4)}  Q-: ${this.space.takenHeat.toPrecision(4)} `, 10, 10);
    ctx.fillText(`V: ${last.v.toFixed(0)}  P: ${last.p.toPrecision(3)}  T: ${last.t.toPrecision(4)}  S: ${last.s.toPrecision(4)}  A: ${plun.u.toPrecision(4)}  Los: ${plun.loss.toPrecision(4)}`, X, Y - 5);
    function getScaled(metering) {
      let p = Y + H - metering.p / 10 * H * plun.scales.P;
      let t = Y + H - metering.t / 3e3 * H * plun.scales.T;
      let s = Y + H / 2 - metering.s / 300 * H * plun.scales.S;
      let v = X + metering.v / H * plun.scales.V;
      let x = X + metering.t / 300 * W * plun.scales.X;
      return [p, t, s, v, x];
    }
    function drawMarker(ctx2, x, y) {
      ctx2.strokeRect(x - 2, y - 2, 5, 5);
      ctx2.stroke();
    }
    function diagram(xIdx, yIdx, color) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      let ptsvx = getScaled(first);
      ctx.moveTo(ptsvx[xIdx], ptsvx[yIdx]);
      for (let m of meterings) {
        ptsvx = getScaled(m);
        ctx.lineTo(ptsvx[xIdx], ptsvx[yIdx]);
      }
      ptsvx = getScaled(last);
      drawMarker(ctx, ptsvx[xIdx], ptsvx[yIdx]);
    }
  }
  //#endregion Canvas2
  //#region Gray Zone
  drawGrayRect(x1, y1, x2, y2) {
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    ctx.strokeStyle = ctx.fillStyle = "gray";
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    let w = (x2 - x1).toFixed(2);
    let h = (y2 - y1).toFixed(2);
    let text = x2 - x1 < glo.quant && y2 - y1 < glo.quant ? "\u2588\u2588" : `${w} x ${h}`;
    ctx.fillText(text, x2, y2);
  }
  drawGrayLine(x1, y1, x2, y2) {
    const ctx = this.ctx;
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  drawGrayGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 0.1;
    let step = this.space.cell;
    ctx.beginPath();
    for (let y = step; y < this.space.height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.space.width, y);
    }
    for (let x = step; x < this.space.width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.space.height);
    }
    ctx.stroke();
  }
  //#endregion Gray Zone
  //#region DOM
  showTimeAndInfo(time) {
    const el = document.getElementById("info");
    let strikes = this.space.N ? (glo.strikes * 100 / this.space.N).toFixed(1) : "0";
    el.innerHTML = `T=${time} &nbsp;&nbsp; N=${this.space.N}, &nbsp;&nbsp; strikes=${strikes}%`;
  }
  //#endregion DOM
};

// src/model/Bomb.ts
var Bomb = class {
  n;
  x1;
  y1;
  x2;
  y2;
  vx;
  vy;
  t;
  r;
  m;
  c;
  constructor(n, x1, y1, x2, y2, vx, vy, t, r, m, c) {
    this.n = n;
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.vx = vx;
    this.vy = vy;
    this.t = t;
    this.r = r;
    this.m = m;
    this.c = c;
  }
};

// src/controller/Handlers.ts
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
    document.getElementById("info2").innerHTML = `${e.offsetX}, ${e.offsetY}`;
    if (!this.isDrawing) {
      return;
    }
    if (this.draggingObject && (this.draggingObject === this.space.selectedLine || this.draggingObject === this.space.selectedDevice)) {
      let dx = e.offsetX - this.currentX;
      let dy = e.offsetY - this.currentY;
      this.currentX = e.offsetX;
      this.currentY = e.offsetY;
      this.draggingObject.move(dx, dy);
      this.view.draw();
    } else {
      this.view.draw();
      this.view.drawGrayRect(this.currentX, this.currentY, e.offsetX, e.offsetY);
    }
  }
  mouseup(e) {
  }
  keydown(e) {
    switch (e.key) {
      case "P":
      case "p":
      case "V":
      case "v":
      case "T":
      case "t":
      case "S":
      case "s":
      case "X":
      case "x":
        if (this.space.plunger) {
          this.space.plunger.scale(e.key);
          this.view.drawMeasure();
        }
        break;
      case "0":
        if (this.space.plunger) {
          this.space.plunger.clearMeterings();
          this.view.drawMeasure();
        }
        break;
      case "1":
        this.controller.stop();
        this.controller.step();
        break;
      case "f":
        if (this.space.plunger) {
          this.space.plunger.fixed = !this.space.plunger.fixed;
          this.view.draw();
        }
        break;
    }
  }
  selectObject(x, y) {
    this.space.selectLine(x, y);
    this.space.selectBall(x, y);
    this.space.selectDevice(x, y);
  }
};

// src/controller/params.ts
function getSizeParams() {
  const paramsElement = document.getElementById("sizeParams");
  let ps;
  try {
    ps = new Function(
      "",
      "let W, H;" + paramsElement.value + "; return [W, H]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (ps[0] == void 0 || ps[0] <= 0)
    return errMesage("W: W > 0", paramsElement);
  if (ps[1] == void 0 || ps[1] <= 0)
    return errMesage("H: H > 0", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps;
}
function getSpaceParams() {
  const paramsElement = document.getElementById("spaceParams");
  let ps;
  try {
    ps = new Function(
      "",
      "let g, gBall;" + paramsElement.value + "; return [g, gBall]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  const [g, gBall] = ps;
  if (g == void 0 || g < -10 || g > 10)
    return errMesage("g: -10 < k < 10", paramsElement);
  if (!(gBall != void 0 && (gBall == 0 || gBall == 1)))
    return errMesage("w: 0 <= w < 1", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps;
}
function getGasParams() {
  const paramsElement = document.getElementById("gasParams");
  let ps;
  try {
    ps = new Function(
      "",
      "let n, r, t, m, c;" + paramsElement.value + "; return [n, r, t, m, c]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  let [n, r, t, m, c] = ps;
  if (n == void 0 || n < 0)
    n = 1e3;
  if (r == void 0 || r < 0)
    r = 1;
  if (t == void 0 || t < 0)
    t = 20;
  if (m == void 0 || m < 0)
    m = 1;
  if (c == void 0)
    c = "red";
  paramsElement.style.backgroundColor = "";
  return [n, r, t, m, c];
}
function getWallParams() {
  const paramsElement = document.getElementById("wallParams");
  let type_;
  try {
    type_ = new Function(
      "",
      "let type;" + paramsElement.value + "; return type"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (!type_ || type_ != "r" && type_ != "p")
    type_ = "r";
  paramsElement.style.backgroundColor = "";
  return type_;
}
function getDevsParams() {
  const paramsElement = document.getElementById("devsParams");
  let ps;
  try {
    ps = new Function(
      "",
      "let type, r, c;" + paramsElement.value + "; return [type, r, c]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  let [type_, r, c] = ps;
  if (type_ == void 0 || type_ != "m" && type_ != "h")
    type_ = "m";
  if (r == void 0 || r < 0.9 || r > 1.1)
    r = 1.001;
  if (c == void 0)
    c = "red";
  paramsElement.style.backgroundColor = "";
  return [type_, r, c];
}
function errMesage(mes, el) {
  alert(mes);
  el.style.backgroundColor = "pink";
  return null;
}

// src/controller/BallHandler.ts
var CLICK_DIST = 3;
var BallHandler = class extends Handler {
  // constructor(controller: Controller) {
  //    super(controller);
  // }
  mousedown(e) {
    super.mousedown(e);
    let sel = this.space.selectedBall;
    if (sel && sel.isInside(e.offsetX, e.offsetY)) {
      this.draggingObject = sel;
    }
  }
  mousemove(e) {
    super.mousemove(e);
    if (!this.isDrawing)
      return;
    this.view.draw();
    this.view.drawGrayRect(this.currentX, this.currentY, e.offsetX, e.offsetY);
  }
  mouseup(e) {
    if (!this.isDrawing)
      return;
    this.isDrawing = false;
    if (this.draggingObject) {
      this.draggingObject = null;
      return;
    }
    let x1 = this.currentX, y1 = this.currentY;
    let x2 = e.offsetX, y2 = e.offsetY;
    let drawDist = dist({ x: x1, y: y1 }, { x: x2, y: y2 });
    if (drawDist <= CLICK_DIST) {
      this.selectObject(x1, y1);
    } else {
      let ps = getGasParams();
      if (ps) {
        const [n, r, t, m, c] = ps;
        this.space.addBomb(new Bomb(n, x1, y1, x2, y2, 0, 0, t, r, m, c));
      }
    }
    this.view.draw();
  }
  keydown(e) {
    super.keydown(e);
    switch (e.key) {
      case "Delete":
        if (this.space.selectedBall) {
          this.space.removeSelectedBall();
        } else {
          this.space.clearBalls();
        }
        this.view.draw();
        break;
      case "ArrowUp":
        if (this.space.selectedBall) {
          this.space.selectedBall.y -= 1;
          this.view.draw();
        }
        break;
      case "ArrowDown":
        if (this.space.selectedBall) {
          this.space.selectedBall.y += 1;
          this.view.draw();
        }
        break;
      case "ArrowLeft":
        if (this.space.selectedBall) {
          this.space.selectedBall.x -= 1;
          this.view.draw();
        }
        break;
      case "ArrowRight":
        if (this.space.selectedBall) {
          this.space.selectedBall.x += 1;
          this.view.draw();
        }
        break;
    }
  }
};

// src/controller/LineHandler.ts
var LineHandler = class extends Handler {
  // constructor(controller: Controller) {
  //    super(controller);
  // }
  mousedown(e) {
    super.mousedown(e);
    let sel = this.space.selectedLine;
    if (sel && sel.isInside(e.offsetX, e.offsetY)) {
      this.draggingObject = sel;
    }
  }
  mouseup(e) {
    if (!this.isDrawing)
      return;
    this.isDrawing = false;
    if (this.draggingObject) {
      this.draggingObject.justify();
      this.view.draw();
      this.draggingObject = null;
      return;
    }
    let x1 = this.currentX, y1 = this.currentY;
    let x2 = e.offsetX, y2 = e.offsetY;
    if (x2 - x1 < glo.quant && y2 - y1 < glo.quant) {
      this.selectObject(x1, y1);
    } else {
      const t = getWallParams();
      if (Math.abs(y1 - y2) < glo.quant) {
        this.space.addLine(new Line(x1, y1, x2, y1, "blue"));
      } else if (Math.abs(x1 - x2) < glo.quant) {
        this.space.addLine(new Line(x1, y1, x1, y2, "blue"));
      } else if (t == "r") {
        this.space.addRect(x1, y1, x2, y2, "blue");
      } else if (t == "p") {
        this.space.addPlunger(x1, y1, x2, y2, "blue");
      }
    }
    this.view.draw();
  }
  keydown(e) {
    super.keydown(e);
    switch (e.key) {
      case "Delete":
        if (this.space.selectedLine) {
          this.space.removeSelectedLine();
        } else {
          this.space.clearLines();
        }
        this.view.draw();
        break;
      case "ArrowUp":
        if (this.space.selectedLine) {
          this.space.selectedLine.move(0, -glo.quant);
          this.view.draw();
        }
        break;
      case "ArrowDown":
        if (this.space.selectedLine) {
          this.space.selectedLine.move(0, glo.quant);
          this.view.draw();
        }
        break;
      case "ArrowLeft":
        if (this.space.selectedLine) {
          this.space.selectedLine.move(-glo.quant, 0);
          this.view.draw();
        }
        break;
      case "ArrowRight":
        if (this.space.selectedLine) {
          this.space.selectedLine.move(glo.quant, 0);
          this.view.draw();
        }
        break;
      case "+":
      case "-":
        var plun = this.space.plunger;
        if (plun instanceof Plunger) {
          let dm = e.key == "+" ? 10 : -10;
          plun.m += dm;
          if (plun.m < 0) plun.m = 0;
          this.view.draw();
          confirmAction("New weight: " + plun.m);
        }
        break;
    }
  }
};

// src/controller/DeviceHandler.ts
var DeviceHandler = class extends Handler {
  // constructor(controller: Controller) {
  //     super(controller);
  // }
  mousedown(e) {
    super.mousedown(e);
    let dev = this.space.selectedDevice;
    if (dev && dev.isInside(e.offsetX, e.offsetY)) {
      this.draggingObject = dev;
    }
  }
  mouseup(e) {
    if (!this.isDrawing)
      return;
    this.isDrawing = false;
    if (this.draggingObject) {
      this.draggingObject.justify();
      this.view.draw();
      this.draggingObject = null;
      return;
    }
    let x1 = this.currentX, y1 = this.currentY;
    let x2 = e.offsetX, y2 = e.offsetY;
    if (x2 - x1 < glo.quant && y2 - y1 < glo.quant) {
      this.selectObject(x1, y1);
    } else {
      let [t, rate, color] = getDevsParams();
      if (t == "m") {
        this.space.addDevice(new Measurer(x1, y1, x2, y2, color));
      } else if (t == "h") {
        this.space.addDevice(new Heater(x1, y1, x2, y2, rate, color));
      }
    }
    this.view.draw();
  }
  keydown(e) {
    super.keydown(e);
    switch (e.key) {
      case "Delete":
        if (this.space.selectedDevice) {
          this.space.removeSelectedDevice();
        } else {
          this.space.clearDevices();
        }
        this.view.draw();
        break;
    }
  }
};

// src/data/Repo.ts
var Repo = class {
  space;
  constructor(space2) {
    this.space = space2;
  }
  // Space & globals to json
  //
  serialize() {
    let bombs = this.space.bombs;
    let lines = [];
    let plungers = [];
    for (let l of this.space.lines()) {
      if (l instanceof Plunger) {
        plungers.push({ x1: l.x1, y1: l.realTop, x2: l.x2, y2: l.realBottom, v: l.volume, m: l.m });
      } else {
        lines.push({ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, c: l.c });
      }
    }
    let devices = [];
    for (let d of this.space.devices()) {
      let type = d instanceof Heater ? "h" : "m";
      let device = { x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2, type, rate: 0, color: "" };
      devices.push(device);
      if (d instanceof Heater) {
        device.rate = d.rate;
      }
    }
    let globals = { g: glo.g, gBall: glo.gBall, quant: glo.quant, metr: glo.metr };
    let json = JSON.stringify({ bombs, lines, plungers, devices, globals });
    return json;
  }
  // Restore space & globals 
  //
  deserialize(json) {
    let { bombs, lines, plungers, devices, globals } = JSON.parse(json);
    const space2 = this.space;
    space2.clear();
    bombs.forEach((b) => {
      space2.addBomb(b);
    });
    lines.forEach((l) => {
      let line = new Line(0, 0, 0, 0, "");
      Object.assign(line, l);
      space2.addLine(line);
    });
    plungers.forEach((p) => {
      let y = p.y2 - p.v / (p.x2 - p.x1);
      let plun = new Plunger(p.x1, p.y1, p.x2, p.y2, y);
      plun.m = p.m;
      space2.addLine(plun);
    });
    devices.forEach((d) => {
      switch (d.type) {
        case "m":
          space2.addDevice(new Measurer(d.x1, d.y1, d.x2, d.y2, d.color));
          break;
        case "h":
          space2.addDevice(new Heater(d.x1, d.y1, d.x2, d.y2, d.rate, "red"));
          break;
      }
    });
    Object.assign(glo, globals);
  }
  load(json) {
    this.deserialize(json);
    const obj = { g: glo.g, gBall: glo.gBall, quant: glo.quant, metr: glo.metr };
  }
  // save(): string {
  //     return this.serialize();
  // }
};

// src/controller/Controller.ts
var Controller = class {
  space;
  view;
  timer = 0;
  time = 0;
  // такти часу
  ballHandler;
  lineHandler;
  deviceHandler;
  _createMode = 1 /* Gas */;
  constructor(space2, view2) {
    this.space = space2;
    this.view = view2;
    this.ballHandler = new BallHandler(this);
    this.lineHandler = new LineHandler(this);
    this.deviceHandler = new DeviceHandler(this);
    this.time = 0;
    glo.strikes = 0;
    this.addHandlers();
    this.addDataHandlers();
    this.setModelSize();
    this.createMode = 1 /* Gas */;
  }
  set createMode(mode) {
    let gas = document.getElementById("gasParams").style;
    let wal = document.getElementById("wallParams").style;
    let dev = document.getElementById("devsParams").style;
    gas.display = wal.display = dev.display = "none";
    this._createMode = mode;
    switch (mode) {
      case 0 /* Info */:
        break;
      case 1 /* Gas */:
        this.switchHandlers(this.ballHandler);
        gas.display = "inline";
        break;
      case 2 /* Wall */:
        this.switchHandlers(this.lineHandler);
        wal.display = "inline";
        break;
      case 3 /* Devs */:
        this.switchHandlers(this.deviceHandler);
        dev.display = "inline";
        break;
    }
  }
  get createMode() {
    return this._createMode;
  }
  setModelSize() {
    let [w, h] = [this.space.width, this.space.height];
    document.documentElement.style.setProperty("--canvas-width", w + "px");
    document.documentElement.style.setProperty("--canvas-height", h + "px");
    doc.canvas.height = h;
    doc.canvas.width = w;
    doc.canvas2.height = h;
    doc.canvas2.width = w;
  }
  addHandlers() {
    document.getElementById("sizeParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const size = getSizeParams();
        if (size) {
          [this.space.width, this.space.height] = size;
          this.setModelSize();
        }
      }
    });
    document.getElementById("spaceParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const ps = getSpaceParams();
        if (ps) {
          [glo.g, glo.gBall] = ps;
        }
      }
    });
    document.getElementById("createMode").addEventListener("change", (e) => {
      let str = e.target.value;
      const key = str;
      this.createMode = CreateMode[key];
    });
    document.getElementById("runButton").addEventListener("click", () => {
      if (this.timer == 0)
        this.run();
      else
        this.stop();
    });
    document.getElementById("helpButton").addEventListener("click", () => {
      window.open("help.html", "_blank")?.focus();
    });
    document.getElementById("visRange").addEventListener("change", (e) => {
      const proc = [1, 2, 5, 10, 25, 50, 100];
      let v = +e.target.value;
      this.view.viz = 100 / proc[v];
      this.view.draw();
      document.getElementById("visPercentage").innerHTML = proc[v] + "%";
    });
  }
  // повертає серіалізовану модель у вигляді рядку JSON
  getCurrentModelAsJson() {
    return new Repo(this.space).serialize();
  }
  // оновлює модель з рядку JSON
  setCurrentModelWithJson(jsonStr) {
    new Repo(this.space).load(jsonStr);
    this.stop();
    this.time = 0;
    this.view.draw();
  }

///////////////////////////////////////////////////////////////////////
  addDataHandlers() 
  {
    const KEY_PREFIX = "gas2d.";
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
  



  switchHandlers(handler) {
    doc.canvas.onmousedown = (e) => handler.mousedown(e);
    doc.canvas.onmousemove = (e) => handler.mousemove(e);
    doc.canvas.onmouseup = (e) => handler.mouseup(e);
    doc.canvas.onkeydown = (e) => handler.keydown(e);
  }
  step() {
    this.time++;
    this.space.step();
    if (this.time % glo.metr == 0) {
      this.view.showTimeAndInfo(this.time);
      this.space.measure();
      this.view.drawMeasure();
    }
    this.view.draw();
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = 0;
    }
    this.view.showTimeAndInfo(this.time);
    this.space.measure();
    this.view.drawMeasure();
  }
  run() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.step();
    }, 1);
  }
};

// src/main.ts
[glo.g, glo.gBall] = getSpaceParams();
var space = new Space(...getSizeParams());
var view = new View(space);
new Controller(space, view);
view.draw();
//# sourceMappingURL=main.js.map
