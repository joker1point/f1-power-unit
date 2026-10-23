/* F1 Power Unit — scene, camera, interaction, tour */
(function () {
  'use strict';
  const THREE = window.THREE;
  const $ = (s) => document.querySelector(s);
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const canvas = $('#scene');
  const hotspotsEl = $('#hotspots');
  const loader = $('#loader');

  /* ---------------- renderer / scene ---------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, window.innerWidth / window.innerHeight, .25, 180);
  scene.environment = PU.makeEnv(renderer);

  /* ---------------- ground & light ---------------- */
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 96),
    new THREE.MeshBasicMaterial({
      map: PU.floorTexture(), transparent: true, depthWrite: false, toneMapped: false
    })
  );
  floor.rotation.x = -PI / 2;
  floor.position.y = -4.3;
  floor.renderOrder = -2;
  scene.add(floor);

  const shadowFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: .58 })
  );
  shadowFloor.rotation.x = -PI / 2;
  shadowFloor.position.y = -4.29;
  shadowFloor.receiveShadow = true;
  shadowFloor.renderOrder = -1;
  scene.add(shadowFloor);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2b323b, toneMapped: false });
  [11.6, 13.7, 16.8].forEach((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, i === 0 ? .028 : .018, 8, 180), ringMat);
    ring.rotation.x = -PI / 2;
    ring.position.y = -4.285;
    scene.add(ring);
  });

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 22),
    new THREE.MeshBasicMaterial({
      map: PU.contactShadowTexture(), transparent: true, opacity: .72,
      depthWrite: false, color: 0x000000
    })
  );
  contact.rotation.x = -PI / 2;
  contact.position.set(-.5, -4.27, .2);
  scene.add(contact);

  const hemi = new THREE.HemisphereLight(0xaec6e2, 0x0a0c10, .18);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfffaf2, 4.2);
  key.position.set(-14, 18, -8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -18; key.shadow.camera.right = 18;
  key.shadow.camera.top = 18; key.shadow.camera.bottom = -18;
  key.shadow.camera.near = .5; key.shadow.camera.far = 70;
  key.shadow.bias = -.0004;
  key.shadow.normalBias = .035;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc6d8f4, .32);
  fill.position.set(13, 6, 9);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xe2ecff, 1.2);
  rim.position.set(7, 9, 16);
  scene.add(rim);

  const valley = new THREE.PointLight(0xe6eefc, 7, 22, 2);
  valley.position.set(0, 7.6, 0);
  scene.add(valley);

  const floorBounce = new THREE.PointLight(0xffd8ad, 2, 26, 2);
  floorBounce.position.set(-9, -2.4, -3);
  scene.add(floorBounce);

  /* ---------------- model ---------------- */
  PU.initMaterials();
  const model = window.POWER_UNIT();
  scene.add(model.root);

  // contact shadow follows model silhouette roughly
  contact.scale.set(1.05, 1, 1);

  /* ---------------- camera state ---------------- */
  const W0 = -2.55, P0 = 1.26;
  const cam = {
    theta: W0, phi: P0, radius: 49,
    target: new THREE.Vector3(0, 3.35, 0),
    tTheta: W0, tPhi: P0, tRadius: 49,
    tTarget: new THREE.Vector3(0, 3.35, 0),
    autoOrbit: true
  };
  let trans = null;

  function fitRadius() {
    const vf = camera.fov * PI / 180;
    const portrait = camera.aspect < 1;
    const R = portrait ? 10.6 : 12.1;
    const dV = R / Math.sin(vf / 2);
    const dH = R / (Math.tan(vf / 2) * camera.aspect);
    return Math.max(dV, dH) * (portrait ? .92 : 1);
  }

  function homeTarget() {
    return new THREE.Vector3(0, camera.aspect < 1 ? 2.6 : 3.2, 0);
  }

  function baseCamera() {
    cam.theta = cam.tTheta = W0;
    cam.phi = cam.tPhi = P0;
    const r = fitRadius();
    cam.radius = cam.tRadius = r;
    cam.target.copy(homeTarget());
    cam.tTarget.copy(cam.target);
    trans = null;
  }

  function nearestAngle(from, to) {
    let d = (to - from) % TAU;
    if (d > PI) d -= TAU;
    if (d < -PI) d += TAU;
    return from + d;
  }

  function flyTo(view, dur) {
    dur = dur === undefined ? 1.5 : dur;
    const r = fitRadius() * (view.zoom || 1);
    const to = {
      theta: nearestAngle(cam.theta, view.theta),
      phi: clamp(view.phi, .12, PI - .12),
      radius: r,
      target: new THREE.Vector3(view.target[0], view.target[1], view.target[2])
    };
    trans = {
      t: 0, dur: dur,
      from: { theta: cam.theta, phi: cam.phi, radius: cam.radius, target: cam.target.clone() },
      to: to
    };
  }

  function tickCamera(dt) {
    if (trans) {
      trans.t += dt;
      const k = ease(clamp(trans.t / trans.dur, 0, 1));
      cam.theta = lerp(trans.from.theta, trans.to.theta, k);
      cam.phi = lerp(trans.from.phi, trans.to.phi, k);
      cam.radius = lerp(trans.from.radius, trans.to.radius, k);
      cam.target.lerpVectors(trans.from.target, trans.to.target, k);
      cam.tTheta = cam.theta; cam.tPhi = cam.phi; cam.tRadius = cam.radius; cam.tTarget.copy(cam.target);
      if (trans.t >= trans.dur) trans = null;
    } else {
      if (cam.autoOrbit && !tour.active) {
        cam.tTheta += .06 * dt;
      }
      const k = 1 - Math.pow(.0015, dt);
      cam.theta = lerp(cam.theta, cam.tTheta, k);
      cam.phi = lerp(cam.phi, cam.tPhi, k);
      cam.radius = lerp(cam.radius, cam.tRadius, k);
      cam.target.lerp(cam.tTarget, k);
    }
    const sp = Math.sin(cam.phi), cp = Math.cos(cam.phi);
    camera.position.set(
      cam.target.x + cam.radius * sp * Math.sin(cam.theta),
      cam.target.y + cam.radius * cp,
      cam.target.z + cam.radius * sp * Math.cos(cam.theta)
    );
    camera.lookAt(cam.target);
    camera.updateMatrixWorld();
  }
  baseCamera();

  /* ---------------- orbit input ---------------- */
  let drag = null, moved = 0;
  const pointers = new Map();
  let pinchDist = 0;

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const ps = [...pointers.values()];
      pinchDist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      return;
    }
    moved = 0;
    drag = {
      mode: (e.button === 2 || e.shiftKey) ? 'pan' : 'rotate',
      x: e.clientX, y: e.clientY,
      id: e.pointerId
    };
    if (tour.active) exitTour(true);
    setOrbit(false);
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const ps = [...pointers.values()];
      const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      if (pinchDist > 0) {
        cam.tRadius = clamp(cam.tRadius * (pinchDist / d), 4, 140);
        cam.radius = cam.tRadius;
      }
      pinchDist = d;
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    trans = null;
    if (drag.mode === 'rotate') {
      cam.tTheta -= dx * .0062;
      cam.tPhi = clamp(cam.tPhi - dy * .0052, .12, PI - .12);
      cam.theta = cam.tTheta; cam.phi = cam.tPhi;
    } else {
      const right = new THREE.Vector3(), up = new THREE.Vector3();
      camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
      const f = cam.radius * .0016;
      cam.tTarget.addScaledVector(right, -dx * f).addScaledVector(up, dy * f);
      cam.target.copy(cam.tTarget);
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (drag && drag.id === e.pointerId) drag = null;
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (tour.active) exitTour(true);
    cam.tRadius = clamp(cam.tRadius * Math.exp(e.deltaY * .0011), 4, 140);
    cam.radius = cam.tRadius;
  }, { passive: false });

  /* ---------------- sliders / controls ---------------- */
  const state = {
    running: true, rpm: 620, clip: 0, explode: 0,
    xray: false, ao: true, labels: true, crank: .35
  };
  const css = (el, prop) => el.style;

  const runBtn = $('#runBtn'), rpmEl = $('#rpm'), rpmVal = $('#rpmVal');
  const clipEl = $('#clip'), clipVal = $('#clipVal');
  const expEl = $('#explode'), expVal = $('#explodeVal');
  const xrayBtn = $('#xrayBtn'), aoBtn = $('#aoBtn'), labelBtn = $('#labelBtn');
  const orbitBtn = $('#orbitBtn'), angleVal = $('#angleVal');

  function setRunning(v) {
    state.running = v;
    runBtn.classList.toggle('on', v);
    runBtn.textContent = v ? '运转中' : '已暂停';
  }
  runBtn.addEventListener('click', () => setRunning(!state.running));
  rpmEl.addEventListener('input', () => {
    state.rpm = +rpmEl.value;
    rpmVal.textContent = state.rpm + ' RPM';
  });
  clipEl.addEventListener('input', () => {
    if (tour.active) exitTour(true);
    state.clip = +clipEl.value / 100;
    clipVal.textContent = Math.round(state.clip * 100) + '%';
    model.setClip(state.clip);
  });
  expEl.addEventListener('input', () => {
    if (tour.active) exitTour(true);
    state.explode = +expEl.value / 100;
    expVal.textContent = Math.round(state.explode * 100) + '%';
    model.setExplode(state.explode);
  });
  xrayBtn.addEventListener('click', () => {
    state.xray = !state.xray;
    xrayBtn.classList.toggle('on', state.xray);
    applyFades();
  });
  aoBtn.addEventListener('click', () => {
    state.ao = !state.ao;
    aoBtn.classList.toggle('on', state.ao);
  });
  labelBtn.addEventListener('click', () => {
    state.labels = !state.labels;
    labelBtn.classList.toggle('on', state.labels);
    hotspotsEl.style.display = state.labels ? '' : 'none';
  });
  orbitBtn.addEventListener('click', () => setOrbit(!cam.autoOrbit));
  function setOrbit(v) {
    cam.autoOrbit = v;
    orbitBtn.classList.toggle('on', v);
  }
  $('#resetBtn').addEventListener('click', () => {
    baseCamera();
    clipEl.value = 0; expEl.value = 0; clipVal.textContent = '0%'; expVal.textContent = '0%';
    state.clip = state.explode = 0;
    model.setClip(0); model.setExplode(0);
    state.xray = false; xrayBtn.classList.remove('on');
    applyFades();
    setOrbit(true);
    setActiveView('three');
  });

  const views = {
    three: { theta: W0, phi: 1.26, zoom: 1, target: [0, 3.2, 0] },
    side: { theta: -PI / 2, phi: 1.50, zoom: .66, target: [0, 3.1, 0] },
    front: { theta: PI, phi: 1.44, zoom: .54, target: [0, 3.0, .2] },
    top: { theta: -.6, phi: .40, zoom: .70, target: [0, 3.8, 0] },
    rear: { theta: .28, phi: 1.36, zoom: .52, target: [0, 2.2, 4.6] }
  };
  function setActiveView(name) {
    document.querySelectorAll('.view').forEach(b => b.classList.toggle('on', b.dataset.view === name));
  }
  document.querySelectorAll('.view').forEach(b => {
    b.addEventListener('click', () => {
      if (tour.active) exitTour(true);
      setOrbit(false);
      setActiveView(b.dataset.view);
      flyTo(views[b.dataset.view], 1.25);
    });
  });

  /* ---------------- fades ---------------- */
  const XRAY_TAGS = ['case', 'blockR', 'blockL', 'headR', 'headL', 'coverR', 'coverL',
    'plenum', 'timing', 'pan', 'clutch', 'ports'];
  let stationFades = {};
  function applyFades() {
    const tags = Object.keys(model.fadeGroups);
    tags.forEach(t => {
      let a = 1;
      if (stationFades[t] !== undefined) a = Math.min(a, stationFades[t]);
      if (state.xray && XRAY_TAGS.indexOf(t) >= 0) a = Math.min(a, .17);
      model.setFade(t, a);
    });
  }

  /* ---------------- AO post ---------------- */
  const post = (function () {
    const sceneRT = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.UnsignedByteType });
    sceneRT.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    sceneRT.depthTexture.minFilter = THREE.NearestFilter;
    sceneRT.depthTexture.magFilter = THREE.NearestFilter;

    const aoRT = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.UnsignedByteType });
    const blurRT = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.UnsignedByteType });

    const quadScene = new THREE.Scene();
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    quad.frustumCulled = false;
    quadScene.add(quad);

    const common = {
      tDepth: { value: null },
      tColor: { value: null },
      tAO: { value: null },
      uProj: { value: new THREE.Matrix4() },
      uProjInv: { value: new THREE.Matrix4() },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uRes: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 3.0 },
      uStrength: { value: 1.45 }
    };

    const aoMat = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: Object.assign({}, common, { tDepth: { value: sceneRT.depthTexture } }),
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tDepth;
        uniform mat4 uProj, uProjInv;
        uniform float uNear, uFar, uRadius, uStrength;
        #include <packing>
        float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
        vec3 viewPos(vec2 uv){
          float d = texture2D(tDepth, uv).x;
          vec4 clip = vec4(uv*2.-1., d*2.-1., 1.);
          vec4 v = uProjInv * clip;
          return v.xyz / v.w;
        }
        void main(){
          float d = texture2D(tDepth, vUv).x;
          if(d >= .99999){ gl_FragColor = vec4(1.,1.,1.,1.); return; }
          vec3 p = viewPos(vUv);
          vec3 n = normalize(cross(dFdx(p), dFdy(p)));
          if(dot(n, -p) < 0.) n = -n;
          vec3 rv = normalize(vec3(hash(vUv*941.), hash(vUv*367.+7.), 0.) - .5);
          vec3 t = normalize(rv - n*dot(rv,n));
          vec3 b = cross(n,t);
          float occ = 0.;
          const int N = 12;
          for(int i=0;i<N;i++){
            float fi = float(i);
            float a = fi*2.399963 + hash(vUv*517.)*6.283;
            float r = sqrt((fi+.5)/float(N));
            vec3 dir = normalize(t*cos(a)*r + b*sin(a)*r + n*(.35+.65*r));
            vec3 sp = p + dir * uRadius;
            vec4 clip = uProj * vec4(sp,1.);
            vec2 suv = clip.xy/clip.w*.5+.5;
            if(suv.x<0.||suv.x>1.||suv.y<0.||suv.y>1.) continue;
            float sd = texture2D(tDepth, suv).x;
            float sz = perspectiveDepthToViewZ(sd, uNear, uFar);
            float range = smoothstep(0.,1., uRadius/abs(p.z - sz));
            occ += ((sz >= sp.z + .02) ? 1. : 0.) * range;
          }
          float ao = 1. - (occ/float(N))*uStrength;
          gl_FragColor = vec4(vec3(clamp(ao,0.,1.)),1.);
        }`
    });

    const blurMat = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: Object.assign({}, common, { tAO: { value: aoRT.texture }, uRes: { value: new THREE.Vector2(1, 1) } }),
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tAO;
        uniform vec2 uRes;
        void main(){
          vec2 px = 1./uRes;
          float s = texture2D(tAO, vUv).r*4.;
          s += texture2D(tAO, vUv+vec2(px.x,0.)).r*2.;
          s += texture2D(tAO, vUv-vec2(px.x,0.)).r*2.;
          s += texture2D(tAO, vUv+vec2(0.,px.y)).r*2.;
          s += texture2D(tAO, vUv-vec2(0.,px.y)).r*2.;
          s += texture2D(tAO, vUv+px).r;
          s += texture2D(tAO, vUv-px).r;
          s += texture2D(tAO, vUv+vec2(px.x,-px.y)).r;
          s += texture2D(tAO, vUv+vec2(-px.x,px.y)).r;
          gl_FragColor = vec4(vec3(s/16.),1.);
        }`
    });

    const compMat = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: Object.assign({}, common, {
        tColor: { value: sceneRT.texture },
        tAO: { value: blurRT.texture },
        uStrength: { value: .9 }
      }),
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tColor;
        uniform sampler2D tAO;
        uniform float uStrength;
        void main(){
          vec4 src = texture2D(tColor, vUv);
          float ao = texture2D(tAO, vUv).r;
          ao = mix(1., ao, uStrength);
          gl_FragColor = vec4(src.rgb * ao, src.a);
          #include <encodings_fragment>
        }`
    });

    function resize() {
      const w = Math.floor(window.innerWidth * renderer.getPixelRatio());
      const h = Math.floor(window.innerHeight * renderer.getPixelRatio());
      sceneRT.setSize(w, h);
      const hw = Math.max(2, Math.floor(w / 2)), hh = Math.max(2, Math.floor(h / 2));
      aoRT.setSize(hw, hh);
      blurRT.setSize(hw, hh);
      aoMat.uniforms.uRes.value.set(hw, hh);
      blurMat.uniforms.uRes.value.set(hw, hh);
    }
    resize();

    function render() {
      if (!state.ao) {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        return;
      }
      aoMat.uniforms.uProj.value.copy(camera.projectionMatrix);
      aoMat.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
      common.uNear.value = camera.near;
      common.uFar.value = camera.far;
      // scene color + depth
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);
      // AO
      quad.material = aoMat;
      renderer.setRenderTarget(aoRT);
      renderer.render(quadScene, quadCam);
      // blur
      quad.material = blurMat;
      renderer.setRenderTarget(blurRT);
      renderer.render(quadScene, quadCam);
      // composite
      quad.material = compMat;
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCam);
    }
    return { resize: resize, render: render };
  })();

  /* ---------------- hotspots ---------------- */
  const hotspots = model.hotspots;
  hotspots.forEach(h => {
    const el = document.createElement('div');
    el.className = 'hs';
    el.innerHTML = '<i></i><b>' + h.label + '</b>';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tour.active) return;
      setOrbit(false);
      setActiveView('');
      flyTo(h.view, 1.3);
      if (h.internal && state.clip < .22 && state.explode < .2) {
        clipEl.value = 26; clipVal.textContent = '26%';
        state.clip = .26; model.setClip(.26);
      }
    });
    hotspotsEl.appendChild(el);
    h.el = el;
  });

  const tmpV = new THREE.Vector3();
  const hsRay = new THREE.Raycaster();
  const hsDir = new THREE.Vector3();
  let hsTick = 0;
  function updateHotspots() {
    hsTick++;
    const touring = tour.active;
    const diagram = touring && tourStation().diagram;
    hotspots.forEach(h => {
      const show = !touring ? (state.labels && !h.onlyDiagram && (!h.internal || state.clip > .22 || state.explode > .2))
        : (diagram ? !!h.diagram : false);
      if (!show) { h.el.style.display = 'none'; return; }
      h.anchor.getWorldPosition(tmpV);
      // hide labels whose part is buried behind geometry
      if (!h.internal && !diagram && hsTick % 5 === 0) {
        hsDir.copy(tmpV).sub(camera.position);
        const dist = hsDir.length();
        hsRay.set(camera.position, hsDir.normalize());
        const hits = hsRay.intersectObject(model.root, true);
        h._occluded = hits.length > 0 && hits[0].distance < dist - .6;
      }
      if (h._occluded) { h.el.style.display = 'none'; return; }
      const vz = tmpV.clone().applyMatrix4(camera.matrixWorldInverse).z;
      tmpV.project(camera);
      if (vz > -.5 || tmpV.x < -1.08 || tmpV.x > 1.08 || tmpV.y < -1.08 || tmpV.y > 1.08) {
        h.el.style.display = 'none'; return;
      }
      h.el.style.display = '';
      h.el.style.left = ((tmpV.x * .5 + .5) * window.innerWidth).toFixed(1) + 'px';
      h.el.style.top = ((-tmpV.y * .5 + .5) * window.innerHeight).toFixed(1) + 'px';
    });
  }

  /* ---------------- tour ---------------- */
  const HT = {};
  hotspots.forEach(h => { HT[h.id] = h; });
  const V = (th, ph, zm, tx, ty, tz) => ({ theta: th, phi: ph, zoom: zm, target: [tx, ty, tz] });

  const TOUR = [
    { t: '整机 · 外部概览', s: '90° V6 · 1.6L · 单涡轮后置 · MGU-K 350kW', tag: '碳纤维进气箱', at: 'plenum', view: V(W0, 1.26, 1, 0, 3.2, 0), clip: 0, exp: 0, rpm: 620, fades: {}, dwell: 5200 },
    { t: '碳纤维进气箱', s: '单一大碳罩 · 覆盖整个 V 谷 · 下面几站会把罩壳变透明', tag: '碳纤维进气箱', at: 'plenum', view: V(-2.25, .95, .46, 0, 8.9, -1.0), clip: 0, exp: 0, rpm: 620, fades: {}, dwell: 5000 },
    { t: '六个喇叭口', s: '规则禁止可变长度进气 · 固定喇叭口 + 独立节气门 · 罩壳已淡出', tag: '喇叭口 ×6', at: 'stack', view: V(-2.1, 1.0, .34, 0, 7.5, -1.4), clip: 0, exp: .04, rpm: 300, fades: { plenum: .07 }, dwell: 5200 },
    { t: '双凸轮轴 · DOHC', s: '每缸 4 气门 · 气动回位（无金属弹簧）· 气门室盖已淡出', tag: '凸轮轴', at: 'cam', view: V(-2.5, 1.05, .28, -4.2, 6.1, -1.0), clip: 0, exp: .04, rpm: 240, fades: { coverL: .05, coverR: .12 }, dwell: 5400 },
    { t: '气门组', s: '每缸 4 气门 · 钛合金 · 气动回位（无金属弹簧）· 已沿阀杆轴线抽出一只', tag: '气门（抽出）', at: 'valve', view: V(-2.65, 1.12, .26, -4.3, 5.7, -3.0), clip: .1, exp: .04, rpm: 0, fades: { coverL: .05, headL: .14, headR: .5 }, extract: 1, dwell: 5600 },
    { t: '活塞 · 锻铝', s: 'Ø80mm · 行程 53mm · 三销 120° → 三只活塞本来就不同高', tag: '活塞', at: 'piston', view: V(-3.0, 1.18, .26, -4.1, 3.6, -3.0), clip: .5, exp: .06, rpm: 240, fades: {}, dwell: 5000 },
    { t: '钛合金连杆', s: '连杆长 105mm · 与曲柄半径 26.5mm 共同决定行程', tag: '连杆', at: 'rod', view: V(-3.0, 1.24, .24, -3.8, 2.4, .2), clip: .55, exp: .06, rpm: 240, fades: {}, dwell: 5000 },
    { t: '曲轴 · 3 销 120°', s: '规则禁止 split-pin · 发火间隔 90° / 150° 交替', tag: '曲轴', at: 'crank', view: V(-2.7, 1.32, .28, -2.4, 1.4, 0), clip: .55, exp: .12, rpm: 120, fades: {}, dwell: 5200 },
    { t: '排气 · 等长管', s: 'Ø40mm 初段 · 玻纤隔热布缠绕 · 三合一收集器', tag: '排气初段', at: 'exhaust', view: V(-3.55, 1.26, .5, -5.7, 2.2, -1.3), clip: 0, exp: 0, rpm: 620, fades: {}, dwell: 5000 },
    { t: '后置单涡轮', s: '2026 规则：非分体 · 压气机在后 · 进气口朝车尾', tag: '涡轮 / 压气机', at: 'turbo', view: V(-.55, 1.2, .26, -2.6, 3.0, 7.7), clip: 0, exp: 0, rpm: 620, fades: {}, dwell: 5200 },
    { t: '离合器总成', s: '机加工壳体板 · 膜片弹簧 · 与变速箱对接面', tag: '离合器', at: 'clutchL', view: V(.3, 1.3, .22, 0, 1.1, 6.5), clip: 0, exp: .5, rpm: 0, fades: {}, dwell: 5200 },
    { t: 'MGU-K · 350kW', s: '与曲轴固定速比 · 制动能量回收 · 禁止独立驱动', tag: 'MGU-K', at: 'mguk', view: V(-1.55, 1.26, .24, 3.9, 1.0, 5.2), clip: 0, exp: .06, rpm: 0, fades: {}, dwell: 5200 },
    { t: '正时传动 · 前端', s: '曲轴齿轮 → 惰轮 → 双凸轮轴齿轮 · 碳纤维正时罩已淡出', tag: '正时罩', at: 'timingL', view: V(-2.95, 1.2, .22, -1.2, 2.3, -5.8), clip: 0, exp: .22, rpm: 80, fades: { timing: .05 }, dwell: 5400 },
    { t: '分解 · 装配关系', s: '气门室盖 → 缸盖 → 活塞连杆 → 缸体 → 曲轴 → 油底壳', tag: '气门室盖', at: 'coverL', view: V(-2.35, 1.14, 1.04, 0, 3.6, 0), clip: 0, exp: 1, rpm: 0, fades: {}, dwell: 6000 },
    { t: '全零件图解', s: '分解到底 · 每个部件的名称直接标在图上 · 曲轴已停转', tag: null, at: null, view: V(-PI / 2, 1.1, .92, 0, 3.4, 0), clip: 0, exp: 1, rpm: 0, fades: {}, dwell: 13000, diagram: true },
    { t: '回到整机', s: '循环播放 · 空格暂停 · ← → 切换 · Esc 退出', tag: '进气箱', at: 'plenum', view: V(W0, 1.26, 1, 0, 3.2, 0), clip: 0, exp: 0, rpm: 620, fades: {}, dwell: 4600 }
  ];

  const tour = { active: false, i: 0, paused: false, t: 0, save: null };
  const tourEl = $('#tour'), tourBar = $('#tourBar');
  const tourFx = $('#tourFx'), tourPoly = $('#tourPoly'), tourDot = $('#tourDot'), tourHalo = $('#tourHalo'), tourTag = $('#tourTag');

  function tourStation() { return TOUR[tour.i]; }

  function applyStation() {
    const st = tourStation();
    $('#tourIdx').textContent = String(tour.i + 1).padStart(2, '0');
    $('#tourTitle').textContent = st.t;
    $('#tourSub').textContent = st.s;
    tourTag.textContent = st.tag || '';
    tourFx.style.opacity = st.tag ? '1' : '0';

    // camera
    if (st.view) flyTo(st.view, 1.9);

    // clip / explode state with UI sync
    state.clip = st.clip || 0;
    state.explode = st.exp || 0;
    clipEl.value = Math.round(state.clip * 100);
    expEl.value = Math.round(state.explode * 100);
    clipVal.textContent = Math.round(state.clip * 100) + '%';
    expVal.textContent = Math.round(state.explode * 100) + '%';
    model.setClip(state.clip);
    model.setExplode(state.explode);

    // fades
    stationFades = Object.assign({}, st.fades || {});
    applyFades();

    // rotation speed
    state.rpm = st.rpm;
    rpmEl.value = st.rpm;
    rpmVal.textContent = st.rpm + ' RPM';

    // extracted valve
    model.setExtract(st.extract || 0);

    tour.t = 0;
    tourBar.style.width = '0%';
    document.body.classList.toggle('diagram', !!st.diagram);
    tourTag.style.display = st.tag ? '' : 'none';
    tourPoly.style.display = st.tag ? '' : 'none';
    tourDot.style.display = st.tag ? '' : 'none';
    tourHalo.style.display = st.tag ? '' : 'none';
    $('#tourPause').innerHTML = tour.paused ? '&#9654;' : '&#10074;&#10074;';
  }

  function saveState() {
    return {
      running: state.running, rpm: state.rpm, clip: state.clip, explode: state.explode,
      xray: state.xray, labels: state.labels, autoOrbit: cam.autoOrbit,
      cam: { theta: cam.theta, phi: cam.phi, radius: cam.radius, target: cam.target.clone() }
    };
  }
  function startTour() {
    if (tour.active) return;
    tour.save = saveState();
    tour.active = true;
    tour.i = 0;
    tour.paused = false;
    tour.t = 0;
    document.body.classList.add('touring');
    setOrbit(false);
    setActiveView('');
    setRunning(true);
    tourEl.style.pointerEvents = 'auto';
    applyStation();
  }
  function exitTour(silent) {
    if (!tour.active) return;
    const s = tour.save;
    tour.active = false;
    document.body.classList.remove('touring', 'diagram');
    tourTag.style.display = 'none';
    if (s) {
      setRunning(s.running);
      state.rpm = s.rpm; rpmEl.value = s.rpm; rpmVal.textContent = s.rpm + ' RPM';
      state.clip = s.clip; clipEl.value = Math.round(s.clip * 100); clipVal.textContent = Math.round(s.clip * 100) + '%';
      state.explode = s.explode; expEl.value = Math.round(s.explode * 100); expVal.textContent = Math.round(s.explode * 100) + '%';
      model.setClip(s.clip); model.setExplode(s.explode);
      state.xray = s.xray; xrayBtn.classList.toggle('on', s.xray);
      state.labels = s.labels; labelBtn.classList.toggle('on', s.labels);
      hotspotsEl.style.display = s.labels ? '' : 'none';
      stationFades = {}; applyFades();
      model.setExtract(0);
      cam.theta = s.cam.theta; cam.phi = s.cam.phi; cam.radius = s.cam.radius;
      cam.target.copy(s.cam.target);
      cam.tTheta = cam.theta; cam.tPhi = cam.phi; cam.tRadius = cam.radius; cam.tTarget.copy(cam.target);
      trans = null;
      setOrbit(s.autoOrbit);
    }
  }
  function gotoStation(i) {
    tour.i = (i + TOUR.length) % TOUR.length;
    applyStation();
  }
  $('#tourBtn').addEventListener('click', startTour);
  $('#tourPrev').addEventListener('click', () => gotoStation(tour.i - 1));
  $('#tourNext').addEventListener('click', () => gotoStation(tour.i + 1));
  $('#tourClose').addEventListener('click', () => exitTour());
  $('#tourPause').addEventListener('click', () => {
    tour.paused = !tour.paused;
    $('#tourPause').innerHTML = tour.paused ? '&#9654;' : '&#10074;&#10074;';
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (tour.active) { tour.paused = !tour.paused; $('#tourPause').innerHTML = tour.paused ? '&#9654;' : '&#10074;&#10074;'; }
      else setRunning(!state.running);
    } else if (tour.active) {
      if (e.code === 'ArrowRight') { e.preventDefault(); gotoStation(tour.i + 1); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); gotoStation(tour.i - 1); }
      if (e.code === 'Escape') { exitTour(); }
    }
  });

  /* ---------------- tour annotation ---------------- */
  const tagPos = new THREE.Vector3();
  function updateTourFx() {
    if (!tour.active) return;
    const st = tourStation();
    if (!st.at || !HT[st.at]) return;
    HT[st.at].anchor.getWorldPosition(tagPos);
    const viewZ = tagPos.clone().applyMatrix4(camera.matrixWorldInverse).z;
    tagPos.project(camera);
    if (viewZ > -.3) { tourTag.style.display = 'none'; return; }
    const ax = (tagPos.x * .5 + .5) * window.innerWidth;
    const ay = (-tagPos.y * .5 + .5) * window.innerHeight;
    const right = ax < window.innerWidth * .62;
    const dx = right ? 62 : -62, dy = ay > 220 ? -58 : 58;
    const tx = ax + dx, ty = ay + dy;
    tourTag.style.display = '';
    tourTag.style.left = tx + 'px';
    tourTag.style.top = (ty - (dy < 0 ? 0 : 0)) + 'px';
    tourPoly.style.display = '';
    tourDot.style.display = '';
    tourHalo.style.display = '';
    const ex = ax + (right ? 22 : -22), ey = ay + (dy < 0 ? -20 : 20);
    tourPoly.setAttribute('points', ax + ',' + ay + ' ' + ex + ',' + ey + ' ' + tx + ',' + (ty + (dy < 0 ? 12 : -12)));
    tourDot.setAttribute('cx', ax); tourDot.setAttribute('cy', ay);
    tourHalo.setAttribute('cx', ax); tourHalo.setAttribute('cy', ay);
  }

  /* ---------------- mobile fold ---------------- */
  const fold = $('#fold');
  fold.addEventListener('click', () => {
    const f = document.body.classList.toggle('panel-folded');
    fold.textContent = f ? '+' : '−';
    fold.setAttribute('aria-label', f ? '展开控制面板' : '折叠控制面板');
  });

  /* ---------------- resize ---------------- */
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    const oldFit = fitRadius();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    post.resize();
    const k = fitRadius() / oldFit;
    if (k !== 1) {
      cam.radius *= k; cam.tRadius *= k;
      if (trans) { trans.from.radius *= k; trans.to.radius *= k; }
    }
  }
  window.addEventListener('resize', onResize);

  /* ---------------- loop ---------------- */
  const clock = new THREE.Clock();
  let frame = 0;
  let firstFrame = true;

  function updateTour(dt) {
    if (!tour.active) return;
    if (!tour.paused) {
      tour.t += dt;
      const st = tourStation();
      tourBar.style.width = Math.min(100, tour.t / (st.dwell / 1000) * 100) + '%';
      if (tour.t >= st.dwell / 1000) {
        if (tour.i === TOUR.length - 1) gotoStation(0);
        else gotoStation(tour.i + 1);
      }
    }
    updateTourFx();
  }

  function loop() {
    const dt = Math.min(clock.getDelta(), .05);
    frame++;

    if (state.running && state.rpm > 0) {
      state.crank += dt * (state.rpm / 60) * TAU * .14;
    }
    model.animate(state.crank);

    tickCamera(dt);
    updateHotspots();
    updateTour(dt);

    angleVal.textContent = String(Math.round(((state.crank * 180 / PI) % 720 + 720) % 720)).padStart(3, '0') + '°';

    if (frame % 8 === 0) renderer.shadowMap.needsUpdate = true;
    post.render();

    if (firstFrame) {
      firstFrame = false;
      setTimeout(() => loader.classList.add('gone'), 520);
    }
    requestAnimationFrame(loop);
  }

  // initial UI
  window.__f1 = { scene: scene, camera: camera, renderer: renderer, floor: floor, model: model, state: state, cam: cam, key: key, hemi: hemi, fill: fill, rim: rim, valley: valley, contact: contact };
  renderer.shadowMap.needsUpdate = true;
  setRunning(true);
  model.setClip(0);
  model.setExplode(0);
  model.animate(state.crank);
  setTimeout(() => { applyFades(); onResize(); }, 60);
  requestAnimationFrame(loop);
})();
