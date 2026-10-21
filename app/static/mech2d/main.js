// src/globals.ts
var glo = {
  W: 0.5,
  // conservation of energу when two balls strikes ( 1 - no loss)
  Wk: 0.95,
  // conservation of energу when link reacts ( 1 - no loss)
  K: 100,
  // modulus of elasticity of a ball     
  g: 5e-3,
  // acceleration of gravity  
  Vis: 0,
  // коеф. спротиву повітря   ( 0 - нема спротиву)
  INTERVAL: 10,
  time: 0,
  // time in ticks (1 sec = 1000/INTERVAL ticks)
  showBallDeform: true,
  // show the deformation of a ball
  Kvelo: 100,
  // for velocity drawing
  Kg: 1e3,
  // for gravity range
  strikeCounter: 0
};
var doc = {
  canvas: document.getElementById("canvas"),
  canvas2: document.getElementById("canvas2"),
  createModeButton: document.getElementById("runButton"),
  redBallImg: document.getElementById("redBallImg"),
  greenBallImg: document.getElementById("greenBallImg"),
  blueBallImg: document.getElementById("blueBallImg"),
  goldBallImg: document.getElementById("goldBallImg"),
  info: document.getElementById("info")
};

// src/models/Geometry.ts
var Point = class {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
};
var Geometry = class {
  // Distance between two points
  //
  static distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  // Скалярное произведение векторов
  //
  static scalar(a, b) {
    return a.x * b.x + a.y * b.y;
  }
  // Угол вектора (a, b) по отношению к оси Ox.
  //
  static angle(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    return Math.atan2(dy, dx);
  }
  // поворот вектора (x, y) на угол alpha
  //
  static turn(a, alpha) {
    let x1 = a.x * Math.cos(alpha) + a.y * Math.sin(alpha);
    let y1 = -a.x * Math.sin(alpha) + a.y * Math.cos(alpha);
    return new Point(x1, y1);
  }
  // расстояние от точки до бесконечной прямой
  //
  static distToInfiniteLine(p, line) {
    let a = line.A, b = line.B, c = line.C;
    return Math.abs(a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
  }
  // Точка пересечения прямой line и перпендикуляра к ней, опущенного из точки p.
  //
  static cross(p, line) {
    let k = line.k;
    let b = line.b;
    let dot;
    if (line.x1 === line.x2) {
      dot = { x: line.x1, y: p.y };
    } else if (line.y1 === line.y2) {
      dot = { x: p.x, y: line.y1 };
    } else {
      let k1 = -1 / k;
      let b1 = p.y - k1 * p.x;
      let k2 = k;
      let b2 = b;
      dot = { x: (b1 - b2) / (k2 - k1), y: (k2 * b1 - k1 * b2) / (k2 - k1) };
    }
    let p1 = line.p1, p2 = line.p2;
    if ((p1.x <= dot.x && dot.x <= p2.x || p2.x <= dot.x && dot.x <= p1.x) && (p1.y <= dot.y && dot.y <= p2.y || p2.y <= dot.y && dot.y <= p1.y))
      return dot;
    return null;
  }
  // Единичный вектор из p1 в p2
  //
  static unit(p1, p2, dist) {
    let dx = p2.x - p1.x, dy = p2.y - p1.y;
    if (!dist) {
      dist = Math.sqrt(dx * dx + dy * dy);
    }
    return { x: dx / dist, y: dy / dist };
  }
  // Перетин кола і відрізка прямої
  // Повертає масив [x1, y1, x2, y2] - координати точок перетину або null, якщо перетину немає
  // Якщо границя відрізка лежить в колі, то точка перетину - це границя відрізка.
  static lineBallIntersect(line, ball) {
    let lk = line.k;
    let lb = line.b;
    let x_1, y_1, x_2, y_2;
    if (line.x1 == line.x2) {
      let discr = ball.radius ** 2 - (line.x1 - ball.x) ** 2;
      if (discr < 0) return null;
      x_1 = x_2 = line.x1;
      y_1 = ball.y - Math.sqrt(discr);
      y_2 = ball.y + Math.sqrt(discr);
      if (y_1 > line.y2 || y_2 < line.y1)
        return null;
      if (line.y1 > y_1) {
        x_1 = line.x1;
        y_1 = line.y1;
      }
      if (line.y2 < y_2) {
        x_2 = line.x2;
        y_2 = line.y2;
      }
    } else {
      let a = 1 + lk ** 2;
      let b = 2 * (-ball.x + lk * (lb - ball.y));
      let c = ball.x ** 2 + (lb - ball.y) ** 2 - ball.radius ** 2;
      let discr = b ** 2 - 4 * a * c;
      if (discr < 0) return null;
      x_1 = (-b - Math.sqrt(discr)) / (2 * a);
      x_2 = (-b + Math.sqrt(discr)) / (2 * a);
      y_1 = lk * x_1 + lb;
      y_2 = lk * x_2 + lb;
      if (x_1 > line.x2 || x_2 < line.x1)
        return null;
      if (line.x1 > x_1) {
        x_1 = line.x1;
        y_1 = line.y1;
      }
      if (line.x2 < x_2) {
        x_2 = line.x2;
        y_2 = line.y2;
      }
    }
    return [x_1, y_1, x_2, y_2];
  }
};

// src/models/Line.ts
var Line = class {
  x1 = 0;
  y1 = 0;
  x2 = 0;
  y2 = 0;
  constructor(x1, y1, x2, y2) {
    this.setInvariant(x1, y1, x2, y2);
  }
  // Invariant: x1 <= x2
  setInvariant(x1, y1, x2, y2) {
    if (x1 < x2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
    } else if (x1 > x2) {
      this.x1 = x2;
      this.y1 = y2;
      this.x2 = x1;
      this.y2 = y1;
    } else {
      this.x1 = this.x2 = x1;
      this.y1 = Math.min(y1, y2);
      this.y2 = Math.max(y1, y2);
    }
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
};

// src/models/Space.ts
var CreateMode = /* @__PURE__ */ ((CreateMode2) => {
  CreateMode2[CreateMode2["Info"] = 0] = "Info";
  CreateMode2[CreateMode2["Ball"] = 1] = "Ball";
  CreateMode2[CreateMode2["Line"] = 2] = "Line";
  CreateMode2[CreateMode2["Link"] = 3] = "Link";
  return CreateMode2;
})(CreateMode || {});
var Space = class _Space {
  height = 0;
  width = 0;
  balls = [];
  lines = [];
  border = [];
  links = [];
  selBall = null;
  selLine = null;
  selLink = null;
  deleteSelected(mode) {
    if (mode == 1 /* Ball */ && this.selBall)
      this.deleteBall(this.selBall);
    if (mode == 2 /* Line */ && this.selLine)
      this.deleteLine(this.selLine);
    if (mode == 3 /* Link */ && this.selLink)
      this.deleteLink(this.selLink);
  }
  constructor(w, h) {
    this.setSize(w, h);
  }
  setSize(w, h) {
    this.width = w;
    this.height = h;
    this.border = [
      new Line(0, 0, w, 0),
      // top
      new Line(w, 0, w, h),
      // right
      new Line(w, h, 0, h),
      // bottom
      new Line(0, h, 0, 0)
      // left
    ];
  }
  get energy() {
    let eKin = 0, ePot = 0, eDef = 0;
    for (let b of this.balls) {
      eKin += b.kinEnergy;
      ePot += b.potEnergy;
      eDef += b.defEnergy;
    }
    return [eKin, ePot, eDef];
  }
  //#region  Ball Suit
  addBall(b) {
    b.space = this;
    this.balls.push(b);
  }
  deleteBall(b) {
    let idx = this.balls.indexOf(b);
    if (idx === -1)
      return;
    this.balls.splice(idx, 1);
    if (this.selBall === b)
      this.selBall = null;
    for (let i = this.links.length - 1; i >= 0; i--) {
      if (this.links[i].b1 === b || this.links[i].b2 === b)
        this.links.splice(i, 1);
    }
  }
  clearLostBalls() {
    for (let i = this.balls.length; i >= 0; i--) {
      let b = this.balls[i];
      if (b.x < -b.radius || b.x > this.width + b.radius || b.y < -b.radius || b.y > this.height + b.radius)
        this.balls.splice(i, 1);
    }
    for (let i = this.links.length; i >= 0; i--) {
      let link = this.links[i];
      if (this.balls.indexOf(link.b1) === -1 || this.balls.indexOf(link.b2) === -1)
        this.links.splice(i, 1);
    }
  }
  // find a ball under point
  ballUnderPoint(p) {
    for (let b of this.balls) {
      let d = Geometry.distance(p, b);
      if (d < Math.max(5, b.radius)) {
        return b;
      }
    }
    return null;
  }
  // find a ball which velocity is under a point
  ballVeloUnderPoint(p) {
    for (let b of this.balls) {
      let q = { x: b.x + b.vx * glo.Kvelo, y: b.y + b.vy * glo.Kvelo };
      if (Geometry.distance(p, q) <= 3) {
        return b;
      }
    }
    return null;
  }
  //#endregion
  //#region Line Suit
  addLine(l) {
    this.lines.push(l);
  }
  deleteLine(line) {
    let idx = this.lines.indexOf(line);
    if (idx === -1)
      return;
    this.lines.splice(idx, 1);
    if (this.selLine === line)
      this.selLine = null;
  }
  // find a line under point
  lineUnderPoint(p) {
    for (let l of this.lines) {
      if (Geometry.distToInfiniteLine(p, l) < 5 && Geometry.cross(p, l)) {
        return l;
      }
    }
    return null;
  }
  //#endregion
  //#region Link Suit
  addLink(link) {
    this.links.push(link);
  }
  deleteLink(link) {
    let idx = this.links.indexOf(link);
    if (idx === -1)
      return;
    this.links.splice(idx, 1);
  }
  // find a link under point
  linkUnderPoint(point) {
    for (let link of this.links) {
      let line = new Line(link.x1, link.y1, link.x2, link.y2);
      if (Geometry.distToInfiniteLine(point, line) < 5 && Geometry.cross(point, line)) {
        return link;
      }
    }
    return null;
  }
  //#endregion
  //#region Mechanics
  collectDots() {
    this.balls.forEach((b) => b.clearDots());
    this.dotsFromLines();
    this.dotsFromBalls();
    this.dotsFromLinksStrikes();
    this.dotsFromLinksReactions();
  }
  // Збирає на кулі точки стикання з лініями (в т.ч. із межами).
  dotsFromLines() {
    for (let ball of this.balls) {
      for (let line of this.lines.concat(this.border)) {
        let r = Geometry.lineBallIntersect(line, ball);
        if (r) {
          let [x1, y1, x2, y2] = r;
          ball.addDot((x1 + x2) / 2, (y1 + y2) / 2, line);
        }
      }
    }
  }
  // Збирає на кулі точки стикання з іншими кулями.
  dotsFromBalls() {
    let balls = this.balls;
    for (let i = 0; i < balls.length - 1; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        let b1 = balls[i], b2 = balls[j];
        let point = _Space.getStrikeTwoBallsPoint(b1, b2);
        if (point) {
          b1.addDot(point.x, point.y, b2);
          b2.addDot(point.x, point.y, b1);
        }
      }
    }
  }
  static getStrikeTwoBallsPoint(b1, b2) {
    let dist = Geometry.distance(b1, b2);
    if (dist > b1.radius + b2.radius)
      return null;
    let deform = (b1.radius + b2.radius - dist) / 2;
    let ratio = (b1.radius - deform) / dist;
    let x = b1.x + (b2.x - b1.x) * ratio;
    let y = b1.y + (b2.y - b1.y) * ratio;
    return new Point(x, y);
  }
  setLinkReactionDots(link, currentLen) {
    let b1 = link.b1, b2 = link.b2;
    let u = Geometry.unit(b2, b1, currentLen);
    let shift = currentLen < link.len0 ? link.len0 - b1.radius - b2.radius : link.len0 + b1.radius + b2.radius;
    b2.x += shift * u.x;
    b2.y += shift * u.y;
    let point = _Space.getStrikeTwoBallsPoint(b1, b2);
    b1.addDot(point.x, point.y, link);
    b2.x -= shift * u.x;
    b2.y -= shift * u.y;
    b2.addDot(point.x - shift * u.x, point.y - shift * u.y, link);
  }
  // Збирає на кулі віртуальні точки стикання, зумовлені зв'язками
  // точки зв'язків мають властивість fromLink = true
  dotsFromLinksReactions() {
    for (let link of this.links) {
      let currentLen = link.len;
      if (Math.abs(currentLen - link.len0) > 1e-6) {
        this.setLinkReactionDots(link, currentLen);
      }
    }
  }
  // Збирає на кулі точки стикання від ударів по зв'язкам
  dotsFromLinksStrikes() {
    for (let ball of this.balls) {
      for (let link of this.links) {
        if (ball === link.b1 || ball === link.b2 || link.transparent)
          continue;
        let line = new Line(link.x1, link.y1, link.x2, link.y2);
        let d = Geometry.distToInfiniteLine(ball, line);
        if (d > ball.radius)
          continue;
        let p = Geometry.cross(ball, line);
        if (!p)
          continue;
        let delta = ball.radius - d;
        let len1 = Geometry.distance(link.b1, p), len2 = link.len0 - len1;
        let common = delta / link.len0;
        let delta1 = len2 * common;
        let delta2 = len1 * common;
        let k = d / (ball.radius - delta);
        let x = (p.x - ball.x) / k + ball.x;
        let y = (p.y - ball.y) / k + ball.y;
        ball.dots.push({ x, y, from: link });
        let u = Geometry.unit(p, ball, d);
        let r1 = link.b1.radius - delta1;
        link.b1.addDot(link.b1.x + r1 * u.x, link.b1.y + r1 * u.y, ball);
        let r2 = link.b2.radius - delta2;
        link.b2.addDot(link.b2.x + r2 * u.x, link.b2.y + r2 * u.y, ball);
      }
    }
  }
  //#endregion
};

// src/view/View.ts
var View = class {
  space;
  prettyMode;
  traceMode;
  constructor(box) {
    this.space = box;
    let el = document.getElementById("prettyModeCb");
    this.prettyMode = el.checked ? 1 /* Beauty */ : 0 /* Draft */;
    el = document.getElementById("traceModeCb");
    this.traceMode = el.checked ? 1 /* Yes */ : 0 /* No */;
  }
  clearTrace() {
    const ctx2 = doc.canvas2.getContext("2d");
    ctx2.clearRect(0, 0, doc.canvas2.width, doc.canvas2.height);
  }
  drawAll(lineWidth = 0.5) {
    if (this.prettyMode)
      return this.drawPretty();
    const ctx = doc.canvas.getContext("2d");
    ctx.clearRect(0, 0, doc.canvas.width, doc.canvas.height);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "black";
    ctx.strokeRect(0, 0, this.space.width, this.space.height);
    for (let b of this.space.balls) {
      ctx.lineWidth = this.space.selBall === b ? 3 * lineWidth : lineWidth;
      ctx.strokeStyle = b.color;
      ctx.beginPath();
      let x = b.x, y = b.y;
      if (glo.showBallDeform && b.dots && b.dots.length > 0) {
        let dot = b.dots[0];
        let alpha = Math.atan2(dot.y - b.y, dot.x - b.x);
        let kr = Geometry.distance(dot, b) / b.radius;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(alpha);
        ctx.scale(kr, 1 / kr);
        ctx.rotate(-alpha);
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.restore();
      } else {
        ctx.arc(x, y, b.radius, 0, Math.PI * 2);
      }
      ctx.strokeRect(x + b.vx * glo.Kvelo - 0.5, y + b.vy * glo.Kvelo - 0.5, 1, 1);
      ctx.moveTo(x, y);
      ctx.lineTo(x + b.vx * glo.Kvelo, y + b.vy * glo.Kvelo);
      ctx.stroke();
      if (this.traceMode === 1 /* Yes */) {
        const ctx2 = doc.canvas2.getContext("2d");
        ctx2.fillStyle = "gray";
        ctx2.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
    }
    for (let b of this.space.balls) {
      if (!b.dots) continue;
      for (let d of b.dots) {
        ctx.strokeStyle = "black";
        ctx.strokeRect(d.x - 0.5, d.y - 0.5, 1, 1);
      }
    }
    ctx.strokeStyle = "blue";
    for (let l of this.space.lines) {
      ctx.lineWidth = this.space.selLine === l ? 3 * lineWidth : lineWidth;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
    for (let l of this.space.links) {
      ctx.lineWidth = this.space.selLink === l ? 3 * lineWidth : lineWidth;
      ctx.strokeStyle = l.transparent ? "lightgray" : "gray";
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
  }
  drawPretty() {
    const ctx = doc.canvas.getContext("2d");
    ctx.clearRect(0, 0, doc.canvas.width, doc.canvas.height);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "black";
    ctx.strokeRect(0, 0, this.space.width, this.space.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    for (let link of this.space.links) {
      if (link.transparent)
        continue;
      ctx.moveTo(link.x1, link.y1);
      ctx.lineTo(link.x2, link.y2);
    }
    ctx.stroke();
    for (let b of this.space.balls) {
      ctx.save();
      let img = b.color === "red" ? doc.redBallImg : b.color === "blue" ? doc.blueBallImg : b.color === "gold" ? doc.goldBallImg : doc.greenBallImg;
      if (glo.showBallDeform && b.dots && b.dots.length > 0) {
        let dot = b.dots[0];
        let alpha = Math.atan2(dot.y - b.y, dot.x - b.x);
        let kr = Geometry.distance(dot, b) / b.radius;
        kr = 1 - (1 - kr) / 5;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(alpha);
        ctx.scale(kr, 1 / kr);
        ctx.rotate(-alpha);
        ctx.translate(-b.radius, -b.radius);
        let k = 2 * b.radius / img.width;
        ctx.scale(k, k);
      } else {
        ctx.translate(b.x - b.radius, b.y - b.radius);
        let k = 2 * b.radius / img.height;
        ctx.scale(k, k);
      }
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      if (this.traceMode === 1 /* Yes */) {
        const ctx2 = doc.canvas2.getContext("2d");
        ctx2.fillStyle = "gray";
        ctx2.fillRect(b.x - 0.5, b.y - 0.5, 1, 1);
      }
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    for (let line of this.space.lines) {
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
    }
    ctx.stroke();
  }
  // -------------------- gray things -------------------
  drawGrayLine(p0, p) {
    const ctx = doc.canvas.getContext("2d");
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  drawGrayCircle(p0, p) {
    const ctx = doc.canvas.getContext("2d");
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    let x = p0.x, y = p0.y;
    let r = Math.round(Geometry.distance(p0, p));
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText("R = " + r, p.x, p.y);
  }
  // -----------------------------------------------------
  showTimeAndEnergy() {
    let [ek, eg, ed] = this.space.energy;
    doc.info.innerHTML = `T=${glo.time} &nbsp;&nbsp; E=${(ek + eg + ed).toFixed()}`;
  }
};

// src/models/Link.ts
var Link = class {
  b1;
  b2;
  len0;
  // довжина ненапруженого зв'язку
  transparent;
  constructor(b1, b2, transparent = false) {
    this.b1 = b1;
    this.b2 = b2;
    this.len0 = Geometry.distance(b1, b2);
    this.transparent = transparent;
  }
  get x1() {
    return this.b1.x;
  }
  get y1() {
    return this.b1.y;
  }
  get x2() {
    return this.b2.x;
  }
  get y2() {
    return this.b2.y;
  }
  get len() {
    return Geometry.distance(this.b1, this.b2);
  }
};

// src/models/Ball.ts
var Dot = class extends Point {
  from;
  // від якого об'єкта створена точка 
  constructor(x, y, from) {
    super(x, y);
    this.from = from;
  }
};
var Ball = class _Ball {
  x;
  y;
  radius;
  color;
  vx;
  vy;
  m;
  is_stone;
  space = null;
  ax = 0;
  ay = 0;
  dots = [];
  dotShadows = [];
  constructor(x, y, r, color, vx, vy, is_stone = false, m = 0) {
    this.x = x;
    this.y = y;
    this.radius = r;
    this.color = is_stone ? "blue" : color;
    this.vx = vx;
    this.vy = vy;
    this.is_stone = is_stone;
    this.m = m ? m : r * r;
  }
  get kinEnergy() {
    let b = this;
    return b.m * (b.vx * b.vx + b.vy * b.vy) / 2;
  }
  get potEnergy() {
    const b = this, h = b.space.height - b.radius - b.y;
    return b.m * glo.g * h;
  }
  get defEnergy() {
    const b = this;
    let e = 0;
    b.dots.forEach((dot) => {
      let c = new Point(b.x - b.vx / 2, b.y - b.vy / 2);
      let ballDotDistance = Geometry.distance(c, dot);
      let deform = b.radius - ballDotDistance;
      e += glo.K * deform ** 2 / 2;
    });
    return e;
  }
  addDot(x, y, from) {
    if (!this.dotShadows.find((d) => d.from === from)) {
      if (from instanceof _Ball)
        glo.strikeCounter += 0.5;
      if (from instanceof Line)
        glo.strikeCounter += 1;
    }
    let dot = new Dot(x, y, from);
    this.dots.push(dot);
  }
  clearDots() {
    this.dotShadows = this.dots;
    this.dots = [];
  }
  // Переміщення кулі. 
  // Викликається, коли зібрані усі точки дотику
  move() {
    let ball = this;
    if (ball.is_stone)
      return;
    let fx = 0, fy = 0;
    for (let dot of ball.dots) {
      let ballDotDistance = Geometry.distance(ball, dot);
      let deform = ball.radius - ballDotDistance;
      let u = Geometry.unit(dot, ball, ballDotDistance);
      let w = dot.from instanceof Link ? 1 - glo.Wk : 1 - glo.W;
      let scalarProduct = Geometry.scalar(new Point(ball.vx, ball.vy), u);
      let k = scalarProduct > 0 ? w : 1;
      let f = glo.K * w * k * deform;
      fx += f * u.x;
      fy += f * u.y;
    }
    if (glo.Vis > 0) {
      let k = ball.radius * glo.Vis;
      fx -= ball.vx * k;
      fy -= ball.vy * k;
    }
    let ax = fx / ball.m;
    let ay = fy / ball.m + glo.g;
    ball.vx += ax;
    ball.vy += ay;
    ball.x += ball.vx;
    ball.y += ball.vy;
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
      "let k, w, u, v, g ;" + paramsElement.value + "; return [k, w, u, v, g]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  const [k, w, u, v, g] = ps;
  if (k == void 0 || k < 10 || k > 1e3)
    return errMesage("k: 10 < k < 1000", paramsElement);
  if (w == void 0 || w < 0 || w > 1)
    return errMesage("w: 0 <= w < 1", paramsElement);
  if (u == void 0 || u < 0 || u > 1)
    return errMesage("u: 0 <= u < 1", paramsElement);
  if (v == void 0 || v < 0 || v > 1)
    return errMesage("v: 0 <= v < 1", paramsElement);
  if (g == void 0 || g < -0.1 || g > 0.1)
    return errMesage("g: -0.1 < g < 0.1", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps;
}
function getBallParams() {
  const paramsElement = document.getElementById("ballParams");
  let ps;
  try {
    ps = new Function(
      "",
      "let st, m;" + paramsElement.value + "; return [st, m]"
    )();
  } catch {
    return errMesage("Grammar error", paramsElement);
  }
  if (!(ps[0] === 0 || ps[0] === 1))
    return errMesage("st: st = 0 | 1", paramsElement);
  paramsElement.style.backgroundColor = "";
  return ps;
}
function errMesage(mes, el) {
  alert(mes);
  el.style.backgroundColor = "pink";
  return null;
}

// src/controller/utils.ts
function cursorPoint(event) {
  const canvasRect = doc.canvas.getBoundingClientRect();
  return {
    x: event.x - canvasRect.left,
    y: event.y - canvasRect.top
  };
}
function takeFocusOff() {
  doc.canvas.focus();
}
function sceneToJson(space2) {
  space2.balls.forEach((b) => {
    b.space = null;
    b.clearDots();
  });
  let obj = {
    balls: space2.balls.map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, m: b.m, radius: b.radius, color: b.color, is_stone: b.is_stone })),
    lines: space2.lines,
    links: space2.links.map((l) => [l.b1.x, l.b1.y, l.b2.x, l.b2.y]),
    g: glo.g,
    W: glo.W,
    Wk: glo.Wk,
    Vis: glo.Vis,
    K: glo.K
  };
  let json = JSON.stringify(obj);
  space2.balls.forEach((b) => b.space = space2);
  return json;
}
function restoreSceneFromJson(json, space2) {
  const obj = JSON.parse(json);
  space2.balls = obj.balls.map((b) => new Ball(b.x, b.y, b.radius, b.color, b.vx, b.vy, b.is_stone, b.m));
  space2.balls.forEach((b) => b.space = space2);
  space2.lines = obj.lines.map((l) => new Line(l.x1, l.y1, l.x2, l.y2));
  space2.links = [];
  obj.links.forEach((arr) => {
    let b1 = space2.ballUnderPoint({ x: arr[0], y: arr[1] });
    let b2 = space2.ballUnderPoint({ x: arr[2], y: arr[3] });
    if (b1 && b2) {
      space2.links.push(new Link(b1, b2));
    }
  });
  glo.g = obj.g;
  glo.W = obj.W;
  glo.Wk = obj.Wk;
  glo.Vis = obj.Vis;
  glo.K = obj.K;
}

// src/controller/Controller.ts
var Controller = class {
  space;
  view;
  intervalId = 0;
  // base field for timeMode property
  _mousePos = new Point(0, 0);
  _createMode = 1 /* Ball */;
  constructor(space2, view2) {
    this.space = space2;
    this.view = view2;
    this.setModelSize(space2.width, space2.height);
    this.timeMode = 0 /* Stop */;
    this.createMode = 1 /* Ball */;
    this.addEventHandlers();
    this.addDataHandlers();
  }
  addEventHandlers() {
    document.getElementById("sizeParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const size = getSizeParams();
        if (size) {
          this.setModelSize(...size);
          takeFocusOff();
        }
      }
    });
    document.getElementById("spaceParams").addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        const ps = getSpaceParams();
        if (ps) {
          [glo.K, glo.W, glo.Wk, glo.Vis, glo.g] = ps;
          takeFocusOff();
        }
      }
    });
    document.getElementById("runButton").addEventListener("click", () => {
      this.timeMode = this.timeMode == 0 /* Stop */ ? 1 /* Play */ : 0 /* Stop */;
    });
    document.getElementById("helpButton").addEventListener("click", () => {
      window.open("help.html", "_blank")?.focus();
    });
    document.getElementById("createMode").addEventListener("change", (e) => {
      let str = e.target.value;
      const key = str;
      this.createMode = CreateMode[key];
      let sb = document.getElementById("ballParams").style;
      let sl = document.getElementById("lineParams").style;
      let sk = document.getElementById("linkParams").style;
      sb.display = sl.display = sk.display = document.getElementById("ballParams").style.display = "none";
      switch (this.createMode) {
        case 1 /* Ball */:
          sb.display = "inline";
          break;
        case 2 /* Line */:
          sl.display = "inline";
          break;
        case 3 /* Link */:
          sk.display = "inline";
          break;
        default:
          break;
      }
    });
    document.getElementById("prettyModeCb").addEventListener("click", () => {
      this.view.prettyMode = this.view.prettyMode === 0 /* Draft */ ? 1 /* Beauty */ : 0 /* Draft */;
      this.view.drawAll();
    });
    document.getElementById("traceModeCb").addEventListener("click", () => {
      this.view.traceMode = this.view.traceMode === 1 /* Yes */ ? 0 /* No */ : 1 /* Yes */;
      if (this.view.traceMode === 0 /* No */) {
        this.view.clearTrace();
      }
    });
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        // step execution
        case "s":
        case "S":
        case "\u0456":
        case "\u0406":
          this.timeMode = 0 /* Stop */;
          this.step();
          break;
        case "Delete":
          this.space.deleteSelected(this.createMode);
          this.view.drawAll();
          break;
      }
    });
  }
  // повертає серіалізовану модель у вигляді рядку JSON
  getCurrentModelAsJson() {
    return sceneToJson(this.space);
  }
  // оновлює модель з рядку JSON
  setCurrentModelWithJson(jsonStr) {
    restoreSceneFromJson(jsonStr, this.space);
    this.timeMode = 0 /* Stop */;
    this.view.drawAll();
  }

