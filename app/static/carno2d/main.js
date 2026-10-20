// src/globals/globals.ts
var glo = {
  BOLTZ: 1 / 30,
  // стала Больцмана (в житті = 1.380649e−23) 
  g: 0.1,
  // сила тяжіння
  gBall: 0,
  // чи впливає тяжіння на кулі (0-ні, 1-впливає) 
  metr: 1,
  // інтервал між вимірюваннями (у кроках)
  quant: 5,
  // квант простору 
  pretty: false,
  // покращення діаграм шляхом заміни реальних даних ідеальними
  strikes: 0,
  // заг. кількість зіткнень 
  msec: 1
  // інтервал між кроками в msec   
};
var doc = {
  canvas: document.getElementById("canvas"),
  canvas2: document.getElementById("canvas2"),
  scriptArea: document.getElementById("processArea")
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
function str2obj(str) {
  const reg = /([^=]+)=([^=]+)[,;]/g;
  str = str.trim();
  if (!str.endsWith(","))
    str += ",";
  const matches = str.matchAll(reg);
  const o = {};
  for (let match of matches) {
    const str2 = match[2].trim();
    o[match[1].trim()] = isNaN(+str2) ? str2 : +str2;
  }
  return o;
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
  // justify() {
  //     this.x1 = quanty(this.x1);
  //     this.x2 = quanty(this.x2);
  //     this.y1 = quanty(this.y1);
  //     this.y2 = quanty(this.y2);        
  // }
  // virtuals for Plunger
  clearMeterings() {
  }
  measure() {
  }
};

// src/model/Plunger.ts
var Plunger = class _Plunger extends Line {
  static GAP = 40;
  static BALL_M = 0.4;
  top;
  bottom;
  realTop;
  realBottom;
  m = 0;
  // payload
  u = 0;
  // робота газу при розширенні (при стисканні вона від'ємна)
  loss = 0;
  // plunger loss
  velo = 0;
  // velocity
  impulseFromBalls = 0;
  // допоміжне тимчасове значення, не є імпульсом
  withFriction = false;
  fixed = false;
  space = null;
  lastMetering;
  meterings;
  scales = { v: 1, p: 6, t: 21, s: 1, x: 1, w: 1 };
  // default values
  constructor(x1, y1, x2, y2, y) {
    super(x1, y, x2, y, "green");
    this.top = y1 + _Plunger.GAP / 4;
    this.bottom = y2 - _Plunger.GAP;
    this.realTop = y1;
    this.realBottom = y2;
    this.lastMetering = { n: 0, p: 0, v: this.volume, t: 0, u: 0, q: 0, s: 0 };
    this.meterings = [this.lastMetering];
  }
  // temperature 
  get t() {
    return this.lastMetering.t;
  }
  // фактично маса на поршні, а не енергія до об'єму
  get pressureM() {
    return this.m * glo.g / (this.x2 - this.x1);
  }
  getPressure() {
    const [sumE, _] = this.sumEnergyUnderPlunger();
    const v = (this.x2 - this.x1) * (this.realBottom - this.y1);
    return sumE / v;
  }
  get volume() {
    return (this.x2 - this.x1) * (this.realBottom - this.y1);
  }
  set volume(vol) {
    this.y1 = this.realBottom + vol / (this.x2 - this.x1);
  }
  get width() {
    return this.x2 - this.x1;
  }
  getPayloadRect() {
    let m = 4 * this.m;
    if (m < 1e3) m = 1e3;
    const wMax = this.x2 - this.x1 - 10;
    let w = Math.sqrt(m / 1.5);
    if (w > wMax) w = wMax;
    if (w < 40) w = 40;
    let h = m / w;
    let x = (this.x1 + this.x2 - w) / 2;
    let y = this.y1 - h - 6;
    return { x, y, w, h };
  }
  moveByForces() {
    let dv = glo.g + this.impulseFromBalls / this.m;
    this.velo += dv;
    if (this.withFriction) {
      const k = 1 - 0.01;
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
    this.impulseFromBalls = 0;
  }
  sumEnergyUnderPlunger() {
    if (!this.space) {
      throw Error("No reference to the space in the plunger.");
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
  // Вклад кінетичної енергії поршня в роботу, виконану газом
  get kinetic() {
    return Math.sign(-this.velo) * (this.m * this.velo ** 2 / 2);
  }
  // вимір робиться у прямокутнику під поршнем
  //
  measure() {
    const [sumE, n] = this.sumEnergyUnderPlunger();
    const v = (this.x2 - this.x1) * (this.realBottom - this.y1);
    let p = sumE / v;
    let t = sumE / (n * glo.BOLTZ);
    let u = this.u + this.kinetic;
    let q = this.space.givenHeat - this.space.takenHeat;
    let ds = (q - this.lastMetering.q) / t;
    if (!ds) {
      ds = 0;
    }
    let s = this.lastMetering.s + ds;
    this.lastMetering = { n, p, v, t, u, q, s };
    this.meterings.push(this.lastMetering);
  }
  isUnderPlunger(x, y) {
    return this.x1 < x && x < this.x2 && this.y1 < y && y < this.realBottom;
  }
  clearMeterings() {
    this.meterings = [];
    this.u = 0;
    this.loss = 0;
    this.space.givenHeat = this.space.takenHeat = 0;
    this.velo = 0;
    this.measure();
  }
  // getAvgMetering(len: number): PlungerMetering {
  //    let res: PlungerMetering = {n: 0, p: 0, v: 0, t: 0, u: 0, q: 0, s:0};
  //    let ms = this.meterings.slice(-len);
  //    ms.reduce((ac, m) => {
  //       ac.p += m.p;
  //       ac.v += m.v;
  //       ac.t += m.t;
  //       ac.u += m.u;
  //       ac.q += m.q;
  //       ac.s += m.s;
  //       return ac;
  //    }, res);
  //    res.p /= len;
  //    res.v = this.volume;
  //    res.t /= len;
  //    res.u /= len;
  //    res.q /= len;
  //    res.s /= len;
  //    return res;
  // }
  scale(x) {
    const coef = 1.1;
    if (x == "P") {
      this.scales.p *= coef;
    } else if (x == "p") {
      this.scales.p /= coef;
    } else if (x == "T") {
      this.scales.t *= coef;
    } else if (x == "t") {
      this.scales.t /= coef;
    } else if (x == "V") {
      this.scales.v *= coef;
    } else if (x == "v") {
      this.scales.v /= coef;
    } else if (x == "S") {
      this.scales.s *= coef;
    } else if (x == "s") {
      this.scales.s /= coef;
    } else if (x == "X") {
      this.scales.x *= coef;
    } else if (x == "x") {
      this.scales.x /= coef;
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
  // move(dx:number, dy: number) {
  //     this.x += dx;
  //     this.y += dy;
  // }
  // justify() { }    // virtual
  step() {
    if (this.space == null)
      throw new Error("Ball is out of the space.");
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
      nearestLine.impulseFromBalls += M * (plung_vy - nearestLine.velo);
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
  straightPassage = true;
  // Напрямок проходження (прямий або зворотний)
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
  // Проходить по всім кулям, що в контейнері.
  //
  *values() {
    let arr = this.arr;
    if (this.straightPassage) {
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
    this.straightPassage = !this.straightPassage;
  }
  add(ball) {
    this.population(ball).push(ball);
  }
  // select(x: number, y: number) {
  //     let selBolls = [];    
  //     for (let ball of this.values()) {
  //         if (ball.isInside(x, y)) {
  //             selBolls.push(ball);
  //         }
  //     }
  //     selBolls.sort((a, b) => a.r - b.r);
  //     if (selBolls.length > 0) {
  //        this.space.selectedBall = selBolls[0];
  //     }
  // }
  // removeSelected() {
  //     let arr = this.arr;
  //     for(let r = 0; r < arr.length; r++) {
  //         for(let c = 0; c < arr[0].length; c++) {
  //             let i = arr[r][c].indexOf(this.space.selectedBall!);
  //             if (i > -1) {
  //                 arr[r][c].splice(i, 1);
  //                 this.space.selectedBall = null;
  //                 return;
  //             }              
  //         }
  //     }
  // }
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
  // removeSelected() {
  //     if (this.space.selectedLine == null) {
  //         return;
  //     }
  //     let i = this.arr.indexOf(this.space.selectedLine);
  //     if (i > -1) {
  //         this.arr.splice(i, 1);
  //         this.space.selectedLine = null;
  //     }
  // }
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
  remove(device) {
    const idx = this.devices.indexOf(device);
    if (idx != -1) {
      this.devices.splice(idx, 1);
    }
  }
  clear() {
    this.devices = [];
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
  // move(dx:number, dy: number) {
  //    //[dx, dy] = [dx, dy].map(x => globus.quanty(x));
  //    this.x1 += dx;
  //    this.x2 += dx;
  //    this.y1 += dy;
  //    this.y2 += dy;
  // }
  //    justify() {
  //       this.x1 = quanty(this.x1);
  //       this.x2 = quanty(this.x2);
  //       this.y1 = quanty(this.y1);
  //       this.y2 = quanty(this.y2);        
  //   }
  measure() {
    return { n: 0, t: 0, p: 0 };
  }
  get avatar() {
    return "";
  }
};

// src/model/Heater.ts
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
    const rate = this.rate;
    for (let ball of this.space.balls()) {
      if (this.c && ball.c != this.c) {
        continue;
      }
      if (this.isInside(ball.x, ball.y)) {
        const oldEnergy = (ball.vx ** 2 + ball.vy ** 2) * ball.m / 2;
        ball.vx *= rate;
        ball.vy *= rate;
        const dE = (rate ** 2 - 1) * oldEnergy;
        this.erg += dE;
        this.space.heatAccounting(dE);
      }
    }
  }
};

// src/model/Space.ts
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
    if (dE > 0)
      this.givenHeat += dE;
    else
      this.takenHeat -= dE;
  }
  bcont;
  wcont;
  dcont;
  selectedLine = null;
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
      let alpha = Math.random() * 2 * Math.PI;
      ball = new Ball(x, y, v * Math.cos(alpha), v * Math.sin(alpha), b.r, b.m, b.c);
      this.addBall(ball);
    }
    this.bombs.push(b);
    this.N += b.n;
  }
  balls() {
    return this.bcont.values();
  }
  population(point) {
    return this.bcont.population(point);
  }
  // selectBall(x: number, y: number) { this.bcont.select(x, y) }
  // removeSelectedBall() { this.bcont.removeSelected() }
  clearBalls() {
    this.bcont.clear();
    this.bombs.length = 0;
  }
  //#endregion Balls
  //#region Lines
  addLine(line) {
    this.wcont.add(line);
    this.selectedLine = line;
  }
  // removeSelectedLine() { this.wcont.removeSelected() }
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
  addEmptyPlunger(x1, y1, x2, y2, color) {
    this.addLine(new Line(x1, y1, x1, y2, color));
    this.addLine(new Line(x2, y1, x2, y2, color));
    this.addLine(new Line(x1, y2, x2, y2, color));
    let plunger = new Plunger(x1, y1, x2, y2, y2 - Plunger.GAP);
    this.addLine(plunger);
    return plunger;
  }
  //#endregion
  //#region Devices
  addDevice(device) {
    this.dcont.add(device);
  }
  removeDevice(device) {
    this.dcont.remove(device);
  }
  // selectDevice(x: number, y: number) { this.dcont.select(x, y) }
  clearDevices() {
    this.dcont.clear();
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
    for (let plunger of this.lines()) {
      if (plunger instanceof Plunger) {
        if (!plunger.fixed)
          plunger.moveByForces();
      }
    }
  }
  measure() {
    this.plungers.forEach((p) => p.measure());
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
  draw1() {
    const ctx = this.ctx;
    const space2 = this.space;
    ctx.clearRect(0, 0, doc.canvas.width, doc.canvas.height);
    for (const ball of space2.balls()) {
      if (ball.id % this.viz == 0) {
        this.ctx.fillStyle = ball.c;
        this.ctx.fillRect(ball.x - 1, ball.y - 1, 2, 2);
      }
    }
    for (const line of space2.lines()) {
      this.drawLine(line);
    }
    for (const dev of space2.devices()) {
      if (dev instanceof Heater) {
        this.drawHeater(dev);
      }
    }
  }
  drawLine(line) {
    const ctx = this.ctx;
    let plun = line;
    if (plun instanceof Plunger) {
      this.drawPlungerPayload(plun);
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
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    if (line instanceof Plunger) {
      ctx.moveTo(line.x1, line.y1 - 6);
      ctx.lineTo(line.x2, line.y2 - 6);
      ctx.moveTo(line.x1, line.y1 - 3);
      ctx.lineTo(line.x2, line.y2 - 3);
    }
    ctx.stroke();
  }
  drawPlungerPayload(plun) {
    let { x, y, w, h } = plun.getPayloadRect();
    const ctx = this.ctx;
    ctx.fillStyle = "#000A";
    ctx.beginPath();
    ctx.fillRect(x, y, w, h);
    ctx.ellipse(x + w / 2, y, w / 2, h / 4, 0, 0, 3.1416, true);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y, w / 4, h / 8, 0, 0, 2 * 3.1416);
    ctx.clip();
    ctx.clearRect(x + w / 2 - w / 4, y - h / 8, w / 2, h / 4);
    ctx.restore();
    ctx.fillStyle = "white";
    ctx.fillText(plun.m.toFixed(0), x + w / 2 - 10, y + h - 16);
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
      ctx.lineWidth = 1;
      ctx.moveTo(x, y);
      ctx.lineTo(x + ball.vx, y + ball.vy);
    }
    ctx.stroke();
  }
  drawHeater(device) {
    const ctx = this.ctx;
    if (device.rate > 1) {
      ctx.strokeStyle = "#ff0000";
      ctx.fillStyle = "#ff000016";
    } else {
      ctx.strokeStyle = "#0000ff";
      ctx.fillStyle = "#0000ff16";
    }
    ctx.fillRect(device.x1, device.y1, device.x2 - device.x1, device.y2 - device.y1);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(`E = ${device.erg.toFixed(0)}`, device.x1 + 80, device.y2 + 20);
  }
  // drawMeasurer(device: Measurer) 
  // {
  //     const ctx = this.ctx;
  //     // device color        
  //     ctx.strokeStyle = 'gray';
  //     ctx.fillStyle = '#00000011';
  //     // device rectangle
  //     ctx.fillRect(device.x1, device.y1, device.x2 - device.x1, device.y2 - device.y1);
  //     // device text
  //     ctx.fillStyle = (device as Measurer).c;
  //     ctx.fillText((device as Measurer).c , device.x1, device.y1 - 5);     
  // }
  //#endregion Canvas1    
  //#region Canvas2
  draw2() {
    const ctx = this.ctx2;
    ctx.clearRect(0, 0, doc.canvas2.width, doc.canvas2.height);
    this.drawGrayGrid2();
    let plunger = this.space.plungers[0];
    if (plunger) {
      this.drawPlungerMeters(plunger);
    }
  }
  drawGrayGrid2() {
    const ctx = this.ctx2;
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
  // drawDeviceMeters(device: Measurer) 
  // {
  //     if (device.meterings.length == 0) 
  //         return;
  //     const HISTORY_DEEP = 24;
  //     let meterings = device.meterings.slice(-HISTORY_DEEP-1, device.meterings.length);
  //     // low left corner and height of the display area
  //     let X = doc.canvas2.width - 55;
  //     let Y = device.y2 + device.shift;
  //     let H = 100; 
  //     let Kx = 10;
  //     const ctx = this.ctx2;
  //     // background
  //     ctx.fillStyle = '#00000011';
  //     let x0 = X - HISTORY_DEEP * Kx, 
  //         y0 = Y - H, 
  //         w = HISTORY_DEEP * Kx;
  //     ctx.fillRect(x0, y0, w, H)
  //     // draw histogram ----------------------
  //     let histogram = device.histogram;
  //     ctx.strokeStyle = 'lightgray';
  //     ctx.beginPath();
  //     for(let i = 0; i < histogram.length; i++) {
  //         ctx.moveTo(x0 + i*3, Y);
  //         ctx.lineTo(x0 + i*3, Y - histogram[i]);
  //     }
  //     ctx.stroke();
  //     // draw P & T graphs ------------------------
  //     const TOP_LIMIT = 100, LOW_LIMIT = 25;
  //     const forScale = meterings.slice(-5);
  //     // scale T
  //     let Kt = 1;
  //     let maxT = Math.max(...forScale.map(m => m.t));
  //     while (maxT * Kt > TOP_LIMIT) Kt /= 2;
  //     while (maxT * Kt > 0 && maxT * Kt < LOW_LIMIT) Kt *= 2;
  //     // scale P
  //     let Kp = 1;
  //     let maxP = Math.max(...forScale.map(m => m.p));
  //     while (maxP * Kp > TOP_LIMIT) Kp /= 2;
  //     while (maxP * Kp > 0 && maxP * Kp < LOW_LIMIT) Kp *= 2;
  //     // function for drawing one graph
  //     const drawMeters = (prop: string, Ky: number, values: number[]) => {
  //         if (!values || values.length == 0)
  //             return;
  //         ctx.fillStyle = ctx.strokeStyle = prop == 't' ? 'blue' : 'brown';    
  //         ctx.lineWidth = device == this.space.selectedDevice ? 2 : 1;
  //         ctx.beginPath();
  //         let x = X + (1 - values.length) * Kx;
  //         let y = Y - Ky * values[0];  
  //         ctx.moveTo(x, y);
  //         for (let i = 1; i < values.length; i++) 
  //         {
  //             x = X + (i - values.length + 1) * Kx;
  //             y = Y - Ky * values[i];
  //             ctx.lineTo(x, y);
  //         }
  //         ctx.closePath;
  //         ctx.stroke();
  //     }
  //     drawMeters('t', Kt, meterings.map(m => m.t));
  //     drawMeters('p', Kp, meterings.map(m => m.p));
  //     // ------------  text values of averige T & P  ----------------
  //     const avg = device.avg();
  //     if (!avg.n) {
  //         return;
  //     }
  //     const GAP_Y = 15, GAP_X = 5;
  //     let yT = Y - Kt * avg.t;
  //     let yP = Y - Kp * avg.p;        
  //     if (Math.abs(avg.t * Kt - avg.p * Kp) < GAP_Y) {
  //         if (avg.t * Kt >= avg.p * Kp) {
  //             yP = yT + GAP_Y; 
  //         } else {
  //             yT = yP + GAP_Y; 
  //         }
  //     }
  //     ctx.fillStyle = 'blue';
  //     if (avg.t) 
  //         ctx.fillText(`T=${avg.t.toFixed(2)}`, X + GAP_X, yT);
  //     ctx.fillStyle = 'brown';
  //     if (avg.p) 
  //         ctx.fillText(`P=${avg.p.toFixed(3)}`, X + GAP_X, yP);   
  //     ctx.fillStyle = 'black';  
  //     let ballNumber = avg.n.toFixed(0);
  //     ctx.fillText(`n=${ballNumber} , mfp=${avg.mfp.toFixed(0)}`, x0 + 5, y0 + 10);
  // }
  drawPlungerMeters(plun) {
    if (plun.meterings.length < 2) {
      return;
    }
    const ctx = this.ctx2;
    ctx.font = "normal 12px Arial";
    const [X, Y, W, H] = xywh(plun);
    [plun.scales.p, plun.scales.t, plun.scales.s, plun.scales.v, plun.scales.x].forEach((v, i) => {
      ctx.fillStyle = ["red", "black", "green", "gray", "gray"][i];
      let x = X + W - 60;
      let y = Y + 13 * (i + 1);
      ctx.fillText(`${"PTSVX"[i]} = ${v.toFixed(1)}`, x, y);
    });
    let meterings = plun.meterings.slice(1);
    let first = meterings[0];
    let last = meterings[meterings.length - 1];
    ctx.lineWidth = plun.scales.w;
    if (plun.scales.p > 0) diagram(3, 0, "red");
    if (plun.scales.t > 0) diagram(3, 1, "black");
    if (plun.scales.s > 0) diagram(4, 2, "green");
    ctx.fillStyle = "black";
    let summa = this.space.givenHeat - this.space.takenHeat - plun.u + plun.loss;
    ctx.fillText(`Q+: ${this.space.givenHeat.toFixed(1)}  Q-: ${this.space.takenHeat.toFixed(1)}  A: ${plun.u.toFixed(1)}  Los: ${plun.loss.toFixed(1)}   \u03A3: ${summa.toFixed(1)}`, X, 14);
    ctx.fillText(
      `V: ${last.v.toFixed(0)}  P: ${last.p.toFixed(3)}  T: ${last.t.toFixed(1)}  S: ${last.s.toFixed(1)}`,
      X,
      28
    );
    const width = this.ctx2.measureText(this.valuesUnderMouse).width + 20;
    this.ctx2.clearRect(X, 28, width, 14);
    this.ctx2.fillText(this.valuesUnderMouse, X, 42);
    function getScaled(metering) {
      let p = Y + H - metering.p / 10 * H * plun.scales.p;
      let t = Y + H - metering.t / 3e3 * H * plun.scales.t;
      let s = Y + H / 2 - metering.s / 300 * H * plun.scales.s;
      let v = X + metering.v / H * plun.scales.v;
      let x = X + metering.t / 300 * W * plun.scales.x;
      return [p, t, s, v, x];
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
      let x = ptsvx[xIdx], y = ptsvx[yIdx];
      ctx.strokeRect(x - 2, y - 2, 5, 5);
      ctx.stroke();
    }
  }
  valuesUnderMouse = "";
  showVauesUnderMouse(plun, x, y) {
    const [p, t, s, v] = ptsvUnderMouse(plun, x, y);
    const [X, _] = xywh(plun);
    this.valuesUnderMouse = `V: ${v.toFixed(0)}  P: ${p.toFixed(3)}  T: ${t.toFixed(1)}  S: ${s.toFixed(1)}`;
  }
  //#endregion Canvas2
  //#region Gray Zone
  showWord(word) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "gray";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(word, doc.canvas.width / 2, doc.canvas.height / 2);
    ctx.restore();
  }
  // drawGrayRect(x1: number, y1: number, x2: number, y2: number,) {
  //     const ctx = this.ctx;
  //     ctx.lineWidth = 1;
  //     ctx.strokeStyle = ctx.fillStyle = 'gray'; 
  //     ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  //     //
  //     let w = (x2 - x1).toFixed(2);
  //     let h = (y2 - y1).toFixed(2);
  //     let text = x2 - x1 < glo.quant && y2 - y1 < glo.quant ? '██' :  `${w} x ${h}`;
  //     ctx.fillText(text, x2, y2);
  // }
  // drawGrayLine(x1: number, y1: number, x2: number, y2: number,) {
  //     const ctx = this.ctx;
  //     ctx.strokeStyle = 'gray'; 
  //     ctx.lineWidth = 1;
  //     ctx.beginPath();
  //     ctx.moveTo(x1, y1);
  //     ctx.lineTo(x2, y2);
  //     ctx.stroke();
  // }
  //#endregion Gray Zone
  //#region DOM
  showTimeAndInfo(time) {
    const el = document.getElementById("info");
    let strikes = this.space.N ? (glo.strikes * 100 / this.space.N).toFixed(1) : "0";
    el.innerHTML = `T=${time} &nbsp;&nbsp; N=${this.space.N}, &nbsp;&nbsp; strikes=${strikes}%`;
  }
  // Eq = A/Q, E -теоретично
  report(who, Eq, E) {
    let info = `
${who}	${Eq}	${E}`;
    doc.scriptArea.value += info;
  }
  //#endregion DOM
};
function ptsvUnderMouse(plun, x, y) {
  const [X, Y, W, H] = xywh(plun);
  let v = (x - X) / plun.scales.v * H;
  let p = (Y + H - y) / plun.scales.p / H * 10;
  let t = (Y + H - y) / plun.scales.t / H * 3e3;
  let s = (Y + H / 2 - y) / plun.scales.s / H * 300;
  let x_ = (x - X) / plun.scales.x * 300 * W;
  return [p, t, s, v];
}
function xywh(plun) {
  let x = plun.x2 + 40;
  let y = plun.top;
  let w = doc.canvas2.width - plun.x2 - 40;
  let h = plun.realBottom - plun.top;
  return [x, y, w, h];
}

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
function errMesage(mes, el) {
  alert(mes);
  el.style.backgroundColor = "pink";
  return null;
}

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

// src/model/process/Process.ts
var Process = class {
  space;
  controller;
  plunger;
  view;
  procState = 1 /* Run */;
  // 0-pause,   1-run,   2-abort,
  constructor(controller2) {
    this.controller = controller2;
    this.space = controller2.space;
    this.view = this.controller.view;
    this.plunger = this.space.plunger;
    this.view.draw1();
    this.view.draw2();
  }
  //#region common
  async whileAsync(condition = () => true, action = () => {
  }, stepAfterAction = true) {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        try {
          if (this.procState == 2 /* Abort */) {
            clearInterval(timer);
            resolve();
            return;
          }
          if (this.procState == 0 /* Pause */) {
            return;
          }
          if (!condition()) {
            clearInterval(timer);
            resolve();
            return;
          }
          action();
          if (stepAfterAction) {
            this.controller.step();
          }
        } catch (err) {
          clearInterval(timer);
          reject(err);
        }
      }, glo.msec);
    });
  }
  async run(time = 1e6) {
    const plun = this.space.plunger;
    let stepCount = time;
    await this.whileAsync(
      () => stepCount > 0,
      () => {
        stepCount--;
        console.log(plun.velo);
      }
    );
    plun.meterings.splice(plun.meterings.length - time, time);
    this.view.draw2();
  }
  //#endregion
  //#region adiabatic 
  async adiabatic(mass, time = 1e3) {
    if (this.plunger.m > mass) {
      await this.adiabaticExtention(mass, time);
    } else if (this.plunger.m < mass) {
      await this.adiabaticCompression(mass, time);
    }
  }
  async adiabaticExtention(minMass, time) {
    const plun = this.plunger;
    const deltaV = plun.volume * (1 - Math.sqrt(plun.m / minMass));
    const wanted_velo = deltaV / plun.width / time;
    await this.whileAsync(
      () => plun.m > minMass,
      () => {
        const eps_m = 2 * wanted_velo * plun.width / plun.volume;
        plun.m *= 1 + eps_m;
        let diffU = (wanted_velo ** 2 - plun.velo ** 2) * plun.m / 2;
        plun.velo = wanted_velo;
        plun.loss += diffU;
        if (plun.m < minMass) {
          plun.u -= plun.kinetic;
          plun.m = minMass;
          plun.u += plun.kinetic;
        }
        if (!glo.pretty) {
          let temperature = plun.volume * plun.pressureM / glo.BOLTZ / this.space.N;
          const last = plun.meterings.length - 1;
          plun.meterings[last].p = plun.pressureM;
          plun.meterings[last].t = temperature;
        }
      }
    );
  }
  async adiabaticCompression(maxMass, time) {
    const plun = this.plunger;
    const deltaV = plun.volume * (1 - Math.sqrt(plun.m / maxMass));
    const wanted_velo = deltaV / plun.width / time;
    await this.whileAsync(
      () => plun.m < maxMass,
      () => {
        const eps_m = 2 * wanted_velo * plun.width / plun.volume;
        plun.m *= 1 + eps_m;
        let diffU = (wanted_velo ** 2 - plun.velo ** 2) * plun.m / 2;
        plun.velo = wanted_velo;
        plun.loss -= diffU;
        if (plun.m > maxMass) {
          plun.u -= plun.kinetic;
          plun.m = maxMass;
          plun.u += plun.kinetic;
        }
        if (!glo.pretty) {
          let temperature = plun.volume * plun.pressureM / glo.BOLTZ / this.space.N;
          const last = plun.meterings.length - 1;
          plun.meterings[last].p = plun.pressureM;
          plun.meterings[last].t = temperature;
        }
      }
    );
  }
  //#endregion
  //#region isobaric 
  async isobaric(vol, time = 1e3) {
    if (this.plunger.volume < vol) {
      await this.isobaricExtention(vol, time);
    } else if (this.plunger.volume > vol) {
      await this.isobaricCompression(vol, time);
    }
  }
  // Газ розширюється до певного об'єму за рахунок повільного нагрівання
  // Гасіння коливань за рахунок стабілізації руху поршня
  async isobaricExtention(maxVolume, time) {
    const plun = this.plunger;
    const deltaV = plun.volume - maxVolume;
    const wanted_velo = deltaV / plun.width / time;
    const initP = plun.getPressure();
    const heater = new Heater(plun.x1, plun.y1, plun.x2, plun.realBottom, 1, "red");
    this.space.addDevice(heater);
    let takenHeat = this.space.takenHeat;
    await this.whileAsync(
      () => plun.volume < maxVolume,
      () => {
        heater.y1 = plun.y1;
        const eps_r = -wanted_velo * plun.width / plun.volume;
        heater.rate = 1 + eps_r;
        let diffU = (wanted_velo ** 2 - plun.velo ** 2) * plun.m / 2;
        plun.velo = wanted_velo;
        plun.u -= diffU;
        let eps_q = diffU / (this.space.N * Plunger.BALL_M);
        heater.rate *= 1 + eps_q;
        heater.warm();
        if (glo.pretty) {
          let idealT = plun.volume * initP / glo.BOLTZ / this.space.N;
          plun.meterings[plun.meterings.length - 1].p = initP;
          plun.meterings[plun.meterings.length - 1].t = idealT;
        }
      }
    );
    this.space.removeDevice(heater);
    let dHeat = this.space.takenHeat - takenHeat;
    this.space.givenHeat -= dHeat;
    this.space.takenHeat = takenHeat;
    this.view.draw2();
  }
  async isobaricCompression(minVolume, time) {
    const plun = this.plunger;
    const deltaV = plun.volume - minVolume;
    const wanted_velo = deltaV / plun.width / time;
    const initP = plun.getPressure();
    const heater = new Heater(plun.x1, plun.y1, plun.x2, plun.realBottom, 1, "red");
    this.space.addDevice(heater);
    let givenHeat = this.space.givenHeat;
    await this.whileAsync(
      () => plun.volume > minVolume,
      () => {
        heater.y1 = plun.y1;
        const eps_r = wanted_velo * plun.width / plun.volume;
        heater.rate = 1 - eps_r;
        let diffU = (wanted_velo ** 2 - plun.velo ** 2) * plun.m / 2;
        plun.velo = wanted_velo;
        plun.u -= diffU;
        let eps_q = diffU / (this.space.N * Plunger.BALL_M);
        heater.rate *= 1 - eps_q;
        heater.warm();
        if (glo.pretty) {
          let idealT = plun.volume * initP / glo.BOLTZ / this.space.N;
          plun.meterings[plun.meterings.length - 1].p = initP;
          plun.meterings[plun.meterings.length - 1].t = idealT;
        }
      }
    );
    this.space.removeDevice(heater);
    let dHeat = this.space.givenHeat - givenHeat;
    this.space.takenHeat -= dHeat;
    this.space.givenHeat = givenHeat;
    this.view.draw2();
  }
  //#endregion
  //#region isothermic 
  async isothermic(mass, time = 1e3) {
    if (this.plunger.m > mass) {
      await this.isothermicExtention(mass, time);
    } else if (this.plunger.m < mass) {
      await this.isothermicCompression(mass, time);
    }
  }
  // Навантаження повільно зменшується до заданого значення, одночасно газ підігрівається.
  async isothermicExtention(minMass, time) {
    const plun = this.plunger;
    const deltaV = plun.volume - plun.volume * plun.m / minMass;
    const wanted_velo = deltaV / plun.width / time;
    const heater = new Heater(
      plun.x1,
      plun.realBottom - (plun.realBottom - plun.y1),
      this.plunger.x2,
      this.plunger.realBottom,
      1,
      "red"
    );
    this.space.addDevice(heater);
    let initT = this.plunger.measureTemperature();
    let takenHeat = this.space.takenHeat;
    await this.whileAsync(
      () => this.plunger.m > minMass,
      () => {
        heater.y1 = plun.realBottom - (plun.realBottom - plun.y1);
        const eps_m = -wanted_velo * plun.width / plun.volume;
        this.plunger.m *= 1 - eps_m;
        if (plun.m < minMass) {
          plun.m = minMass;
        }
        const eps_r = eps_m / 2;
        heater.rate = 1 + eps_r;
        heater.warm();
        let diffU = (wanted_velo ** 2 - plun.velo ** 2) * plun.m / 2;
        plun.velo = wanted_velo;
        plun.u -= diffU;
        let eps_q = diffU / (this.space.N * Plunger.BALL_M);
        heater.rate = 1 + eps_q;
        heater.warm();
        let currT = this.plunger.measureTemperature();
        const eps_t = (initT - currT) / currT / 2;
        heater.rate = 1 + eps_t;
        heater.warm();
        if (glo.pretty) {
          let pressure = initT * glo.BOLTZ * this.space.N / this.plunger.volume;
          this.plunger.meterings[this.plunger.meterings.length - 1].p = pressure;
          this.plunger.meterings[this.plunger.meterings.length - 1].t = initT;
        }
      }
    );
    this.space.removeDevice(heater);
    let dHeat = this.space.takenHeat - takenHeat;
    this.space.givenHeat -= dHeat;
    this.space.takenHeat = takenHeat;
    this.view.draw2();
  }
  async isothermicCompression(maxMass, time) {
    const plun = this.plunger;
    const deltaV = plun.volume - plun.volume * plun.m / maxMass;
    const wanted_velo = deltaV / plun.width / time;
    const heater = new Heater(
      plun.x1,
      plun.realBottom - (plun.realBottom - plun.y1),
      this.plunger.x2,
      this.plunger.realBottom,
      1,
      "red"
    );
    this.space.addDevice(heater);
    let initT = this.plunger.measureTemperature();
    let givenHeat = this.space.givenHeat;
    await this.whileAsync(
      () => this.plunger.m < maxMass,
      () => {
        heater.y1 = plun.realBottom - (plun.realBottom - plun.y1);
        const eps_m = wanted_velo * plun.width / plun.volume;
        this.plunger.m *= 1 + eps_m;
        if (plun.m > maxMass) {
          plun.m = maxMass;
        }
        const eps_r = eps_m / 2;
        heater.rate = 1 - eps_r;
        heater.warm();
        let diffU = (wanted_velo ** 2 - plun.velo ** 2) * plun.m / 2;
        plun.velo = wanted_velo;
        plun.u -= diffU;
        let eps_q = diffU / (this.space.N * Plunger.BALL_M);
        heater.rate = 1 - eps_q;
        heater.warm();
        let currT = this.plunger.measureTemperature();
        const eps_t = (initT - currT) / currT / 2;
        heater.rate = 1 + eps_t;
        heater.warm();
        if (glo.pretty) {
          let pressure = initT * glo.BOLTZ * this.space.N / this.plunger.volume;
          this.plunger.meterings[this.plunger.meterings.length - 1].p = pressure;
          this.plunger.meterings[this.plunger.meterings.length - 1].t = initT;
        }
      }
    );
    this.space.removeDevice(heater);
    let dHeat = this.space.givenHeat - givenHeat;
    this.space.takenHeat -= dHeat;
    this.space.givenHeat = givenHeat;
    this.view.draw2();
  }
  //#endregion
  //#region isohoric 
  async isohoric(targetM, time = 1e3) {
    if (this.plunger.m > targetM) {
      await this.isohoricExt(targetM, time);
    } else if (this.plunger.m < targetM) {
      await this.isohoricCompr(targetM, time);
    }
  }
  // Тиск зменшується до заданого значення за рахунок повільного розвантаження і повільного охолодження.
  async isohoricExt(minMass, time) {
    const plun = this.plunger;
    const eps = Math.log(plun.m / minMass) / time;
    const heater = new Heater(
      plun.x1,
      plun.realBottom - (plun.realBottom - plun.y1),
      this.plunger.x2,
      this.plunger.realBottom,
      1,
      "red"
    );
    this.space.addDevice(heater);
    const vol = this.plunger.volume;
    plun.fixed = true;
    await this.whileAsync(
      () => this.plunger.m > minMass,
      () => {
        heater.y1 = plun.realBottom - (plun.realBottom - plun.y1);
        this.plunger.m *= 1 - eps;
        heater.rate = 1 - eps / 2;
        heater.warm();
        if (glo.pretty) {
          const last = this.plunger.meterings.length - 1;
          let pressure = this.plunger.meterings[last].t * glo.BOLTZ * this.space.N / vol;
          this.plunger.meterings[last].p = pressure;
          this.plunger.meterings[last].v = vol;
        }
      }
    );
    this.space.removeDevice(heater);
    plun.fixed = false;
  }
  // Тиск збільшується до заданого значення за рахунок повільного навантаження і повільного нагрівання.
  async isohoricCompr(maxMass, time) {
    const plun = this.plunger;
    const eps = Math.log(maxMass / plun.m) / time;
    const heater = new Heater(
      plun.x1,
      plun.realBottom - (plun.realBottom - plun.y1),
      this.plunger.x2,
      this.plunger.realBottom,
      1,
      "red"
    );
    this.space.addDevice(heater);
    const vol = this.plunger.volume;
    plun.fixed = true;
    await this.whileAsync(
      () => this.plunger.m < maxMass,
      () => {
        heater.y1 = plun.realBottom - (plun.realBottom - plun.y1);
        this.plunger.m *= 1 + eps;
        heater.rate = 1 + eps / 2;
        heater.warm();
        if (glo.pretty) {
          const last = this.plunger.meterings.length - 1;
          let pressure = this.plunger.meterings[last].t * glo.BOLTZ * this.space.N / vol;
          this.plunger.meterings[last].p = pressure;
          this.plunger.meterings[last].v = vol;
        }
      }
    );
    this.space.removeDevice(heater);
    plun.fixed = false;
  }
  //#endregion 
  //#region Otto Cicle
  // vol | n
  async intake(maxVolume, n = 1e4) {
    const x1 = this.plunger.x1 + 1;
    const y1 = this.plunger.realBottom - 10;
    const x2 = this.plunger.x1 + 5;
    const y2 = this.plunger.realBottom - 1;
    let dn = 200;
    await this.whileAsync(
      () => this.plunger.volume < maxVolume,
      () => {
        if (n > 0) {
          if (n < dn) dn = n;
          const bomb = new Bomb(dn, x1, y1, x2, y2, 0, 0, 75, 0.5, 0.4, "red");
          this.space.addBomb(bomb);
          n -= dn;
        }
      }
    );
  }
  // mas | vol
  async compression(mass, minVolume) {
    this.plunger.m = mass;
    await this.whileAsync(
      () => this.plunger.volume > minVolume
    );
  }
  // rate | t 
  async ignition(maxTemperature, rate = 1.1) {
    const heater = new Heater(this.plunger.x1, this.plunger.y1, this.plunger.x2, this.plunger.realBottom, rate ** 0.5, "red");
    this.space.addDevice(heater);
    await this.whileAsync(
      () => this.plunger.t < maxTemperature,
      () => {
        heater.warm();
      }
    );
    this.space.removeDevice(heater);
  }
  // mas | vol  
  async expansion(mass, maxVolume) {
    this.plunger.m = mass;
    await this.whileAsync(
      () => this.plunger.volume < maxVolume
    );
  }
  // mas 
  async exhaust(mass) {
    this.plunger.m = mass;
    this.space.selectLine(this.plunger.x1 + 20, this.plunger.realBottom);
    const bottomLine = this.space.selectedLine;
    const closedX = bottomLine.x1;
    await this.whileAsync(() => bottomLine.x1 < closedX + this.plunger.width, () => {
      bottomLine.move(10, 0);
    });
    await this.whileAsync(
      () => this.plunger.y1 < this.plunger.bottom,
      () => {
        if (this.plunger.velo > 1)
          this.plunger.velo = 1;
      }
    );
    await this.whileAsync(() => bottomLine.x1 > closedX, () => {
      bottomLine.move(-10, 0);
    });
  }
  //#endregion Otto Cicle
};

