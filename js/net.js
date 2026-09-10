'use strict';
function layer(i, o) {
  const l = { i, o,
    W: new Float64Array(i * o), b: new Float64Array(o),
    gW: new Float64Array(i * o), gB: new Float64Array(o),
    mW: new Float64Array(i * o), vW: new Float64Array(i * o),
    mB: new Float64Array(o), vB: new Float64Array(o) };
  const sd = Math.sqrt(2 / i);
  for (let k = 0; k < l.W.length; k++) l.W[k] = (Math.random() + Math.random() + Math.random() - 1.5) * sd;
  return l;
}
class DQN {
  constructor() { this.l1 = layer(IN, H1); this.l2 = layer(H1, H2); this.l3 = layer(H2, NA); this.t = 0; }
  forward(x, cache) {
    const c = cache || {};
    const { l1, l2, l3 } = this;
    c.x = x;
    c.z1 = new Float64Array(H1); c.a1 = new Float64Array(H1);
    for (let j = 0; j < H1; j++) {
      let s = l1.b[j];
      for (let i = 0; i < IN; i++) if (x[i]) s += x[i] * l1.W[i * H1 + j];   // x is sparse 0/1 → skip zeros
      c.z1[j] = s; c.a1[j] = s > 0 ? s : 0;
    }
    c.z2 = new Float64Array(H2); c.a2 = new Float64Array(H2);
    for (let j = 0; j < H2; j++) {
      let s = l2.b[j];
      for (let i = 0; i < H1; i++) s += c.a1[i] * l2.W[i * H2 + j];
      c.z2[j] = s; c.a2[j] = s > 0 ? s : 0;
    }
    c.q = new Float64Array(NA);
    for (let j = 0; j < NA; j++) {
      let s = l3.b[j];
      for (let i = 0; i < H2; i++) s += c.a2[i] * l3.W[i * NA + j];
      c.q[j] = s;
    }
    return c;
  }
  qValues(x) { return this.forward(x, null).q; }
  backward(c, dq) {                     // accumulate grads
    const { l1, l2, l3 } = this;
    for (let j = 0; j < NA; j++) {
      const d = dq[j]; if (!d) continue;
      l3.gB[j] += d;
      for (let i = 0; i < H2; i++) l3.gW[i * NA + j] += c.a2[i] * d;
    }
    const dz2 = new Float64Array(H2);
    for (let i = 0; i < H2; i++) {
      let s = 0; for (let j = 0; j < NA; j++) s += l3.W[i * NA + j] * dq[j];
      dz2[i] = c.z2[i] > 0 ? s : 0;
      l2.gB[i] += dz2[i];
    }
    for (let i = 0; i < H1; i++) {
      let s = 0; for (let j = 0; j < H2; j++) s += l2.W[i * H2 + j] * dz2[j];
      const dz1 = c.z1[i] > 0 ? s : 0;
      l1.gB[i] += dz1;
      if (dz1) for (let k = 0; k < IN; k++) if (c.x[k]) l1.gW[k * H1 + i] += c.x[k] * dz1;
    }
    for (let i = 0; i < H1; i++) if (c.a1[i])
      for (let j = 0; j < H2; j++) if (dz2[j]) l2.gW[i * H2 + j] += c.a1[i] * dz2[j];
  }
  adam(lr) {
    this.t++;
    const b1 = 0.9, b2 = 0.999, e = 1e-8;
    const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
    const step = (l, W, g, m, v) => {
      for (let k = 0; k < W.length; k++) {
        const gk = g[k]; if (!gk) { g[k] = 0; continue; }
        m[k] = b1 * m[k] + (1 - b1) * gk;
        v[k] = b2 * v[k] + (1 - b2) * gk * gk;
        W[k] -= lr * (m[k] / c1) / (Math.sqrt(v[k] / c2) + e);
        g[k] = 0;
      }
    };
    for (const l of [this.l1, this.l2, this.l3]) {
      step(l, l.W, l.gW, l.mW, l.vW); step(l, l.b, l.gB, l.mB, l.vB);
    }
  }
  copyFrom(o) {
    this.l1.W.set(o.l1.W); this.l1.b.set(o.l1.b);
    this.l2.W.set(o.l2.W); this.l2.b.set(o.l2.b);
    this.l3.W.set(o.l3.W); this.l3.b.set(o.l3.b);
  }
  serialize() {
    return { t: this.t,
      w1: Array.from(this.l1.W), b1: Array.from(this.l1.b),
      w2: Array.from(this.l2.W), b2: Array.from(this.l2.b),
      w3: Array.from(this.l3.W), b3: Array.from(this.l3.b) };
  }
  load(d) {
    this.l1.W.set(d.w1); this.l1.b.set(d.b1);
    this.l2.W.set(d.w2); this.l2.b.set(d.b2);
    this.l3.W.set(d.w3); this.l3.b.set(d.b3);
    this.t = d.t | 0;
  }
}
const online = new DQN(), target = new DQN();