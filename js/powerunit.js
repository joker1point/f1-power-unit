/* F1 Power Unit — procedural 90° V6, 1.6L single-turbo hybrid */
(function () {
  'use strict';
  const THREE = window.THREE;
  const PU = window.PU;
  const M = PU.M;
  const PI = Math.PI;
  const TAU = PI * 2;

  const CFG = {
    R: 1.0,          // crank radius
    ROD: 4.0,        // con-rod length
    BORE: 3.0,
    DECK: 6.1,       // bank-local deck height
    SP: 4.2,         // bore spacing
    ZS: [-4.2, 0, 4.2],
    PIN: [0, TAU / 3, TAU * 2 / 3],
    BANK: PI / 4
  };

  function mesh(parent, geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function grp(parent, name) {
    const g = new THREE.Group();
    if (name) g.name = name;
    parent.add(g);
    return g;
  }
  function cylZ(r, h, seg) {
    const g = new THREE.CylinderGeometry(r, r, h, seg || 32);
    g.rotateX(PI / 2);
    return g;
  }
  function latheZ(pts, seg) {
    const g = PU.lathe(pts, seg || 36);
    return g;
  }
  function tubeZ(points, r, t, rad) {
    return PU.tube(points, r, t || 40, rad || 12);
  }

  function buildPowerUnit() {
    const root = new THREE.Group();
    root.name = 'power-unit';
    const A = {
      root: root,
      cylinders: [],
      hotspots: [],
      fadeGroups: {},
      explodeGroups: [],
      fadeTargets: {},
      crank: null,
      gears: [],
      lights: [],
      stationHooks: {}
    };

    /* =========================================================
       0. main crankcase & lower end
       ========================================================= */
    const caseG = grp(root, 'crankcase');
    const caseShell = grp(caseG, 'case-shell');
    A.fadeGroups.case = caseShell;
    mesh(caseShell, PU.rbox(7.2, 3.5, 12.7, .34), M.mag, 0, .95, 0);
    /* Cutaway lining: the outer casting is one-sided, so sawing it open used to
       expose the *outside* skin lit from behind — a white cardboard interior.
       A slightly smaller back-side shell sits just inside it and catches the
       shadow instead, which is what a sawn casting looks like. */
    const linerMat = new THREE.MeshStandardMaterial({
      color: 0x2c3238, metalness: .45, roughness: .78, side: THREE.BackSide
    });
    PU.linerMat = linerMat;
    mesh(caseShell, PU.rbox(6.9, 3.2, 12.4, .3), linerMat, 0, .95, 0);
    // top deck shoulders
    mesh(caseShell, PU.rbox(3.6, 1.1, 12.2, .16), M.mag, 2.0, 2.55, 0).rotation.z = -.28;
    mesh(caseShell, PU.rbox(3.6, 1.1, 12.2, .16), M.mag, -2.0, 2.55, 0).rotation.z = .28;
    // side plates + flange
    for (const sx of [-1, 1]) {
      mesh(caseShell, PU.rbox(.16, 1.7, 11.9, .05), M.castDark, sx * 3.63, .85, 0);
      mesh(caseShell, PU.rbox(.26, .3, 12.2, .06), M.cast, sx * 3.66, 1.85, 0);
      mesh(caseShell, PU.rbox(.26, .3, 12.2, .06), M.cast, sx * 3.66, -.18, 0);
      // vertical ribs: they have to stand proud of the side plate or the
      // crankcase reads as one flat sheet of grey cardboard in close-up
      for (let i = 0; i < 8; i++) {
        mesh(caseShell, PU.rbox(.24, 2.3, .21, .05), M.mag, sx * 3.80, .72, -4.9 + i * 1.4);
      }
      // horizontal rails top and bottom of the rib field
      mesh(caseShell, PU.rbox(.2, .22, 11.6, .05), M.cast, sx * 3.79, 1.86, 0);
      mesh(caseShell, PU.rbox(.2, .22, 11.6, .05), M.cast, sx * 3.79, -.34, 0);
      // core plugs
      for (let i = 0; i < 5; i++) {
        const p = mesh(caseShell, cylZ(.3, .34, 20), M.cast, sx * 3.74, 1.2, -4.4 + i * 2.2);
        p.rotation.z = PI / 2;
        mesh(caseShell, new THREE.TorusGeometry(.31, .035, 8, 22), M.machined, sx * 3.92, 1.2, -4.4 + i * 2.2).rotation.y = PI / 2;
      }
      // sensor bosses
      mesh(caseShell, cylZ(.18, .28, 16), M.darkSteel, sx * 3.78, -.45, 2.8).rotation.z = PI / 2;
      // engine mount pad
      mesh(caseShell, PU.rbox(.34, .8, 2.2, .1), M.castDark, sx * 3.72, -.55, 4.2);
      // bolt row along the sump rail
      const rail = [];
      for (let i = 0; i < 7; i++) rail.push([sx * 3.80, -.86, -5.4 + i * 1.8, PI / 2, 0, 0]);
      caseShell.add(PU.boltMesh(rail, .1, .1, M.machined));
    }
    // sump flange + oil pan
    mesh(caseShell, PU.rbox(6.4, .34, 12.0, .12), M.cast, 0, -.95, 0);
    const panG = grp(root, 'oil-pan');
    mesh(panG, PU.rbox(5.4, 1.9, 11.2, .28), M.mag, 0, -2.0, 0);
    mesh(panG, PU.rbox(5.1, 1.6, 10.8, .24), PU.linerMat, 0, -2.0, 0);
    mesh(panG, PU.rbox(4.2, .28, 10.2, .1), M.castDark, 0, -3.0, 0);
    mesh(panG, PU.rbox(5.0, .5, 11.0, .12), M.cast, 0, -1.08, 0);
    for (let i = 0; i < 6; i++) {
      mesh(panG, PU.rbox(5.5, .16, .28, .05), M.mag, 0, -1.9, -4.6 + i * 1.85);
    }
    // vertical stiffeners: the sump sides are the largest unbroken surface on
    // the whole unit, so they need cast structure or they read as a grey box
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        mesh(panG, PU.rbox(.16, 1.5, .2, .04), M.cast, sx * 2.74, -2.0, -4.4 + i * 1.47);
      }
    }
    mesh(panG, PU.rbox(4.9, .1, 10.6, .04), M.mag, 0, -3.18, 0);
    mesh(panG, PU.rbox(.5, .9, 3.0, .12), M.castDark, 2.1, -1.7, 2.6);
    mesh(panG, cylZ(.16, .36, 16), M.machined, -1.5, -3.12, -3.4).rotation.x = 0;
    mesh(panG, PU.rbox(1.0, .1, 2.0, .04), M.gold, -2.4, -2.15, 1.2).rotation.y = PI / 2;
    A.fadeGroups.pan = panG;
    A.explodeGroups.push({ g: panG, dir: new THREE.Vector3(0, -1, 0), dist: 4.2 });

    // rear bell housing
    const clutchG = grp(root, 'clutch');
    const bell = mesh(clutchG, new THREE.CylinderGeometry(3.0, 3.0, 1.15, 48, 1, true), M.castDark, 0, 0, 6.25);
    bell.rotation.x = PI / 2; bell.material.side = THREE.DoubleSide;
    mesh(clutchG, new THREE.TorusGeometry(3.0, .12, 10, 48), M.cast, 0, 0, 6.82).rotation.x = 0;
    mesh(clutchG, PU.rbox(6.2, .3, 1.5, .1), M.mag, 0, 2.55, 6.1);
    const fly = grp(clutchG, 'flywheel');
    mesh(fly, PU.disc(2.55, .22, 48), M.darkSteel, 0, 0, 5.95).rotation.x = PI / 2;
    for (let i = 0; i < 5; i++) {
      mesh(fly, PU.disc(1.95, .1, 40), M.machined, 0, 0, 6.18 + i * .15).rotation.x = PI / 2;
      mesh(fly, PU.disc(1.15, .13, 28), M.darkSteel, 0, 0, 6.22 + i * .15).rotation.x = PI / 2;
    }
    mesh(fly, PU.disc(2.1, .16, 40), M.castDark, 0, 0, 6.98).rotation.x = PI / 2;
    mesh(fly, PU.disc(.85, .4, 28), M.machined, 0, 0, 7.18).rotation.x = PI / 2;
    mesh(fly, PU.gear(2.34, 62, .13, 1.62, .975), M.steel, 0, 0, 7.04);
    mesh(fly, PU.disc(.34, .5, 18), M.machined, 0, 0, 7.32).rotation.x = PI / 2;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      mesh(fly, PU.disc(.08, .18, 8), M.steel, Math.cos(a) * 2.25, Math.sin(a) * 2.25, 6.0).rotation.x = PI / 2;
    }
    // rear closure plate: an open bell housing lets you stare straight into the
    // clutch pack from behind, and the bare flywheel then eats the whole frame
    const clutchCover = grp(root, 'clutch-cover');
    mesh(clutchCover, PU.lathe([[0, 0], [2.2, .02], [2.86, .1], [2.94, .22], [2.8, .3], [0, .32]], 48), M.cast, 0, 0, 7.62).rotation.x = -PI / 2;
    mesh(clutchCover, new THREE.TorusGeometry(2.86, .09, 10, 48), M.castDark, 0, 0, 7.82).rotation.x = 0;
    mesh(clutchCover, new THREE.TorusGeometry(2.05, .05, 8, 44), M.castDark, 0, 0, 7.86).rotation.x = 0;
    mesh(clutchCover, PU.disc(.42, .26, 20), M.machined, 0, 0, 7.88).rotation.x = PI / 2;
    mesh(clutchCover, PU.disc(.62, .06, 20), M.darkSteel, 0, 0, 7.99).rotation.x = PI / 2;
    const cb = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      cb.push([Math.cos(a) * 2.62, Math.sin(a) * 2.62, 7.94, 0, PI / 2, 0]);
    }
    clutchCover.add(PU.boltMesh(cb, .09, .12, M.machined));
    A.fadeGroups.clutchCover = clutchCover;
    A.explodeGroups.push({ g: clutchCover, dir: new THREE.Vector3(0, 0, 1), dist: 4.8 });
    A.fadeGroups.clutch = clutchG;
    A.explodeGroups.push({ g: clutchG, dir: new THREE.Vector3(0, .15, 1), dist: 3.3 });

    /* =========================================================
       1. crankshaft
       ========================================================= */
    const crankG = grp(root, 'crankshaft');
    A.crank = crankG;
    mesh(crankG, cylZ(.62, 12.6, 28), M.machined, 0, 0, 0);
    for (const z of [-5.75, -2.1, 2.1, 5.75]) {
      mesh(crankG, PU.disc(.85, .34, 32), M.machined, 0, 0, z).rotation.x = PI / 2;
    }
    CFG.ZS.forEach((z, i) => {
      const phase = CFG.PIN[i];
      const pin = grp(crankG, 'throw-' + i);
      pin.rotation.z = -phase;
      mesh(pin, cylZ(.44, 1.7, 22), M.machined, 0, CFG.R, z);
      // webs + counterweights
      for (const dz of [-.62, .62]) {
        const web = grp(pin);
        web.position.set(0, 0, z + dz);
        const d = mesh(web, PU.disc(1.05, .22, 34), M.machined);
        d.rotation.x = PI / 2;
        // solid half-disc: an open-ended half cylinder left two raw edges that
        // read as thin blades poking out of the crankcase in the cutaway
        if (!PU.cwGeo) {
          const hs = new THREE.Shape();
          hs.absarc(0, 0, 1.42, 0, PI, false);
          hs.lineTo(-1.42, 0);
          hs.closePath();
          PU.cwGeo = new THREE.ExtrudeGeometry(hs, { depth: .24, bevelEnabled: false, curveSegments: 26 });
          PU.cwGeo.center();
        }
        const cw = mesh(web, PU.cwGeo, M.machined);
        cw.rotation.x = PI / 2; cw.rotation.z = PI; cw.position.y = -.1;
        mesh(web, PU.disc(.44, .24, 20), M.darkSteel, 0, CFG.R, 0).rotation.x = PI / 2;
      }
      // rod journal end caps
      mesh(pin, PU.disc(.5, .12, 22), M.steel, 0, CFG.R, z - .95).rotation.x = PI / 2;
      mesh(pin, PU.disc(.5, .12, 22), M.steel, 0, CFG.R, z + .95).rotation.x = PI / 2;
    });
    // front snout / damper: kept in its own group so the timing station can
    // fade the pulley away instead of staring at a chrome disc
    const snout = grp(crankG, 'snout');
    mesh(snout, PU.disc(1.5, .4, 36), M.machined, 0, 0, -6.55).rotation.x = PI / 2;
    mesh(snout, PU.disc(1.15, .28, 30), M.castDark, 0, 0, -6.82).rotation.x = PI / 2;
    mesh(snout, PU.disc(.55, .5, 24), M.machined, 0, 0, -7.05).rotation.x = PI / 2;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      mesh(snout, PU.disc(.07, .14, 6), M.steel, Math.cos(a) * .95, Math.sin(a) * .95, -6.35).rotation.x = PI / 2;
    }
    A.fadeGroups.snout = snout;
    A.fadeGroups.crank = null;
    A.explodeGroups.push({ g: crankG, dir: new THREE.Vector3(0, -1, 0), dist: 2.4 });

    /* =========================================================
       2. banks, heads, valve train
       ========================================================= */
    const timing = grp(root, 'timing');
    A.timing = timing;

    for (let b = 0; b < 2; b++) {
      const sign = b === 0 ? 1 : -1;         // +1 = right (+X) bank
      const bankAngle = sign * CFG.BANK;
      const bank = grp(root, 'bank-' + b);
      bank.rotation.z = -bankAngle;

      const shell = grp(bank, 'block-shell');
      const head = grp(bank, 'head');
      const cover = grp(bank, 'cam-cover');
      const valvesG = grp(bank, 'valves');
      const camsG = grp(bank, 'cams');

      const outerX = sign * 1.62, innerX = -sign * 1.62;
      const inner = -sign;                    // valley direction in local x

      // ---- block shell ----
      mesh(shell, PU.rbox(3.4, .34, 11.9, .06), M.cast, 0, CFG.DECK, 0);
      mesh(shell, PU.rbox(3.2, 2.5, 11.6, .1), PU.linerMat, 0, 4.62, 0);
      mesh(shell, PU.rbox(.34, 2.55, 11.75, .1), M.cast, outerX, 4.62, 0);
      mesh(shell, PU.rbox(.3, 2.2, 11.75, .08), M.cast, innerX, 4.82, 0);
      for (const z of [-5.78, 5.78]) {
        mesh(shell, PU.rbox(3.3, 2.6, .32, .08), M.cast, 0, 4.6, z);
      }
      mesh(shell, PU.rbox(3.55, .3, 11.95, .06), M.castDark, 0, 3.3, 0);
      // liners
      CFG.ZS.forEach((z, i) => {
        const liner = mesh(shell, new THREE.CylinderGeometry(1.48, 1.48, 2.9, 32, 1, true), M.castLight, 0, 4.65, z);
        liner.material = M.castLight;
        mesh(shell, new THREE.TorusGeometry(1.52, .07, 8, 32), M.castDark, 0, 6.02, z).rotation.x = PI / 2;
        // water jacket ribs
        for (let k = 0; k < 4; k++) {
          const a = k / 4 * TAU + .4;
          mesh(shell, PU.rbox(.16, 2.5, .18, .03), M.cast, Math.cos(a) * 1.5, 4.55, z + Math.sin(a) * 1.5);
        }
      });
      // outer ribs + bolt flange (kept proud of the wall: flush ribs vanish)
      // NB: offsets must run along +sign x, or the inward bank swallows them
      for (let i = 0; i < 7; i++) {
        mesh(shell, PU.rbox(.26, 2.25, .24, .05), M.cast, outerX + sign * .24, 4.55, -5.0 + i * 1.55);
      }
      mesh(shell, PU.rbox(.44, .26, 11.9, .05), M.castDark, outerX + sign * .2, 3.42, 0);
      mesh(shell, PU.rbox(.42, .22, 11.9, .05), M.castDark, outerX + sign * .18, 5.98, 0);
      // block bolts
      const bl = [];
      for (let i = 0; i < 10; i++) bl.push([outerX + sign * .26, 3.38, -5.4 + i * 1.2, 0, 0, PI / 2]);
      shell.add(PU.boltMesh(bl, .13, .18, M.steel));
      // casting marks / core plugs
      for (let i = 0; i < 3; i++) {
        mesh(shell, PU.disc(.3, .12, 20), M.castDark, outerX + sign * .22, 4.9, -3.0 + i * 3.0).rotation.z = PI / 2;
      }

      // ---- head ----
      mesh(head, PU.rbox(3.42, .1, 11.8, .02), M.darkSteel, 0, 6.24, 0);
      mesh(head, PU.rbox(3.2, 1.5, 11.5, .12), PU.linerMat, 0, 7.06, 0);
      mesh(head, PU.rbox(3.4, 1.62, 11.7, .14), M.cast, 0, 7.06, 0);
      // combustion chamber bumps on top? valleys between cam carriers
      mesh(head, PU.rbox(3.15, .18, 11.5, .05), M.castDark, 0, 7.93, 0);
      // ribs
      for (let i = 0; i < 6; i++) {
        mesh(head, PU.rbox(.22, 1.25, .22, .04), M.cast, outerX + sign * .16, 7.1, -4.5 + i * 1.7);
      }
      // intake port stubs on valley side
      CFG.ZS.forEach((z) => {
        const p = mesh(head, cylZ(.42, .55, 20), M.castLight, sign * 1.78, 7.0, z);
        p.rotation.z = PI / 2;
      });
      // exhaust port stubs
      CFG.ZS.forEach((z) => {
        const p = mesh(head, cylZ(.4, .5, 20), M.heatTint, outerX + sign * .2, 6.6, z);
        p.rotation.z = PI / 2;
      });
      // head bolts
      const hl = [];
      for (let i = 0; i < 11; i++) hl.push([outerX + sign * .02, 6.34, -5.4 + i * 1.05, 0, 0, PI / 2]);
      for (let i = 0; i < 11; i++) hl.push([innerX - sign * .02, 6.34, -5.4 + i * 1.05, 0, 0, PI / 2]);
      head.add(PU.boltMesh(hl, .1, .16, M.machined));

      // ---- cam cover ----
      mesh(cover, PU.rbox(3.3, 1.32, 11.5, .2), M.castDark, 0, 8.62, 0);
      mesh(cover, PU.rbox(3.36, .07, 11.56, .03), M.black, 0, 7.96, 0);
      mesh(cover, PU.rbox(1.15, .42, 10.9, .18), M.cast, 0, 9.3, 0);
      mesh(cover, PU.rbox(.06, .09, 10.6, .02), M.black, .63, 9.3, 0);
      mesh(cover, PU.rbox(.06, .09, 10.6, .02), M.black, -.63, 9.3, 0);
      // polished longitudinal strips + shadow ribs (proud of the lid, not flush)
      for (const sx of [-1, 1]) {
        mesh(cover, PU.rbox(.16, .09, 10.7, .02), M.machined, sx * 1.18, 9.315, 0);
        mesh(cover, PU.rbox(.09, .07, 10.2, .02), M.black, sx * 1.44, 9.3, 0);
      }
      for (let i = 0; i < 7; i++) {
        mesh(cover, PU.rbox(2.1, .1, .26, .04), M.castDark, 0, 9.3, -4.8 + i * 1.55);
      }
      // top bolt rows
      const ct = [];
      for (let i = 0; i < 7; i++) {
        ct.push([1.25, 9.33, -4.6 + i * 1.5, 0, 0, 0]);
        ct.push([-1.25, 9.33, -4.6 + i * 1.5, 0, 0, 0]);
      }
      cover.add(PU.boltMesh(ct, .09, .08, M.darkSteel));
      // cover fittings + braided jumpers
      for (const fz of [-3.4, 3.6]) {
        const fit = mesh(cover, cylZ(.09, .26, 10), fz < 0 ? M.red : M.orange, sign * 1.62, 8.72, fz);
        fit.rotation.z = PI / 2;
        mesh(cover, PU.disc(.16, .14, 6), M.machined, sign * 1.55, 8.72, fz).rotation.z = PI / 2;
        mesh(cover, tubeZ([[sign * 1.75, 8.72, fz], [sign * 1.9, 8.55, fz + .3], [sign * 1.95, 8.2, fz + .6]], .055, 14, 7), M.rubber);
      }
      // outer flank ribs: this is the largest surface the 3/4 hero view sees
      for (let i = 0; i < 8; i++) {
        mesh(cover, PU.rbox(.16, 1.0, .2, .04), M.cast, sign * 1.7, 8.6, -5.0 + i * 1.45);
      }
      mesh(cover, PU.rbox(.18, .2, 11.2, .05), M.cast, sign * 1.68, 9.02, 0);
      mesh(cover, PU.rbox(.18, .2, 11.2, .05), M.cast, sign * 1.68, 8.18, 0);
      // gold heat shield on exhaust side of head
      mesh(head, PU.rbox(.14, .78, 4.32, .05), M.gold, outerX + sign * .1, 6.45, -1.6);
      mesh(head, PU.rbox(.14, .58, 1.52, .05), M.gold, outerX + sign * .12, 6.3, 3.6);
      const shb = [];
      for (let i = 0; i < 5; i++) shb.push([outerX + sign * .19, 6.45, -3.2 + i * .8, 0, 0, PI / 2]);
      for (let i = 0; i < 2; i++) shb.push([outerX + sign * .22, 6.3, 3.2 + i * .8, 0, 0, PI / 2]);
      head.add(PU.boltMesh(shb, .07, .08, M.machined));
      const cl = [];
      for (let i = 0; i < 9; i++) {
        cl.push([1.42 * sign, 9.02, -5.0 + i * 1.25, 0, 0, PI / 2]);
        cl.push([-1.42 * sign, 9.02, -5.0 + i * 1.25, 0, 0, PI / 2]);
      }
      cover.add(PU.boltMesh(cl, .11, .14, M.machined));
      // oil filler + breather
      mesh(cover, PU.cyl(.24, .27, .3, 20), M.castDark, .72 * sign, 9.38, -4.7);
      const cap = mesh(cover, PU.disc(.34, .2, 22), M.machined, .72 * sign, 9.6, -4.7);
      mesh(cap, new THREE.TorusGeometry(.35, .04, 6, 22), M.cast, 0, 0, 0).rotation.x = PI / 2;
      mesh(cap, new THREE.TorusGeometry(.2, .025, 5, 18), M.black, 0, .1, 0).rotation.x = PI / 2;
      mesh(cover, cylZ(.17, .55, 14), M.darkSteel, -.85 * sign, 9.22, -4.4);
      mesh(cover, cylZ(.13, .7, 12), M.black, -.85 * sign, 9.22, 4.5);
      mesh(cover, tubeZ([
        [-.85 * sign, 9.22, 4.6], [-.95 * sign, 9.05, 5.0], [-1.2 * sign, 8.7, 5.2], [-1.3 * sign, 8.2, 5.0]
      ], .07, 22, 8), M.rubber);
      mesh(cover, tubeZ([
        [-.85 * sign, 9.22, -4.5], [-.95 * sign, 9.4, -5.0], [-.9 * sign, 9.55, -5.3]
      ], .06, 18, 8), M.rubber);
      // cam position sensor
      mesh(cover, cylZ(.11, .32, 12), M.darkSteel, .95 * sign, 8.72, -5.82);
      mesh(cover, PU.rbox(.24, .2, .22, .04), M.black, .95 * sign, 8.72, -6.02);
      mesh(cover, tubeZ([[.95 * sign, 8.72, -6.0], [.8 * sign, 8.95, -5.6], [.5 * sign, 9.2, -5.2]], .035, 14, 6), M.black);
      // ignition coils
      CFG.ZS.forEach((z) => {
        mesh(cover, PU.rbox(.36, .16, .4, .05), M.darkSteel, -.42 * sign, 9.26, z);
        const c = mesh(cover, PU.cyl(.15, .13, .5, 16), M.black, -.42 * sign, 9.55, z);
        mesh(c, PU.disc(.115, .16, 12), M.orange, 0, -.27, 0);
        mesh(cover, PU.rbox(.28, .22, .3, .04), M.black, -.42 * sign, 9.85, z);
        mesh(cover, new THREE.TorusGeometry(.15, .025, 6, 16), M.orange, -.42 * sign, 9.78, z).rotation.x = PI / 2;
        mesh(cover, tubeZ([
          [-.42 * sign, 9.86, z], [-.62 * sign, 9.8, z + .2], [-.8 * sign, 9.62, z + .35], [-.95 * sign, 9.4, z + .5]
        ], .035, 16, 6), M.black);
      });

      // ---- camshafts ----
      const cams = [];
      const lobeGeo = (() => {
        const s = new THREE.Shape();
        const N = 56;
        for (let i = 0; i <= N; i++) {
          const a = i / N * TAU;
          const nose = Math.pow(Math.max(0, Math.cos(a)), 2.4);
          const r = .33 + .3 * nose;
          const x = Math.sin(a) * r, y = Math.cos(a) * r;
          if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
        }
        const g = new THREE.ExtrudeGeometry(s, { depth: .19, bevelEnabled: false, curveSegments: 4 });
        g.translate(0, 0, -.095);
        return g;
      })();
      [
        { x: -sign * .95, kind: 'in', phase: 0 },
        { x: sign * .95, kind: 'ex', phase: PI * .92 }
      ].forEach((cd) => {
        const shaft = grp(camsG, 'cam-' + cd.kind);
        shaft.position.set(cd.x, 8.42, 0);
        mesh(shaft, cylZ(.16, 11.2, 18), M.machined, 0, 0, 0);
        for (let i = 0; i < 4; i++) {
          mesh(shaft, PU.disc(.24, .28, 18), M.machined, 0, 0, -5.3 + i * 3.5).rotation.x = PI / 2;
        }
        CFG.ZS.forEach((z, ci) => {
          const ph = CFG.PIN[ci] / 2 + cd.phase;
          for (const dz of [-.42, .42]) {
            const lobe = mesh(shaft, lobeGeo, M.machined, 0, 0, z + dz);
            lobe.rotation.z = ph;
          }
        });
        cams.push({ group: shaft, phase: cd.phase, kind: cd.kind });
        // cam carrier rails + bearing caps
        mesh(head, PU.rbox(.5, .16, 11.1, .04), M.castDark, cd.x, 7.99, 0);
        [-5.0, -1.8, 1.6, 5.0].forEach((cz) => {
          mesh(camsG, PU.rbox(.78, .26, .38, .05), M.cast, cd.x, 8.6, cz);
          mesh(camsG, PU.disc(.08, .1, 8), M.darkSteel, cd.x - .28, 8.75, cz);
          mesh(camsG, PU.disc(.08, .1, 8), M.darkSteel, cd.x + .28, 8.75, cz);
        });
      });

      // ---- 12 valves (2 in + 2 ex per cylinder) ----
      const valveMeshes = [];
      const valveGeo = (() => {
        const stem = new THREE.CylinderGeometry(.065, .065, 1.8, 10);
        stem.translate(0, -.9, 0);
        return stem;
      })();
      const headGeo = new THREE.ConeGeometry(.4, .22, 22);
      headGeo.rotateX(PI);
      const bucketGeo = new THREE.CylinderGeometry(.23, .23, .16, 18);
      CFG.ZS.forEach((z, ci) => {
        [-.4, .4].forEach((dz) => {
          // intake
          const vin = grp(valvesG);
          vin.position.set(-sign * .58, 8.02, z + dz);
          mesh(vin, valveGeo, M.valve, 0, 0, 0);
          mesh(vin, headGeo, M.valve, 0, -1.8, 0);
          mesh(vin, bucketGeo, M.machined, 0, .02, 0);
          vin.userData = { kind: 'in', ci: ci, baseY: 8.02, phase: CFG.PIN[ci] / 2 };
          valveMeshes.push(vin);
          // exhaust
          const vex = grp(valvesG);
          vex.position.set(sign * .58, 8.02, z + dz);
          mesh(vex, valveGeo, M.valve, 0, 0, 0);
          mesh(vex, headGeo, M.valve, 0, -1.8, 0);
          mesh(vex, bucketGeo, M.machined, 0, .02, 0);
          vex.userData = { kind: 'ex', ci: ci, baseY: 8.02, phase: CFG.PIN[ci] / 2 + PI * .92 };
          valveMeshes.push(vex);
        });
      });
      // valve springs replaced by pneumatic cylinders (visual)
      CFG.ZS.forEach((z, ci) => {
        [-.4, .4].forEach((dz) => {
          [ -sign * .58, sign * .58 ].forEach((vx) => {
            mesh(valvesG, new THREE.TorusGeometry(.16, .03, 6, 16), M.darkSteel, vx, 7.98, z + dz).rotation.x = PI / 2;
          });
        });
      });

      // ---- external details on bank ----
      // pre-chamber / spark plug bosses
      CFG.ZS.forEach((z) => {
        mesh(head, PU.cyl(.17, .12, .5, 12), M.castDark, 0, 8.0, z);
        mesh(head, PU.disc(.12, .08, 10), M.gold, 0, 8.27, z);
      });
      // fuel rail + injectors
      const rail = mesh(bank, cylZ(.13, 10.4, 12), M.machined, innerX * .82, 7.55, 0);
      CFG.ZS.forEach((z) => {
        const inj = mesh(bank, PU.cyl(.13, .05, .55, 14), M.darkSteel, innerX * .82, 7.18, z);
        mesh(inj, PU.disc(.09, .1, 10), M.orange, 0, -.32, 0);
        mesh(bank, PU.cyl(.16, .16, .28, 12), M.castDark, innerX * .82, 7.3, z);
      });
      mesh(bank, cylZ(.1, .9, 10), M.black, innerX * .82, 7.55, -5.4);
      // harness
      mesh(bank, tubeZ([
        [innerX * .55, 8.15, -5.6], [innerX * .4, 8.28, -2.8], [innerX * .45, 8.28, 0],
        [innerX * .4, 8.24, 2.8], [innerX * .55, 8.12, 5.5]
      ], .07, 30, 8), M.black);
      // AN fittings on outer side
      [-3.7, 0.4, 4.6].forEach((z, i) => {
        const f = mesh(bank, cylZ(.1, .34, 10), i === 1 ? M.orange : M.red, outerX + sign * .28, 5.35, z);
        f.rotation.z = PI / 2;
        mesh(bank, PU.disc(.18, .16, 6), M.machined, outerX + sign * .18, 5.35, z).rotation.z = PI / 2;
      });

      /* ---- pistons, rods ---- */
      const pistonGeo = (() => {
        const g = new THREE.CylinderGeometry(1.355, 1.355, .95, 36);
        g.translate(0, .3, 0);
        return g;
      })();
      const crownGeo = new THREE.CylinderGeometry(1.36, 1.36, .16, 36);
      crownGeo.translate(0, .8, 0);
      const ringGeo = new THREE.TorusGeometry(1.34, .028, 6, 36);
      ringGeo.rotateX(PI / 2);

      CFG.ZS.forEach((z, ci) => {
        const cyl = { bank: b, sign: sign, z: z, phase: CFG.PIN[ci], index: ci };
        // piston
        const pg = grp(bank, 'piston');
        mesh(pg, pistonGeo, M.machined, 0, 0, 0);
        mesh(pg, crownGeo, M.castDark, 0, 0, 0);
        mesh(pg, ringGeo, M.darkSteel, 0, .52, 0);
        mesh(pg, ringGeo, M.darkSteel, 0, .64, 0);
        mesh(pg, ringGeo, M.steel, 0, .73, 0);
        // pin bore
        mesh(pg, cylZ(.35, .5, 18), M.darkSteel, 0, .18, 0).rotation.z = 0;
        mesh(pg, cylZ(.14, 1.7, 12), M.steel, 0, .18, 0).rotation.z = PI / 2;
        cyl.piston = pg;

        // rod
        const rg = grp(bank, 'rod');
        const L = CFG.ROD;
        mesh(rg, PU.rbox(.3, L * .84, .52, .12), M.titan, 0, L / 2, 0);
        mesh(rg, new THREE.TorusGeometry(.5, .16, 10, 24), M.titan, 0, 0, 0);
        mesh(rg, new THREE.TorusGeometry(.34, .1, 8, 20), M.titan, 0, L, 0);
        mesh(rg, PU.rbox(.14, L * .6, .56, .04), M.machined, 0, L / 2, 0);
        mesh(rg, PU.disc(.56, .16, 22), M.steel, 0, 0, .18).rotation.x = PI / 2;
        cyl.rod = rg;
        cyl.rodOffset = (b === 0 ? -.33 : .33);
        cyl.rodLen = L;

        A.cylinders.push(cyl);
      });

      // fade groups
      A.fadeGroups['block' + (b === 0 ? 'R' : 'L')] = shell;
      A.fadeGroups['head' + (b === 0 ? 'R' : 'L')] = head;
      A.fadeGroups['cover' + (b === 0 ? 'R' : 'L')] = cover;
      A.fadeGroups['cams' + (b === 0 ? 'R' : 'L')] = camsG;
      A.fadeGroups['valves' + (b === 0 ? 'R' : 'L')] = valvesG;

      // explode offsets (bank-local): the layers have to clear each other by
      // more than their own thickness or the stack still reads as one block
      A.explodeGroups.push(
        { g: cover, dir: new THREE.Vector3(0, 1, 0), dist: 2.9 },
        { g: head, dir: new THREE.Vector3(0, 1, 0), dist: 1.6 },
        { g: camsG, dir: new THREE.Vector3(0, 1, 0), dist: 2.2 },
        { g: valvesG, dir: new THREE.Vector3(0, 1, 0), dist: 1.1 },
        { g: shell, dir: new THREE.Vector3(0, -1, 0), dist: .5 },
        { g: bank, dir: new THREE.Vector3(sign * 1, -.12, 0), dist: 2.2, vertical: false }
      );

      // hotspots anchors
      const anc = (parent, x, y, z) => {
        const o = new THREE.Object3D();
        o.position.set(x, y, z);
        parent.add(o);
        return o;
      };
      // stored after all banks; push per bank
      A['bank' + b] = { group: bank, sign: sign, shell: shell, head: head, cover: cover, valves: valvesG, cams: camsG };
    }

    /* =========================================================
       3. intake — carbon plenum, six stacks, port pipes
       ========================================================= */
    const intakeG = grp(root, 'intake');
    const plenum = grp(intakeG, 'plenum');
    A.fadeGroups.plenum = plenum;
    mesh(plenum, PU.rbox(6.2, 2.2, 11.3, .72), M.carbonPlate, 0, 8.9, 0);
    mesh(plenum, PU.rbox(4.1, .5, 10.2, .24), M.lid, 0, 10.0, .1);
    mesh(plenum, PU.rbox(4.14, .14, 10.24, .05), M.carbonPlate, 0, 10.23, .1);
    // raised centre rib + fasteners on the lid
    mesh(plenum, PU.rbox(.9, .1, 9.2, .14), M.black, 0, 10.29, .1);
    for (const sx of [-1, 1]) {
      mesh(plenum, PU.rbox(.06, .035, 9.1, .015), M.machined, sx * .45, 10.28, .1);
    }
    const lidBolts = [];
    for (let i = 0; i < 6; i++) {
      for (const sx of [-1, 1]) lidBolts.push([sx * 1.72, 10.31, -4.1 + i * 1.68]);
    }
    plenum.add(PU.boltMesh(lidBolts, .075, .11, M.darkSteel));
    mesh(plenum, PU.rbox(6.24, .12, 11.34, .04), M.black, 0, 7.83, 0);
    // ribs on plenum shoulder
    for (let i = 0; i < 7; i++) {
      mesh(plenum, PU.rbox(6.1, .12, .16, .05), M.carbonMatte, 0, 8.76, -4.4 + i * 1.45);
    }
    // end caps + front snout
    mesh(plenum, cylZ(1.15, .55, 28), M.carbon, 0, 8.95, -5.75);
    mesh(plenum, new THREE.TorusGeometry(1.15, .12, 10, 30), M.carbonMatte, 0, 8.95, -5.95);
    mesh(plenum, cylZ(.85, .9, 24), M.carbon, 0, 8.95, 5.92);
    mesh(plenum, PU.rbox(2.7, 1.2, .35, .14), M.carbonPlate, 0, 8.9, -5.5);
    // plenum mounts
    for (const z of [-4.2, 0, 4.2]) {
      mesh(plenum, PU.rbox(.3, .9, .3, .06), M.castDark, 1.5, 7.85, z);
      mesh(plenum, PU.rbox(.3, .9, .3, .06), M.castDark, -1.5, 7.85, z);
    }
    A.explodeGroups.push({ g: plenum, dir: new THREE.Vector3(0, 1, 0), dist: 3.4 });

    const stacksG = grp(intakeG, 'stacks');
    A.fadeGroups.stacks = stacksG;
    const stackGeo = (() => {
      const pts = [[.44, 0], [.5, .18], [.46, .55], [.5, 1.15], [.62, 1.62], [.86, 1.92], [.92, 2.02], [.8, 1.96], [.58, 1.72], [.46, 1.3], [.43, .6], [.4, 0]];
      return PU.lathe(pts, 40);
    })();
    const stackList = [];
    [-1, 1].forEach((bx) => {
      CFG.ZS.forEach((z, i) => {
        const st = grp(stacksG);
        st.position.set(bx * 1.18, 6.52, z);
        st.rotation.z = -bx * .14;
        const m = mesh(st, stackGeo, M.alu, 0, 0, 0);
        m.material.side = THREE.DoubleSide;
        // dark throat: a plain polished lathe reads as a sheet-metal funnel
        mesh(st, PU.lathe([[.34, 0], [.38, .58], [.41, 1.2], [.53, 1.6], [.68, 1.84]], 30), M.black, 0, .02, 0);
        mesh(st, PU.lathe([[.4, 0], [.36, .12], [.4, .3], [.44, .42]], 28), M.castDark, 0, 0, 0);
        // throttle body
        mesh(st, PU.cyl(.5, .5, .36, 26), M.castDark, 0, -.18, 0);
        mesh(st, PU.disc(.42, .07, 24), M.machined, 0, -.04, 0).rotation.x = .35;
        // butterfly shaft
        mesh(st, cylZ(.05, 1.0, 8), M.steel, 0, -.04, 0).rotation.z = PI / 2;
        stackList.push(st);
      });
    });
    A.explodeGroups.push({ g: stacksG, dir: new THREE.Vector3(0, 1, 0), dist: 2.2 });

    // intake port pipes from valley to head
    const portG = grp(intakeG, 'ports');
    A.fadeGroups.ports = portG;
    [-1, 1].forEach((sx) => {
      CFG.ZS.forEach((z) => {
        const start = [sx * 1.35, 6.7, z];
        const end = [sx * 3.45, 6.35, z];
        mesh(portG, tubeZ([
          start, [sx * 1.95, 6.62, z], [sx * 2.7, 6.7, z], end
        ], .32, 22, 12), M.cast);
        // flanges at both ends so the runner reads as a bolted pipe
        mesh(portG, PU.disc(.42, .1, 20), M.castDark, sx * 1.42, 6.7, z).rotation.z = PI / 2;
        mesh(portG, new THREE.TorusGeometry(.34, .05, 8, 20), M.darkSteel, sx * 3.28, 6.42, z);
        mesh(portG, PU.disc(.44, .09, 20), M.castDark, sx * 3.38, 6.36, z).rotation.z = PI / 2;
      });
    });

    // fuel system / carbon rails
    // plenum badge
    mesh(intakeG, PU.rbox(1.6, .32, .05, .08), M.castDark, 0, 9.3, -5.68);

    /* =========================================================
       4. exhaust — wrapped primaries, collector, GPF, turbo
       ========================================================= */
    const exhaustG = grp(root, 'exhaust');
    A.fadeGroups.exhaust = null;
    const primaries = [];

    // a blanket that follows the exact same spline as the pipe it covers,
    // so the sleeve can never drift off the pipe and show a seam
    const sleeveOn = (curve, t0, t1, r, mat, seg) => {
      const n = 16, pp = [];
      for (let i = 0; i <= n; i++) pp.push(curve.getPointAt(t0 + (t1 - t0) * i / n));
      const c2 = new THREE.CatmullRomCurve3(pp);
      const m = mesh(exhaustG, new THREE.TubeGeometry(c2, seg || 30, r, 16, false), mat);
      // crimped ends so the blanket reads as folded fabric, not a floating cone
      [0, 1].forEach((k) => {
        const p = c2.getPointAt(k), tan = c2.getTangentAt(k);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .012, .04, 8, 20), mat);
        ring.position.copy(p);
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
        ring.castShadow = true; ring.receiveShadow = true;
        exhaustG.add(ring);
      });
      return m;
    };

    const wrapPipe = (pts, r) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
      const pm = mesh(exhaustG, new THREE.TubeGeometry(curve, 52, r, 18, false), M.wrap);
      // fabric band clamps along the run
      [.34, .62, .86].forEach(t => {
        const p = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .026, .026, 6, 20), M.machined);
        ring.position.copy(p);
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
        ring.castShadow = true; ring.receiveShadow = true;
        exhaustG.add(ring);
      });
      return { mesh: pm, curve: curve };
    };
    [-1, 1].forEach((sx) => {
      // sx=-1: left bank outer face; sx=+1 right bank
      CFG.ZS.forEach((z) => {
        const x0 = sx * 6.05;
        const y0 = 3.72;
        const pts = [
          [x0, y0, z],
          [x0 + sx * .55, y0 - .55, z + .15],
          [x0 + sx * 1.15, y0 - 1.2, z + .55],
          [x0 + sx * 1.05, y0 - 2.15, z + 1.5],
          [sx * 5.6, y0 - 2.35, 5.05]
        ];
        const built = wrapPipe(pts, .3);
        primaries.push(built.mesh);
        // gold blanket hugging the hot end of the primary
        sleeveOn(built.curve, .01, .33, .327, M.gold, 24);
        // port flange, squared to the pipe axis instead of floating as a slab
        const t0 = built.curve.getTangentAt(0);
        const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), t0);
        const fl = mesh(exhaustG, PU.rbox(.62, .54, .1, .04), M.darkSteel, pts[0][0], pts[0][1], pts[0][2]);
        fl.quaternion.copy(q0);
        const collar = mesh(exhaustG, cylZ(.335, .12, 20), M.heatTint, pts[0][0], pts[0][1], pts[0][2]);
        collar.quaternion.copy(q0);
      });
    });
    // collector cone — inconel, not fabric
    const col = mesh(exhaustG, new THREE.CylinderGeometry(1.2, .62, 2.3, 34), M.inconel, -5.6, 1.55, 4.35);
    col.rotation.x = PI / 2.6; col.rotation.z = .12;
    mesh(exhaustG, new THREE.TorusGeometry(1.18, .085, 10, 32), M.heatTint, -5.6, 1.72, 5.5).rotation.x = .35;
    mesh(exhaustG, new THREE.TorusGeometry(.98, .07, 10, 32), M.machined, -5.97, .42, 3.2).rotation.x = -.42;
    // gold blanket strap across the collector
    mesh(exhaustG, PU.rbox(1.55, .05, .95, .03), M.gold, -5.62, 2.62, 4.5).rotation.z = .1;
    // merge collector body + lambda sensor + heat shield
    const merge = grp(exhaustG, 'merge-collector');
    merge.position.set(-5.7, 1.36, 5.02);
    mesh(merge, PU.rbox(1.6, 1.15, 1.2, .22), M.heatTint, 0, 0, 0);
    mesh(merge, PU.rbox(1.68, .07, 1.3, .04), M.gold, 0, .6, 0);
    const lb = mesh(merge, PU.cyl(.16, .16, .52, 14), M.machined, .62, .35, -.12);
    lb.rotation.z = PI / 2;
    mesh(merge, PU.disc(.2, .12, 6), M.gold, .86, .35, -.12).rotation.z = PI / 2;
    mesh(merge, tubeZ([[.9, .35, -.12], [1.2, .42, .1], [1.45, .6, .45]], .035, 14, 6), M.black);
    for (const yy of [-.32, 0, .32]) {
      mesh(merge, new THREE.TorusGeometry(.2, .032, 6, 16), M.machined, -.82, yy, 0).rotation.y = PI / 2;
    }
    // collector -> turbine inlet flange
    mesh(exhaustG, tubeZ([
      [-5.5, 1.3, 5.5], [-4.6, 1.9, 6.4], [-3.6, 2.7, 7.0], [-2.9, 3.25, 7.16]
    ], .46, 30, 12), M.heatTint);
    // turbine outlet -> downpipe
    const downPts = [
      [-2.6, 2.5, 6.0], [-3.4, 1.1, 6.4], [-4.8, -.2, 6.0], [-6.0, -1.25, 4.5],
      [-6.5, -1.75, 2.2], [-6.6, -1.85, -.2]
    ];
    const downCurve = new THREE.CatmullRomCurve3(downPts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    mesh(exhaustG, new THREE.TubeGeometry(downCurve, 64, .55, 20, false), M.inconel);
    sleeveOn(downCurve, .01, .16, .578, M.gold, 18);
    const can = grp(exhaustG, 'gpf');
    can.scale.setScalar(.86);
    mesh(can, cylZ(1.35, 2.8, 40), M.inconel, 0, 0, 0);
    mesh(can, new THREE.SphereGeometry(1.35, 32, 20), M.inconel, 0, 0, 1.4);
    mesh(can, new THREE.SphereGeometry(1.35, 32, 20), M.inconel, 0, 0, -1.4);
    for (const z of [-.8, .8]) {
      mesh(can, new THREE.TorusGeometry(1.38, .06, 8, 34), M.machined, 0, 0, z);
    }
    // gold shield on can
    mesh(can, PU.rbox(1.5, .06, 1.8, .03), M.gold, 0, 1.3, .1);
    can.position.set(-6.3, -1.95, -2.6);
    // tail pipe
    mesh(exhaustG, tubeZ([
      [-6.6, -1.85, -4.6], [-6.7, -1.9, -5.6], [-7.0, -2.1, -6.3]
    ], .58, 24, 14), M.inconel);
    mesh(exhaustG, PU.disc(.52, .18, 24), M.black, -7.02, -2.12, -6.38).rotation.x = PI / 2;
    A.explodeGroups.push({ g: exhaustG, dir: new THREE.Vector3(-1, -.35, .1), dist: 3.2 });

    /* ---------------- turbo ---------------- */
    // axis runs along Z: exhaust enters the turbine from the front (-Z), the
    // compressor swallows air through a bellmouth that faces the tail (+Z).
    const turboG = grp(root, 'turbo');
    A.fadeGroups.turbo = turboG;
    turboG.position.set(-2.55, 3.05, 7.4);

    // centre housing (CHRA)
    mesh(turboG, cylZ(.5, 1.95, 26), M.castDark, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
      mesh(turboG, PU.disc(.56, .09, 26), M.machined, 0, 0, -.62 + i * .62).rotation.x = PI / 2;
    }
    // oil feed banjo on top, drain underneath
    mesh(turboG, cylZ(.12, .3, 12), M.machined, 0, .52, -.1);
    mesh(turboG, tubeZ([[0, .5, -.1], [.34, 1.35, -.34], [.2, 2.0, -1.1]], .075, 18, 8), M.darkSteel);
    mesh(turboG, cylZ(.14, .34, 12), M.machined, 0, -.52, .1);
    mesh(turboG, tubeZ([[0, -.5, .1], [-.3, -1.3, .03], [-.62, -1.95, -.5]], .095, 18, 8), M.black);

    // ---- turbine side ----
    const tv = mesh(turboG, new THREE.TorusGeometry(.93, .5, 16, 32), M.heatTint, 0, 0, -.66);
    tv.scale.y = 1.07;
    // scroll tongue so the donut reads as a snail, not a ring
    mesh(turboG, PU.rbox(.62, .74, .78, .22), M.heatTint, .78, -.5, -.62);
    mesh(turboG, PU.disc(1.12, .3, 30), M.heatTint, 0, 0, -1.2).rotation.x = PI / 2;
    // turbine outlet stub to the downpipe
    mesh(turboG, cylZ(.62, .42, 26), M.heatTint, 0, 0, -1.42);
    mesh(turboG, new THREE.TorusGeometry(.64, .07, 8, 24), M.inconel, 0, 0, -1.6);
    // inlet flange where the collector pipe lands
    mesh(turboG, PU.rbox(1.5, 1.24, .26, .12), M.heatTint, 0, .34, -.16);
    const tbolt = [];
    for (let i = 0; i < 4; i++) tbolt.push([-.62 + (i % 2) * 1.24, -.24 + Math.floor(i / 2) * 1.02, .02, 0, 0, 0]);
    turboG.add(PU.boltMesh(tbolt, .1, .2, M.steel));
    // gold heat blanket over the hot side
    const blanket = new THREE.CylinderGeometry(1.44, 1.44, 1.05, 30, 1, true, .34, PI * 1.1);
    blanket.rotateX(PI / 2);
    mesh(turboG, blanket, M.gold, 0, .06, -.66);
    mesh(turboG, new THREE.TorusGeometry(1.45, .05, 6, 30), M.gold, 0, .06, -1.15).rotation.x = PI / 2;

    // ---- compressor side ----
    const cv = mesh(turboG, new THREE.TorusGeometry(.86, .43, 16, 32), M.cast, 0, 0, .68);
    cv.scale.y = 1.03;
    mesh(turboG, PU.rbox(.54, .66, .7, .18), M.cast, .74, .46, .66);
    mesh(turboG, PU.disc(1.04, .26, 30), M.cast, 0, 0, 1.16).rotation.x = PI / 2;
    // bellmouth inlet, axis on Z: a narrow throat that opens into the cover,
    // not a wide bucket that reads as a chrome horn from every angle
    const bellGeo = PU.lathe([
      [.42, 0], [.44, .1], [.5, .2], [.6, .3], [.72, .38], [.84, .43],
      [.94, .46], [.98, .5], [.94, .54], [.86, .52], [.8, .44], [.72, .3], [.66, .12], [.62, .02]
    ], 40);
    const bellM = mesh(turboG, bellGeo, M.castLight, 0, 0, 1.2);
    bellM.rotation.x = PI / 2;
    mesh(turboG, new THREE.TorusGeometry(.55, .05, 8, 26), M.darkSteel, 0, 0, 1.74);
    // intake screen: without it the throat reads as an open white bowl
    mesh(turboG, PU.disc(.52, .05, 26), M.black, 0, 0, 1.46).rotation.x = PI / 2;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU;
      const bar = mesh(turboG, PU.rbox(.04, .5, .035, .01), M.darkSteel);
      bar.position.set(Math.cos(a) * .25, Math.sin(a) * .25, 1.5);
      bar.rotation.z = a;
    }
    // V-band clamp where cover meets CHRA
    mesh(turboG, new THREE.TorusGeometry(.92, .06, 8, 32), M.machined, 0, 0, 1.02).rotation.x = 0;
    // compressor wheel inside the inlet
    const wheel = grp(turboG, 'comp-wheel');
    wheel.position.set(0, 0, 1.22);
    mesh(wheel, PU.disc(.5, .07, 28), M.machined).rotation.x = PI / 2;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU;
      const b = mesh(wheel, PU.rbox(.05, .3, .34, .02), M.machined);
      b.position.set(Math.cos(a) * .28, Math.sin(a) * .28, 0);
      b.rotation.z = a;
      b.rotation.x = .6;
    }
    mesh(wheel, PU.disc(.11, .16, 12), M.steel, 0, 0, .1).rotation.x = PI / 2;

    // wastegate can + rod
    mesh(turboG, PU.cyl(.3, .3, .72, 18), M.castDark, .95, .88, .3);
    mesh(turboG, PU.disc(.19, .6, 14), M.machined, .95, 1.44, .3);
    mesh(turboG, tubeZ([[.95, 1.5, .3], [.45, 1.75, .05], [-.15, 1.6, -.3]], .095, 16, 8), M.steel);

    // charge pipe: volute outlet -> up the back of the engine to the plenum
    const charge = [
      [.16, .95, .68], [.16, 1.75, .92], [-.16, 2.9, .74], [-.7, 3.7, .1], [-1.02, 3.95, -.9]
    ];
    mesh(turboG, tubeZ(charge, .46, 36, 14), M.carbonMatte);
    mesh(turboG, new THREE.TorusGeometry(.5, .075, 8, 24), M.orange, .16, 1.62, .885).rotation.x = -.35;
    mesh(turboG, new THREE.TorusGeometry(.5, .075, 8, 24), M.orange, -.9, 3.9, -.55).rotation.x = .6;
    A.explodeGroups.push({ g: turboG, dir: new THREE.Vector3(-.3, .2, 1), dist: 3.2 });

    /* =========================================================
       5. MGU-K + HV cabling
       ========================================================= */
    const mgukG = grp(root, 'mguk');
    A.fadeGroups.mguk = null;
    mgukG.position.set(3.75, .85, 5.05);
    mesh(mgukG, cylZ(1.02, 2.35, 34), M.castDark, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      mesh(mgukG, PU.disc(1.12, .07, 34), M.machined, 0, 0, -1.0 + i * .34).rotation.x = PI / 2;
    }
    mesh(mgukG, PU.disc(1.16, .2, 34), M.cast, 0, 0, 1.25).rotation.x = PI / 2;
    mesh(mgukG, PU.disc(.5, .32, 24), M.machined, 0, 0, -1.35).rotation.x = PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      mesh(mgukG, PU.disc(.06, .12, 6), M.steel, Math.cos(a) * .88, Math.sin(a) * .88, 1.36).rotation.x = PI / 2;
    }
    // mount bracket
    mesh(mgukG, PU.rbox(.5, 1.5, 1.7, .1), M.carbonMatte, -1.0, -.5, 0);
    // HV junction box
    mesh(mgukG, PU.rbox(1.1, .8, 1.2, .12), M.black, .35, 1.35, -1.4);
    mesh(mgukG, PU.rbox(.8, .3, .8, .06), M.orange, .35, 1.78, -1.4);
    // orange HV cable
    mesh(mgukG, tubeZ([
      [0, .9, -1.25], [0, 1.55, -1.8], [.1, 2.2, -2.6], [.05, 2.7, -3.4]
    ], .11, 28, 10), M.orange);
    mesh(mgukG, new THREE.TorusGeometry(.15, .04, 6, 14), M.machined, 0, .9, -1.3).rotation.x = PI / 2;
    A.explodeGroups.push({ g: mgukG, dir: new THREE.Vector3(1, 0, 0), dist: 2.9 });

    // small cooler / pump on the other side
    mesh(root, PU.rbox(1.1, 1.0, 1.5, .14), M.castDark, -3.6, -0.2, 3.2);
    mesh(root, PU.cyl(.4, .4, .5, 18), M.black, -3.6, -.2, 4.1).rotation.x = PI / 2;

    /* =========================================================
       6. timing cover + gear train
       ========================================================= */
    const tcover = grp(timing, 'timing-cover');
    A.fadeGroups.timing = tcover;
    const shp = new THREE.Shape();
    // rounded shoulders: a hard hexagon read as a decorative panel, not a cover
    shp.moveTo(-3.3, -1.1);
    shp.lineTo(3.3, -1.1);
    shp.lineTo(3.3, 1.7);
    shp.quadraticCurveTo(3.3, 3.55, 1.55, 3.62);
    shp.lineTo(-1.55, 3.62);
    shp.quadraticCurveTo(-3.3, 3.55, -3.3, 1.7);
    shp.closePath();
    const tgeo = new THREE.ExtrudeGeometry(shp, { depth: .34, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3, curveSegments: 12 });
    tgeo.center();
    // cast lip behind the carbon skin so the cover edge catches light
    const lip = new THREE.ExtrudeGeometry(shp, { depth: .3, bevelEnabled: true, bevelSize: .18, bevelThickness: .12, bevelSegments: 2, curveSegments: 12 });
    lip.center();
    mesh(tcover, lip, M.cast, 0, 1.35, -6.28);
    mesh(tcover, tgeo, M.carbonSkin, 0, 1.35, -6.45);
    mesh(tcover, PU.rbox(1.5, 1.1, .3, .12), M.castDark, 0, 1.2, -6.68);
    mesh(tcover, PU.disc(.38, .2, 20), M.machined, 0, 1.2, -6.86).rotation.x = PI / 2;
    // V6 badge plate
    mesh(tcover, PU.rbox(1.5, .58, .06, .06), M.machined, 0, 2.72, -6.6);
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.36, .5),
      new THREE.MeshStandardMaterial({ map: PU.badgeTexture(), metalness: .45, roughness: .48 })
    );
    badge.position.set(0, 2.72, -6.64);
    badge.rotation.y = PI;
    badge.receiveShadow = true;
    tcover.add(badge);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      mesh(tcover, PU.disc(.06, .1, 6), M.steel, Math.cos(a) * .5, 1.2 + Math.sin(a) * .5, -6.87).rotation.x = PI / 2;
    }
    // perimeter bolts
    const tb = [];
    for (let i = 0; i < 11; i++) tb.push([-3.0 + i * .6, 3.5, -6.26, 0, PI / 2, 0]);
    for (let i = 0; i < 11; i++) tb.push([-3.0 + i * .6, -1.0, -6.26, 0, PI / 2, 0]);
    tcover.add(PU.boltMesh(tb, .07, .1, M.machined));
    A.explodeGroups.push({ g: tcover, dir: new THREE.Vector3(0, 0, -1), dist: 2.9 });

    // gear train: centres spaced by the sum of the pitch radii so the wheels
    // mesh instead of interpenetrating, and enough teeth to read as gearing
    const gearG = grp(timing, 'gears');
    const gears = [
      { r: 1.45, teeth: 36, pos: [0, 0], ratio: 1, phase: 0 },
      { r: .95, teeth: 24, pos: [-1.35, 1.92], ratio: -1, phase: .3 },
      { r: .95, teeth: 24, pos: [1.35, 1.92], ratio: -1, phase: .3 },
      { r: .62, teeth: 16, pos: [0, 2.62], ratio: 1, phase: .2 }
    ];
    gears.forEach(g => {
      // sits on the front face of the crankcase, just behind the timing cover:
      // any deeper and the train is swallowed by the case and the cover has
      // nothing to reveal
      const m = mesh(gearG, PU.gear(g.r, g.teeth, .24, g.r * .22, .955), M.steel, g.pos[0], g.pos[1] + 1.35, -6.44);
      m.rotation.z = g.phase;
      mesh(gearG, PU.disc(g.r * .3, .34, 20), M.machined, g.pos[0], g.pos[1] + 1.35, -6.6).rotation.x = PI / 2;
      mesh(gearG, new THREE.TorusGeometry(g.r * .62, .045, 8, 26), M.darkSteel, g.pos[0], g.pos[1] + 1.35, -6.3);
      A.gears.push({ mesh: m, ratio: g.ratio, phase: g.phase, offset: 0 });
    });
    // cam sprockets were pushed to A.gears during bank build

    // front accessories / oil pump
    mesh(root, PU.rbox(2.2, 1.2, .9, .16), M.castDark, -2.0, -1.2, -6.0);
    mesh(root, PU.disc(.55, .5, 20), M.machined, -2.0, -1.2, -6.55).rotation.x = PI / 2;

    /* =========================================================
       7. hotspots (anchors + camera views)
       ========================================================= */
    const anchor = (parent, x, y, z) => {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      parent.add(o);
      return o;
    };
    const left = A['bank1'];   // -X bank, exhaust side visible
    const right = A['bank0'];
    const V = (th, ph, zm, tx, ty, tz) => ({ theta: th, phi: ph, zoom: zm, target: [tx, ty, tz] });
    const lp = A.cylinders.find(c => c.bank === 1 && c.z === 0) || A.cylinders[0];
    const leftPiston = lp.piston, leftRod = lp.rod;
    A.hotspots = [
      { id: 'coverL', label: '气门室盖', anchor: anchor(left.cover, -left.sign * 1.1, 9.4, -4.2), diagram: true, onlyDiagram: true, internal: false, view: V(-2.5, 1.0, .58, -4.2, 6.2, -2) },
      { id: 'headL', label: '缸盖 · 24 气门', anchor: anchor(left.head, 0, 7.4, 0), diagram: true, onlyDiagram: true, internal: false, view: V(-2.6, 1.02, .6, -4.4, 5.4, 0) },
      { id: 'blockL', label: '曲轴箱 / 缸体', anchor: anchor(left.shell, 0, 4.6, -2.2), diagram: true, onlyDiagram: true, internal: false, view: V(-2.8, 1.14, .72, -3.6, 3.2, 0) },
      { id: 'timingL', label: '正时罩', anchor: anchor(tcover, 1.2, 2.1, -6.65), diagram: true, onlyDiagram: true, internal: false, view: V(-2.9, 1.2, .55, -1.8, 2.2, -5.5) },
      { id: 'clutchL', label: '离合器总成', anchor: anchor(clutchG, 0, 2.2, 7.0), diagram: true, onlyDiagram: true, internal: false, view: V(.3, 1.28, .6, 0, 1.2, 6.2) },
      { id: 'plenum', label: '碳纤维进气箱', anchor: anchor(plenum, 0, 10.55, -.3), diagram: true, internal: false, view: V(-2.3, .86, .72, 0, 9.0, 0) },
      { id: 'plenum2', label: '稳压腔 · 单一大碳箱', anchor: anchor(plenum, 1.4, 9.4, -5.78), internal: false, view: V(-2.1, .98, .7, 0, 8.7, -1.5) },
      { id: 'stack', label: '喇叭口 · 固定长度', anchor: anchor(stacksG, -1.18, 8.2, 0), diagram: true, internal: true, view: V(-2.0, .98, .58, 0, 7.7, 0) },
      { id: 'cam', label: '双凸轮轴 · DOHC', anchor: anchor(left.cover, -left.sign * .95, 9.5, -1.2), internal: false, view: V(-2.6, 1.02, .58, -3.9, 5.8, 0) },
      { id: 'valve', label: '气动气门（无弹簧）', anchor: anchor(left.valves, -left.sign * .58, 8.52, -4.2), internal: true, view: V(-2.9, 1.05, .55, -4.2, 5.4, -3.6) },
      { id: 'prech', label: '预燃室 · 湍流射流点火', anchor: anchor(left.head, -left.sign * .9, 7.5, -4.2), internal: true, view: V(-2.7, 1.0, .58, -4.4, 5, -3.4) },
      { id: 'piston', label: '活塞 · 锻铝', anchor: anchor(leftPiston, 0, .55, 0), diagram: true, internal: true, view: V(-3.1, 1.18, .62, -4.1, 3.2, 0) },
      { id: 'rod', label: '钛合金连杆', anchor: anchor(leftRod, 0, 2.1, 0), diagram: true, internal: true, view: V(-3.05, 1.24, .6, -3.6, 2.2, 0) },
      { id: 'crank', label: '曲轴 · 3 销 120°', anchor: anchor(crankG, 0, 1.1, 0), diagram: true, internal: true, view: V(-2.8, 1.3, .62, -2.2, 1.2, 0) },
      { id: 'exhaust', label: '排气 · 隔热布等长管', anchor: anchor(exhaustG, -7.1, 2.6, -1.6), diagram: true, internal: false, view: V(-3.6, 1.22, .8, -5.6, 2.2, -1.2) },
      { id: 'turbo', label: '后置单涡轮（非分体）', anchor: anchor(turboG, 0, .6, -.4), diagram: true, internal: false, view: V(-.7, 1.18, .7, -2.6, 3.2, 7.8) },
      { id: 'mguk', label: 'MGU-K · 350kW', anchor: anchor(mgukG, 0, .7, .8), diagram: true, internal: false, view: V(-1.5, 1.25, .7, 3.8, 1.2, 5.2) }
    ];

    /* =========================================================
       8. animation
       ========================================================= */
    const spark = new THREE.PointLight(0xffb066, 0, 9, 2);
    spark.position.set(0, 5.8, 0);
    root.add(spark);
    const sparkOrb = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc98a, transparent: true, opacity: 0 }));
    root.add(sparkOrb);

    A.extractValve = null;
    A.extractAmt = 0;
    A.setExtract = function (v) {
      A.extractAmt = v || 0;
      if (!A.extractValve) {
        A.extractValve = A.bank1.valves.children.find(o =>
          o.userData && o.userData.baseY !== undefined && o.userData.kind === 'in' && o.userData.ci === 1) || null;
      }
    };

    A.animate = function (theta) {
      // crank + gear train
      crankG.rotation.z = -theta;
      for (const g of A.gears) {
        g.mesh.rotation.z = (g.mesh.userData && g.mesh.userData.cam)
          ? -theta * .5
          : -theta * g.ratio + g.phase;
      }
      // cams
      [A.bank0, A.bank1].forEach((bk) => {
        bk.cams.children.forEach((cam, ci) => {
          cam.rotation.z = theta * .5 + (ci === 0 ? 0 : PI * .92);
        });
      });

      let bestFlash = 0, bestCyl = null;
      A.cylinders.forEach((c) => {
        const phi = theta + c.phase - c.sign * CFG.BANK;
        const pinX = CFG.R * Math.sin(phi);
        const pinY = CFG.R * Math.cos(phi);
        const s = pinY + Math.sqrt(CFG.ROD * CFG.ROD - pinX * pinX);
        c.piston.position.set(0, s, c.z);
        c.rod.position.set(pinX, pinY, c.z + c.rodOffset);
        const dx = -pinX, dy = s - pinY;
        c.rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, 0).normalize());
        // spark near TDC compression
        const p = ((phi) % TAU + TAU) % TAU;
        const d = Math.min(p, TAU - p);
        const fl = Math.exp(-(d * d) / .035);
        if (fl > bestFlash) { bestFlash = fl; bestCyl = c; }
        if (fl > .35) {
          const wp = c.piston.getWorldPosition(new THREE.Vector3());
          sparkOrb.position.copy(wp).add(new THREE.Vector3(0, 1.35, 0));
        }
      });
      spark.intensity = bestFlash * 2.6;
      sparkOrb.material.opacity = bestFlash * .9;
      if (bestCyl) {
        const wp = bestCyl.piston.getWorldPosition(new THREE.Vector3());
        spark.position.copy(wp).add(new THREE.Vector3(0, 1.2, 0));
      }
      // valves
      [A.bank0, A.bank1].forEach((bk) => {
        bk.valves.children.forEach((v) => {
          const u = v.userData;
          if (u.baseY === undefined) return;
          const camAngle = (theta * .5 + u.phase) % TAU;
          const open = Math.max(0, -Math.cos(camAngle));
          const lift = open * open * .27;
          const extra = (v === A.extractValve) ? A.extractAmt * 1.8 : 0;
          v.position.y = u.baseY - lift - extra;
        });
      });
      return bestFlash;
    };

    /* =========================================================
       9. clipping / fade / explode
       ========================================================= */
    const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 9.6);

    /* Cutaway plane that always faces the viewer.
       A fixed-axis plane becomes a black wall the moment the camera sits on the
       removed side, so the normal is re-aimed from the camera every frame and
       the half of the engine nearest the viewer is taken away instead.
       The plane is pushed into every material of the unit, so bolts, studs and
       brackets are sawn along with the casting they sit on and nothing is left
       floating in mid-air.                                                     */
    const clipPivot = new THREE.Vector3(0, 2.6, 0);
    const clipDir = new THREE.Vector3();
    const clipCam = new THREE.Vector3(0, 6, 34);
    const clipMats = [];
    let clipAmount = 0, clipOn = false;

    function gatherClipMats() {
      clipMats.length = 0;
      const seen = new Set();
      root.traverse(o => {
        if (!o.isMesh || !o.material) return;
        const cand = [o.material, o.userData.origMat, o.userData.fadeMat];
        for (let i = 0; i < cand.length; i++) {
          const m = cand[i];
          if (!m || seen.has(m)) continue;
          seen.add(m);
          clipMats.push(m);
        }
      });
    }

    A.aimClip = function (camPos) {
      if (camPos) clipCam.copy(camPos);
      if (clipAmount <= .001) return;
      clipDir.subVectors(clipPivot, clipCam);
      clipDir.y = 0;
      if (clipDir.lengthSq() < 1e-6) clipDir.set(0, 0, -1);
      clipDir.normalize();
      clipPlane.normal.copy(clipDir);
      clipPlane.constant = -clipPivot.dot(clipDir) - 9.6 * (2 * clipAmount - 1);
    };

    A.setClip = function (v) {
      clipAmount = v || 0;
      A.aimClip();
      const on = clipAmount > .001;
      if (on !== clipOn) {
        clipOn = on;
        gatherClipMats();
        clipMats.forEach(m => {
          m.clippingPlanes = on ? [clipPlane] : [];
          m.clipShadows = on;
          // the sawn interior is the back of the part: with one-sided shading
          // those faces are culled and the section reads as a black hole
          const want = on ? THREE.DoubleSide : THREE.FrontSide;
          if (m.side !== want) {
            m.side = want;
            m.shadowSide = on ? THREE.BackSide : null;
          }
          m.needsUpdate = true;
        });
      }
      Object.keys(A.fadeTargets).forEach(k => {
        if (A.fadeGroups[k] && A.fadeTargets[k] < .999) A.setFade(k, A.fadeTargets[k]);
      });
    };

    const fadeCache = new WeakMap();
    function setGroupOpacity(g, a) {
      if (!g) return;
      g.traverse(o => {
        if (!o.isMesh || !o.material) return;
        if (a >= .999) {
          if (o.userData.origMat) { o.material = o.userData.origMat; o.userData.origMat = null; }
          o.castShadow = true;
          return;
        }
        let fm = o.userData.fadeMat;
        if (!fm) {
          o.userData.origMat = o.material;
          fm = o.material.clone();
          fm.transparent = true;
          fm.depthWrite = false;
          fm.clippingPlanes = o.material.clippingPlanes;
          // a shell that is faded out must read as dark tinted glass, not as a
          // milky grey slab: kill the diffuse/texture, keep the reflections   
          fm.map = null;
          fm.color = new THREE.Color(0x0a0d12);
          fm.metalness = .92;
          fm.roughness = .3;
          fm.envMapIntensity = .78;
          fm.side = THREE.FrontSide;
          o.userData.fadeMat = fm;
        }
        fm.opacity = Math.min(.5, a * 1.9);
        fm.clippingPlanes = o.userData.origMat ? o.userData.origMat.clippingPlanes : fm.clippingPlanes;
        o.material = fm;
        o.castShadow = a > .55;
      });
    }
    A.setFade = function (tag, a) {
      A.fadeTargets[tag] = a;
      setGroupOpacity(A.fadeGroups[tag], a);
    };
    A.fadeAll = function (a) {
      Object.keys(A.fadeGroups).forEach(k => { if (A.fadeGroups[k]) A.setFade(k, a); });
    };

    A.setExplode = function (v) {
      A.explodeGroups.forEach(e => {
        if (!e.base) e.base = e.g.position.clone();
        e.g.position.copy(e.base);
        e.g.position.addScaledVector(e.dir, e.dist * v);
      });
    };

    // starter positions for explode groups
    A.explodeGroups.forEach(e => { e.base = e.g.position.clone(); });

    /* Subtle per-part tonal spread.
       A machine built from one flat grey casting everywhere is the fastest way
       to read as CG, so each cast part gets one of four very close variants of
       its base material. Four shared clones keep the draw-call cost flat.     */
    (function tonalVariation() {
      let seed = 20261023;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const bases = [M.cast, M.castLight, M.castDark, M.mag, M.machined, M.lid, M.steel];
      const variants = new Map();
      const pick = (base) => {
        let arr = variants.get(base);
        if (!arr) {
          arr = [];
          for (let i = 0; i < 4; i++) {
            const m = base.clone();
            const k = .90 + i * .065 + rnd() * .03;
            m.color = base.color.clone().multiplyScalar(k);
            m.roughness = Math.min(.95, Math.max(.08, base.roughness * (.86 + rnd() * .3)));
            arr.push(m);
          }
          variants.set(base, arr);
        }
        return arr[(rnd() * arr.length) | 0];
      };
      root.traverse(o => {
        if (o.isMesh && o.material && bases.indexOf(o.material) >= 0) o.material = pick(o.material);
      });
    })();

    return A;
  }

  window.POWER_UNIT = buildPowerUnit;
})();