// src/model/process/Interpreter.ts
var processArea = document.getElementById("processArea");
var MARK_DONE = "\u258C";
var MARK_DOING = "\u25BA";
var Interpreter = class _Interpreter {
  space;
  view;
  controller;
  process = null;
  constructor(space2, view2, controller2) {
    this.space = space2;
    this.view = view2;
    this.controller = controller2;
  }
  // Поділяє рядок на трйку [command, rest, params]
  //
  static parseLine(line) {
    line = line.trim();
    let pos = line.indexOf(" ");
    if (pos == -1) {
      return [line, "", {}];
    }
    let command = line.slice(0, pos);
    let rest = line.slice(pos + 1).trim();
    let params = str2obj(rest);
    return [command, rest, params];
  }
  // Перетворює текст на масив команд, які очікують виконання
  //
  static scriptToLines(script) {
    let lines = script.split("\n").map((l) => l.trimEnd());
    lines = lines.filter(
      (l) => l != "" && l[0] != MARK_DONE && !l.startsWith(" ")
    );
    if (lines.length == 0 || lines[0][0] == MARK_DOING)
      return [];
    return lines;
  }
  // Виконує ті команди скрипта, які не мають позначки MARK_DONE на початку рядка
  // Ключове слово команди - з початку рядка і до першого пробіла.
  // Пробіл на початку рядка перетворює рядок в коментар.
  //
  async interpret(script) {
    const lines = _Interpreter.scriptToLines(script);
    for (let line of lines) {
      let [command, restLine, params] = _Interpreter.parseLine(line);
      hilightBefore(line);
      switch (command) {
        case "title":
          document.getElementById("title").innerHTML = restLine;
          break;
        case "plunger":
          this.createPlunger(params);
          this.newProcess();
          break;
        case "scale":
          Object.assign(this.space.plunger.scales, params);
          this.space.plunger.clearMeterings();
          this.view.draw2();
          break;
        case "run":
          await this.process?.run(params.time);
          break;
        case "report":
          this.report(restLine);
          break;
        case "adiabatic":
          await this.process?.adiabatic(params.m, params.time);
          break;
        case "isobaric":
          await this.process?.isobaric(params.v, params.time);
          break;
        case "isohoric":
          await this.process?.isohoric(params.m, params.time);
          break;
        case "isothermic":
          await this.process?.isothermic(params.m, params.time);
          break;
        //#region Цикл Отто (бензиновий)
        case "intake":
          await this.process?.intake(params.v, params.n);
          break;
        case "compression":
          await this.process?.compression(params.m, params.v);
          break;
        case "ignition":
          await this.process?.ignition(params.t);
          break;
        case "expansion":
          await this.process?.expansion(params.m, params.v);
          break;
        case "exhaust":
          await this.process?.exhaust(params.m);
          break;
        //#endregion
        default:
          alert(`Wrong command: ${line}`);
          break;
      }
      hilightAfter();
    }
  }
  newProcess() {
    if (this.process) {
      this.process.procState = 2 /* Abort */;
    }
    this.process = new Process(this.controller);
  }
  // params = {t: temperature, m: massa, n: number of balls }
  //
  createPlunger(params) {
    this.space.clear();
    let x1 = 40, y1 = 20, x2 = 240, y2 = 480, m = 100, n = 1e4, t = 100, gas_m = Plunger.BALL_M, gas_r = 0.5, gas_c = "red";
    t = params.t ?? t;
    n = params.n ?? n;
    m = params.m ?? m;
    const y = n * glo.BOLTZ * t / (m * glo.g);
    let plun = this.space.addEmptyPlunger(x1, y1, x2, y2, "green");
    plun.m = m;
    plun.move(0, -y + Plunger.GAP);
    if (n) {
      this.space.clearBalls();
      this.space.addBomb(new Bomb(n, x1, plun.realBottom - y, x2, plun.realBottom, 0, 0, t, gas_r, gas_m, gas_c));
      this.initCalm();
    } else {
      plun.move(0, -Plunger.GAP);
    }
  }
  // Первісне грязне заспокоювання поршня
  initCalm() {
    const plun = this.space.plunger;
    let pv = plun.pressureM * plun.volume;
    const heater = new Heater(plun.x1, plun.y1, plun.x2, plun.realBottom, 1, "red");
    this.space.addDevice(heater);
    for (let i = 0; i < 5; i++) {
      let [en, _] = plun.sumEnergyUnderPlunger();
      heater.rate = Math.sqrt(pv / en);
      heater.warm();
    }
    this.space.removeDevice(heater);
    let T = 2 * Math.PI * Math.sqrt((plun.realBottom - plun.y1) / 2 / glo.g);
    for (let i = 0; i < T / 4; i++) {
      this.space.step();
    }
  }
  // Розраховує Efficiency і COP ()
  report(param = "") {
    const HALF_DEFAULT_DURATION = 500;
    const ms = this.space.plunger.meterings;
    const metering = ms[ms.length - 1];
    const Q = this.space.givenHeat;
    const effQ = metering.u / Q;
    const copQ = Q / -metering.u;
    if (param == "carnot" || param == "rcarnot") {
      const ts = ms.map((m) => m.t);
      ts.sort((a, b) => a - b);
      const Tmin = ts[HALF_DEFAULT_DURATION], Tmax = ts[ts.length - HALF_DEFAULT_DURATION];
      if (param == "carnot") {
        const effT = 1 - Tmin / Tmax;
        this.view.report("carnot", effQ, effT);
      } else {
        const copT = Tmin / (Tmax - Tmin);
        this.view.report("rcarnot", copQ, copT);
      }
    }
    if (param == "brython" || param == "rbrython") {
      const ps = ms.map((m) => m.p);
      ps.sort((a, b) => a - b);
      const Pmin = ps[HALF_DEFAULT_DURATION], Pmax = ps[ps.length - HALF_DEFAULT_DURATION];
      if (param == "brython") {
        const effP = 1 - (Pmin / Pmax) ** 0.5;
        this.view.report("brython", effQ, effP);
      } else {
        const copP = 1 / ((Pmax / Pmin) ** 0.5 - 1);
        this.view.report("rbrython", copQ, copP);
      }
    }
    if (param == "otto" || param == "rotto") {
      const vs = ms.map((m) => m.v);
      vs.sort((a, b) => a - b);
      const Vmin = vs[HALF_DEFAULT_DURATION], Vmax = vs[vs.length - HALF_DEFAULT_DURATION];
      if (param == "otto") {
        const effV = 1 - Vmin / Vmax;
        this.view.report("otto", effQ, effV);
      } else {
        const copV = 1 / (Vmax / Vmin - 1);
        this.view.report("rotto", copQ, copV);
      }
    }
  }
};
function hilightBefore(line) {
  let start = ("\n" + processArea.value).indexOf("\n" + line);
  processArea.value = processArea.value.slice(0, start) + MARK_DOING + processArea.value.slice(start);
}
function hilightAfter() {
  processArea.value = processArea.value.replace(MARK_DOING, MARK_DONE);
}
function removeHilights() {
  processArea.value = processArea.value.replaceAll(MARK_DOING, "").replaceAll(MARK_DONE, "");
}

