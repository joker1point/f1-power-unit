/* F1 Power Unit — 3D helpers, procedural textures & materials */
(function () {
  'use strict';
  const THREE = window.THREE;
  const PU = window.PU = {};
  const TE = PU.tex = {};
  const M = PU.M = {};

  /* ---------------- canvas textures ---------------- */
  function cnv(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  }
  function tex(canvas, rx, ry, srgb) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function castCanvas() {
    const s = 512, c = cnv(s), x = c.getContext('2d');
    x.fillStyle = '#b6bdc4'; x.fillRect(0, 0, s, s);
    const img = x.getImageData(0, 0, s, s), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - .5) * 26;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    x.putImageData(img, 0, 0);
    for (let i = 0; i < 60; i++) {
      const px = rnd(0, s), py = rnd(0, s), r = rnd(6, 52);
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(255,255,255,.05)');
      g.addColorStop(.6, 'rgba(90,98,106,.06)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.284); x.fill();
    }
    // faint sand-cast pitting
    x.fillStyle = 'rgba(70,78,86,.16)';
    for (let i = 0; i < 1400; i++) {
      x.beginPath(); x.arc(rnd(0, s), rnd(0, s), rnd(.4, 1.4), 0, 6.284); x.fill();
    }
    return c;
  }

  function brushCanvas() {
    const s = 512, c = cnv(s), x = c.getContext('2d');
    x.fillStyle = '#c3cad1'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const y = rnd(0, s), w = rnd(30, 260), a = rnd(.02, .09);
      x.strokeStyle = Math.random() > .5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(52,60,68,' + a + ')';
      x.lineWidth = rnd(.5, 1.4);
      x.beginPath(); x.moveTo(rnd(-40, s), y); x.lineTo(rnd(0, s + 60), y + rnd(-1, 1)); x.stroke();
    }
    return c;
  }

  function carbonCanvas() {
    const s = 512, c = cnv(s), x = c.getContext('2d');
    x.fillStyle = '#1b1e22'; x.fillRect(0, 0, s, s);
    const n = 16, cell = s / n;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const over = ((i + j) % 4) < 2;
        const g = x.createLinearGradient(i * cell, j * cell, (i + 1) * cell, (j + 1) * cell);
        if (over) {
          g.addColorStop(0, '#3a4046'); g.addColorStop(.45, '#565d64'); g.addColorStop(.55, '#31363b'); g.addColorStop(1, '#23272b');
        } else {
          g.addColorStop(0, '#23272b'); g.addColorStop(.45, '#3e444a'); g.addColorStop(.55, '#22262a'); g.addColorStop(1, '#191c1f');
        }
        x.fillStyle = g;
        x.fillRect(i * cell, j * cell, cell - .6, cell - .6);
        x.strokeStyle = 'rgba(0,0,0,.35)';
        x.lineWidth = .8;
        x.strokeRect(i * cell, j * cell, cell, cell);
      }
    }
    return c;
  }

  function wrapCanvas() {
    const s = 512, c = cnv(s), x = c.getContext('2d');
    x.fillStyle = '#a2a5a3'; x.fillRect(0, 0, s, s);
    for (let i = -s; i < s * 2; i += 11) {
      x.strokeStyle = 'rgba(255,255,255,.17)';
      x.lineWidth = 4.5;
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + s * .7, s); x.stroke();
      x.strokeStyle = 'rgba(58,62,60,.19)';
      x.lineWidth = 2;
      x.beginPath(); x.moveTo(i + 5, 0); x.lineTo(i + 5 + s * .7, s); x.stroke();
    }
    for (let y = 0; y < s; y += 9) {
      x.strokeStyle = 'rgba(65,68,66,.1)';
      x.lineWidth = 1;
      x.beginPath(); x.moveTo(0, y); x.lineTo(s, y + 3); x.stroke();
    }
    const img = x.getImageData(0, 0, s, s), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const nn = (Math.random() - .5) * 18;
      d[i] += nn; d[i + 1] += nn; d[i + 2] += nn;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  function foilCanvas() {
    const s = 256, c = cnv(s), x = c.getContext('2d');
    x.fillStyle = '#b08731'; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      x.strokeStyle = 'rgba(' + Math.round(rnd(120, 235)) + ',' + Math.round(rnd(90, 190)) + ',' + Math.round(rnd(30, 90)) + ',' + rnd(.08, .35) + ')';
      x.lineWidth = rnd(.6, 2.4);
      x.beginPath();
      let px = rnd(0, s), py = rnd(0, s);
      x.moveTo(px, py);
      for (let k = 0; k < 3; k++) { px += rnd(-22, 22); py += rnd(-22, 22); x.lineTo(px, py); }
      x.stroke();
    }
    return c;
  }

  function rubberCanvas() {
    const s = 128, c = cnv(s), x = c.getContext('2d');
    x.fillStyle = '#2a2d31'; x.fillRect(0, 0, s, s);
    const img = x.getImageData(0, 0, s, s), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - .5) * 20;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  /* ---------------- geometry helpers ---------------- */
  function roundedRect(w, h, r) {
    const s = new THREE.Shape();
    const x = w / 2, y = h / 2;
    r = Math.min(r, x, y);
    s.moveTo(-x + r, -y);
    s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r);
    s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y);
    s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r);
    s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
    return s;
  }

  // rounded box: w(x) h(y) d(z), corner radius r
  PU.rbox = function (w, h, d, r) {
    r = Math.min(r || .06, w / 2.001, h / 2.001, d / 2.001);
    const b = r;
    const shape = roundedRect(w - 2 * b, h - 2 * b, Math.max(r * .55, .002));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(d - 2 * b, .002),
      bevelEnabled: b > .004,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 2,
      curveSegments: 5,
      steps: 1
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  };

  PU.box = function (w, h, d) { return new THREE.BoxGeometry(w, h, d); };
  PU.cyl = function (r1, r2, h, seg, open) { return new THREE.CylinderGeometry(r1, r2, h, seg || 28, 1, !!open); };
  PU.disc = function (r, h, seg) { return new THREE.CylinderGeometry(r, r, h, seg || 32); };

  // lathe from [[radius, y], ...]
  PU.lathe = function (pts, seg) {
    return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 36);
  };

  PU.tube = function (pts, radius, tubular, radial) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    return new THREE.TubeGeometry(curve, tubular || 40, radius, radial || 12, false);
  };

  PU.gear = function (r, teeth, thick, hole) {
    const shape = new THREE.Shape();
    const tooth = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a0 = i * tooth, a1 = a0 + tooth * .36, a2 = a0 + tooth * .5, a3 = a0 + tooth * .86;
      const ro = r * 1.1, ri = r * .94;
      if (i === 0) shape.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
      shape.lineTo(Math.cos(a1) * ro, Math.sin(a1) * ro);
      shape.lineTo(Math.cos(a2) * ro, Math.sin(a2) * ro);
      shape.lineTo(Math.cos(a3) * ri, Math.sin(a3) * ri);
      shape.absarc(0, 0, ri, a3, a0 + tooth, false);
    }
    if (hole) {
      const h = new THREE.Path();
      h.absarc(0, 0, hole, 0, Math.PI * 2, true);
      shape.holes.push(h);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 20 });
    g.center();
    return g;
  };

  PU.mesh = function (geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };

  // hex bolts along a list of [x,y,z,scale?]
  PU.boltMesh = function (list, r, h, mat) {
    const geo = new THREE.CylinderGeometry(r, r * .96, h, 6);
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    list.forEach((b, i) => {
      p.set(b[0], b[1], b[2]);
      q.setFromEuler(new THREE.Euler(b[4] || 0, b[5] || 0, b[3] || 0));
      const sc = b[6] || 1;
      s.set(sc, sc, sc);
      m4.compose(p, q, s);
      im.setMatrixAt(i, m4);
    });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = true; im.receiveShadow = true;
    im.frustumCulled = false;
    return im;
  };

  /* ---------------- materials ---------------- */
  PU.initMaterials = function () {
    TE.cast = tex(castCanvas(), 3, 3, true);
    TE.castB = tex(castCanvas(), 3, 3, false);
    TE.brush = tex(brushCanvas(), 2, 2, true);
    TE.carbon = tex(carbonCanvas(), 1.25, 1.25, true);
    TE.wrap = tex(wrapCanvas(), 2, 2, true);
    TE.wrapB = tex(wrapCanvas(), 2, 2, false);
    TE.foil = tex(foilCanvas(), 3, 3, true);
    TE.rubber = tex(rubberCanvas(), 3, 3, true);

    M.cast = new THREE.MeshStandardMaterial({
      color: 0xaeb6be, map: TE.cast, bumpMap: TE.castB, bumpScale: .012,
      metalness: .72, roughness: .46, envMapIntensity: 1
    });
    M.castDark = new THREE.MeshStandardMaterial({
      color: 0x767e86, map: TE.cast, metalness: .62, roughness: .54, envMapIntensity: .85
    });
    M.castLight = new THREE.MeshStandardMaterial({
      color: 0xc0c8cf, map: TE.cast, metalness: .62, roughness: .42, envMapIntensity: 1.1
    });
    M.mag = new THREE.MeshStandardMaterial({
      color: 0x8d949b, map: TE.cast, metalness: .58, roughness: .56, envMapIntensity: .9
    });
    M.machined = new THREE.MeshStandardMaterial({
      color: 0xc4cbd2, map: TE.brush, bumpMap: TE.brush, bumpScale: .004,
      metalness: .92, roughness: .24, envMapIntensity: 1.4
    });
    M.lid = new THREE.MeshStandardMaterial({
      color: 0xb9c1c9, map: TE.brush, bumpMap: TE.brush, bumpScale: .005,
      metalness: .86, roughness: .3, envMapIntensity: 1.45
    });
    M.titan = new THREE.MeshStandardMaterial({
      color: 0x9aa2a9, metalness: .82, roughness: .38, envMapIntensity: 1.2
    });
    M.steel = new THREE.MeshStandardMaterial({
      color: 0x6f767d, metalness: .9, roughness: .32, envMapIntensity: 1.2
    });
    M.darkSteel = new THREE.MeshStandardMaterial({
      color: 0x3a4046, metalness: .85, roughness: .4, envMapIntensity: 1
    });
    M.carbon = new THREE.MeshPhysicalMaterial({
      color: 0x87929c, map: TE.carbon, bumpMap: TE.carbon, bumpScale: .012,
      metalness: .3, roughness: .32, clearcoat: .95, clearcoatRoughness: .14, envMapIntensity: 1.55
    });
    M.carbonMatte = new THREE.MeshStandardMaterial({
      color: 0x4a5158, map: TE.carbon, metalness: .18, roughness: .6, envMapIntensity: 1.1
    });
    M.wrap = new THREE.MeshStandardMaterial({
      color: 0x858884, map: TE.wrap, bumpMap: TE.wrapB, bumpScale: .03,
      metalness: .42, roughness: .92, envMapIntensity: .45
    });
    M.gold = new THREE.MeshStandardMaterial({
      color: 0x83601a, map: TE.foil, bumpMap: TE.foil, bumpScale: .012,
      metalness: .95, roughness: .45, envMapIntensity: 1.35, side: THREE.DoubleSide
    });
    M.inconel = new THREE.MeshStandardMaterial({
      color: 0x646b72, metalness: .88, roughness: .54, envMapIntensity: .95
    });
    M.heatTint = new THREE.MeshStandardMaterial({
      color: 0x6b5c48, metalness: .88, roughness: .48, envMapIntensity: 1
    });
    M.rubber = new THREE.MeshStandardMaterial({
      color: 0x2c3034, map: TE.rubber, metalness: .1, roughness: .88, envMapIntensity: .35
    });
    M.black = new THREE.MeshStandardMaterial({
      color: 0x23262a, metalness: .5, roughness: .54, envMapIntensity: .7
    });
    M.orange = new THREE.MeshStandardMaterial({
      color: 0xd2501c, metalness: .2, roughness: .55, emissive: 0x240700, emissiveIntensity: .4
    });
    M.red = new THREE.MeshStandardMaterial({
      color: 0xa52c1e, metalness: .1, roughness: .62
    });
    M.plug = new THREE.MeshStandardMaterial({
      color: 0x8c939a, metalness: .7, roughness: .4
    });
    M.valve = new THREE.MeshPhysicalMaterial({
      color: 0xd6dce3, metalness: 1, roughness: .1, clearcoat: .5, clearcoatRoughness: .1, envMapIntensity: 1.8
    });
    M.glass = new THREE.MeshPhysicalMaterial({
      color: 0x11161c, metalness: .1, roughness: .08, transparent: true, opacity: .5, envMapIntensity: 1.6
    });
    M.emissive = new THREE.MeshBasicMaterial({ color: 0xffb066 });

    // housing materials that x-ray / clipping are allowed to touch
    PU.shellMats = [M.cast, M.castDark, M.castLight, M.mag, M.carbon, M.carbonMatte, M.lid];
  };

  /* ---------------- studio environment ---------------- */
  PU.makeEnv = function (renderer) {
    const w = 1024, h = 512;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#171b20');
    g.addColorStop(.42, '#20252b');
    g.addColorStop(.52, '#2b3138');
    g.addColorStop(.56, '#0b0d10');
    g.addColorStop(.8, '#06070a');
    g.addColorStop(1, '#030405');
    x.fillStyle = g; x.fillRect(0, 0, w, h);

    function soft(cx, cy, rx, ry, alpha, tint) {
      x.save();
      x.translate(cx, cy); x.scale(rx, ry);
      const rg = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, 'rgba(' + tint + ',' + alpha + ')');
      rg.addColorStop(.55, 'rgba(' + tint + ',' + alpha * .38 + ')');
      rg.addColorStop(1, 'rgba(' + tint + ',0)');
      x.fillStyle = rg; x.beginPath(); x.arc(0, 0, 1, 0, 6.284); x.fill();
      x.restore();
    }
    // key softbox
    soft(w * .26, h * .3, 210, 92, 1, '255,252,246');
    soft(w * .8, h * .26, 120, 68, .75, '214,230,255');
    // side strips
    soft(w * .02, h * .46, 70, 150, .55, '236,242,255');
    soft(w * .98, h * .48, 66, 140, .4, '255,226,205');
    // floor bounce
    soft(w * .5, h * .66, 300, 56, .16, '255,244,228');
    soft(w * .5, h * .9, 340, 80, .06, '120,140,170');
    // horizon strip
    const hz = x.createLinearGradient(0, h * .5, 0, h * .58);
    hz.addColorStop(0, 'rgba(255,255,255,.12)');
    hz.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hz; x.fillRect(0, h * .5, w, h * .08);

    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(t).texture;
    pmrem.dispose();
    t.dispose();
    return env;
  };

  /* ---------------- misc ---------------- */
  PU.contactShadowTexture = function () {
    const s = 256, c = cnv(s), x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,.62)');
    g.addColorStop(.35, 'rgba(0,0,0,.32)');
    g.addColorStop(.7, 'rgba(0,0,0,.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  };

  PU.floorTexture = function () {
    const s = 512, c = cnv(s), x = c.getContext('2d');
    x.clearRect(0, 0, s, s);
    const g = x.createRadialGradient(s * .5, s * .46, s * .04, s * .5, s * .5, s * .52);
    g.addColorStop(0, 'rgba(25,29,35,1)');
    g.addColorStop(.30, 'rgba(17,20,25,1)');
    g.addColorStop(.60, 'rgba(8,10,13,.96)');
    g.addColorStop(.82, 'rgba(4,5,7,.62)');
    g.addColorStop(.93, 'rgba(3,4,5,.24)');
    g.addColorStop(1, 'rgba(2,3,4,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  PU.badgeTexture = function () {
    const w = 512, h = 192;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#23272c');
    g.addColorStop(.45, '#48505a');
    g.addColorStop(1, '#1c2024');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      x.strokeStyle = 'rgba(255,255,255,' + rnd(.015, .05) + ')';
      x.lineWidth = 1;
      const y = rnd(0, h);
      x.beginPath(); x.moveTo(rnd(0, w), y); x.lineTo(rnd(0, w), y); x.stroke();
    }
    x.strokeStyle = 'rgba(220,230,242,.55)';
    x.lineWidth = 3;
    x.strokeRect(7, 7, w - 14, h - 14);
    x.fillStyle = '#e8eef6';
    x.font = '700 86px Inter, Arial, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('V6', w / 2, h / 2 - 18);
    x.fillStyle = '#ff3b1f';
    x.fillRect(w / 2 - 34, h / 2 + 24, 68, 3);
    x.fillStyle = '#aab4c0';
    x.font = '500 25px Inter, Arial, sans-serif';
    x.fillText('1.6 TURBO HYBRID', w / 2, h / 2 + 55);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
})();