///////////////////////////////////////////////////////////////////////
  addDataHandlers() 
  {
    const KEY_PREFIX = "mech2d.";
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



  //#region Mouse Handlers
  setBallHandlers() {
    let p0 = null;
    let ball = null;
    let ballVelo = null;
    let isMousePressed = false;
    doc.canvas.onmousedown = (e) => {
      isMousePressed = true;
      p0 = cursorPoint(e);
      ballVelo = this.space.ballVeloUnderPoint(p0);
      if (ballVelo) {
        return;
      }
      ball = this.space.ballUnderPoint(p0);
      if (ball != null) {
        p0 = { x: ball.x - p0.x, y: ball.y - p0.y };
        this.space.selBall = ball;
      }
    };
    doc.canvas.onmousemove = (e) => {
      let p = cursorPoint(e);
      this._mousePos = p;
      if (!isMousePressed) return;
      if (ballVelo) {
        ballVelo.vx = (p.x - ballVelo.x) / glo.Kvelo;
        ballVelo.vy = (p.y - ballVelo.y) / glo.Kvelo;
        this.view.drawAll();
        return;
      }
      if (ball) {
        ball.x = p.x + p0.x;
        ball.y = p.y + p0.y;
        this.view.drawAll();
        return;
      }
      this.view.drawAll();
      this.view.drawGrayCircle(p0, p);
    };
    doc.canvas.onmouseup = (e) => {
      if (!ball && !ballVelo) {
        let p = cursorPoint(e);
        let r = Geometry.distance(p0, p);
        if (r > 2) {
          let ps = getBallParams();
          if (ps) {
            let [st, m] = ps;
            let newBall = new Ball(p0.x, p0.y, r, "red", 0, 0, st === 1, m);
            this.space.addBall(newBall);
            this.space.selBall = newBall;
          }
        }
      }
      this.view.drawAll();
      isMousePressed = false;
    };
  }
  setLineHandlers() {
    let p0 = null;
    doc.canvas.onmousedown = (e) => {
      p0 = cursorPoint(e);
      let line = this.space.lineUnderPoint(p0);
      if (line) {
        this.space.selLine = line;
      }
    };
    doc.canvas.onmousemove = (e) => {
      let p = cursorPoint(e);
      this._mousePos = p;
      if (p0) {
        this.view.drawAll();
        this.view.drawGrayLine(p0, p);
      }
    };
    doc.canvas.onmouseup = (e) => {
      if (p0 === null)
        return;
      let p = cursorPoint(e);
      if (Geometry.distance(p0, p) > 2) {
        let l = new Line(p0.x, p0.y, p.x, p.y);
        this.space.addLine(l);
        this.space.selLine = l;
      }
      p0 = null;
      this.view.drawAll();
    };
  }
  setLinkHandlers() {
    let lastClickedBall = null;
    doc.canvas.onmousedown = (e) => {
      let p = cursorPoint(e);
      let ball = this.space.ballUnderPoint(p);
      if (ball === null || ball === lastClickedBall) {
        const link2 = this.space.linkUnderPoint(p);
        if (link2) {
          this.space.selLink = link2;
          this.view.drawAll();
          return;
        }
        return;
      }
      if (lastClickedBall === null) {
        lastClickedBall = ball;
        return;
      }
      const link = new Link(lastClickedBall, ball);
      this.space.addLink(link);
      this.space.selLink = link;
      lastClickedBall = null;
      this.view.drawAll();
    };
    doc.canvas.onmousemove = (e) => {
      this._mousePos = cursorPoint(e);
    };
    doc.canvas.onmouseup = (e) => {
    };
  }
  //#endregion  Mouse Handlers
  //#region Mode props`
  set timeMode(mode) {
    if (mode === 1 /* Play */ && this.intervalId === 0) {
      this.intervalId = setInterval(() => {
        this.step();
      }, glo.INTERVAL);
    } else {
      clearInterval(this.intervalId);
      this.intervalId = 0;
      this.view.showTimeAndEnergy();
    }
  }
  get timeMode() {
    return this.intervalId ? 1 /* Play */ : 0 /* Stop */;
  }
  set createMode(value) {
    this._createMode = value;
    if (value === 1 /* Ball */) {
      this.setBallHandlers();
    } else if (value === 2 /* Line */) {
      this.setLineHandlers();
    } else if (value === 3 /* Link */) {
      this.setLinkHandlers();
    }
  }
  get createMode() {
    return this._createMode;
  }
  //#endregion Mode props          
  setModelSize(w, h) {
    document.documentElement.style.setProperty("--canvas-width", w + "px");
    document.documentElement.style.setProperty("--canvas-height", h + "px");
    this.space.setSize(w, h);
    doc.canvas.height = h;
    doc.canvas.width = w;
    doc.canvas2.height = h;
    doc.canvas2.width = w;
    this.view.drawAll();
  }
  step() {
    glo.time++;
    this.space.balls.forEach((b) => b.move());
    this.space.collectDots();
    this.view.drawAll();
    if (glo.time % 10 === 0) {
      this.view.showTimeAndEnergy();
    }
  }
};

// src/main.ts
[glo.K, glo.W, glo.Wk, glo.Vis, glo.g] = getSpaceParams();
var space = new Space(...getSizeParams());
var view = new View(space);
new Controller(space, view);
view.drawAll();