// src/controller/Controller.ts
var clearButton = document.getElementById("clearButton");
var execButton = document.getElementById("execButton");
var runButton = document.getElementById("runButton");
var processArea2 = document.getElementById("processArea");
var Controller = class {
  space;
  view;
  timer = 0;
  time = 0;
  // такти часу
  interpreter;
  constructor(space2, view2) {
    this.space = space2;
    this.view = view2;
    this.time = 0;
    glo.strikes = 0;
    this.interpreter = new Interpreter(space2, view2, this);
    this.addHandlers();
    this.addDataHandlers();
    this.addProcessHandlers();
    this.setModelSize();
    view2.draw1();
    view2.draw2();
  }
  addProcessHandlers() {
    clearButton.addEventListener("click", async (e) => {
      this.space.clear();
      removeHilights();
      this.interpreter.newProcess();
      this.interpreter.process.procState = 0 /* Pause */;
      this.time = 0;
      this.view.showTimeAndInfo(0);
      this.view.draw1();
    });
    execButton.addEventListener("click", () => {
      doc.canvas.focus();
      this.interpreter.interpret(processArea2.value);
    });
    runButton.addEventListener("click", () => {
      if (!this.interpreter.process)
        return;
      this.interpreter.process.procState = 1 - this.interpreter.process.procState;
    });
    processArea2.addEventListener("input", (event) => {
      const lines = [
        "title",
        "plunger m=100, t=100, n=1000",
        "scale   p=1, t=1, s=1, v=1, x=1",
        "intake     v=, n=",
        "compression m=,    v=",
        "ignition   rate=, t=",
        "expansion  m=,    v=",
        "exhaust    m=,    v=",
        "isobaric   v=",
        "adiabatic  m=",
        "isothermic m=",
        "isohoric   m=",
        "run       time=",
        "report "
      ];
      if (event.data?.length != 1)
        return;
      const { value, selectionStart } = processArea2;
      const begOfLine = value.lastIndexOf("\n", selectionStart - 1) + 1;
      if (selectionStart - begOfLine > 5)
        return;
      const prefix = value.slice(begOfLine, selectionStart);
      const filtered = lines.filter((line) => line.startsWith(prefix));
      if (filtered.length == 1) {
        let a = processArea2.value.slice(0, begOfLine);
        let b = filtered[0];
        let c = processArea2.value.slice(selectionStart);
        processArea2.value = a + b + c;
        processArea2.selectionEnd = processArea2.selectionStart = a.length + b.length;
      }
    });
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
    document.getElementById("helpButton").addEventListener("click", () => {
      window.open("help.html", "_blank")?.focus();
    });
    document.getElementById("visRange").addEventListener("change", (e) => {
      const proc = [1, 2, 5, 10, 25, 50, 100];
      let value = +e.target.value;
      this.view.viz = 100 / proc[value];
      this.view.draw1();
      document.getElementById("visPercentage").innerHTML = proc[value] + "%";
    });
    document.getElementById("speedRange").addEventListener("change", (e) => {
      let value = +e.target.value;
      glo.msec = [40, 20, 1][value];
    });
    document.getElementById("prettyBox").addEventListener("change", (e) => {
      glo.pretty = e.target.checked;
    });
    doc.canvas.addEventListener("keydown", (e) => {
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
            this.view.draw2();
          }
          break;
        case "1":
          this.interpreter.process.procState = 1 /* Run */;
          setTimeout(() => {
            this.interpreter.process.procState = 0 /* Pause */;
            this.view.draw1();
            this.view.showTimeAndInfo(this.time);
          }, 10);
          break;
        case "0":
          if (this.space.plunger) {
            this.space.plunger.clearMeterings();
            this.view.draw2();
          }
          break;
        case "f":
          if (this.space.plunger) {
            this.space.plunger.fixed = !this.space.plunger.fixed;
            this.view.draw1();
          }
          break;
      }
    });
    doc.canvas.addEventListener("mousedown", (e) => {
      doc.canvas.focus({ focusVisible: true });
    });
    doc.canvas.addEventListener("mousemove", (e) => {
      if (this.space.plunger) {
        this.view.showVauesUnderMouse(this.space.plunger, e.offsetX, e.offsetY);
        this.view.draw2();
      }
    });
  }

  // повертає серіалізовану модель у вигляді рядку JSON
  getCurrentModelAsJson() {
      const processArea = document.getElementById('processArea'); 
      return JSON.stringify(processArea.value);
  }

  // оновлює модель з рядку JSON
  setCurrentModelWithJson(jsonStr) {
      processArea.value = JSON.parse(jsonStr);
  }


///////////////////////////////////////////////////////////////////////
  addDataHandlers() 
  {
    const KEY_PREFIX = "carno2d.";
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



  step() {
    this.time++;
    this.space.step();
    if (this.time % glo.metr == 0) {
      this.view.showTimeAndInfo(this.time);
      this.space.measure();
      this.view.draw2();
    }
    this.view.draw1();
  }
};

// src/main.ts
var space = new Space(...getSizeParams());
var view = new View(space);
var controller = new Controller(space, view);
export {
  controller
};
//# sourceMappingURL=main.js.map
