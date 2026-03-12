import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer
} from "three";

export class War3Scene {
  readonly canvas: HTMLCanvasElement;

  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: OrthographicCamera;
  private resizeObserver?: ResizeObserver;
  private clock = new Clock();
  private rootGroup = new Group();
  private hero?: Group;
  private npc?: Group;
  private heroBaseY = 0;
  private npcBaseY = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "block size-full";

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor("#9fd2ff");

    this.scene = new Scene();
    this.scene.background = new Color("#9fd2ff");

    const aspect = 16 / 9;
    const viewSize = 24;
    this.camera = new OrthographicCamera((-viewSize * aspect) / 2, (viewSize * aspect) / 2, viewSize / 2, -viewSize / 2, 0.1, 100);
    this.camera.position.set(15, 17, 15);
    this.camera.lookAt(0, 0, 0);

    this.setupLights();
    this.buildWorld();
  }

  mount(host: HTMLElement) {
    host.appendChild(this.canvas);
    this.resize(host);
    this.resizeObserver = new ResizeObserver(() => this.resize(host));
    this.resizeObserver.observe(host);
    this.renderer.setAnimationLoop(() => this.render());
  }

  dispose() {
    this.resizeObserver?.disconnect();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }

  pulseUnits() {
    if (this.hero) this.hero.position.y = this.heroBaseY + 0.25;
    if (this.npc) this.npc.position.y = this.npcBaseY + 0.25;
  }

  private resize(host: HTMLElement) {
    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 240);
    const aspect = width / height;
    const viewSize = 24;

    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  }

  private setupLights() {
    const ambient = new AmbientLight("#dbe9ff", 2.2);
    const sun = new DirectionalLight("#fff1c6", 1.7);
    sun.position.set(12, 20, 10);
    this.scene.add(ambient, sun);
  }

  private buildWorld() {
    const terrain = new Mesh(
      new PlaneGeometry(30, 30, 1, 1),
      new MeshStandardMaterial({
        color: "#588d3b",
        map: createCheckerTexture("#5f9640", "#57893b", 8)
      })
    );
    terrain.rotation.x = -Math.PI / 2;
    this.scene.add(terrain);

    const path = new Mesh(
      new PlaneGeometry(6, 26),
      new MeshStandardMaterial({
        color: "#9b7a4c",
        map: createCheckerTexture("#a78756", "#937245", 6)
      })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, 1);
    this.scene.add(path);

    const crossPath = path.clone();
    crossPath.geometry = new PlaneGeometry(24, 5);
    crossPath.rotation.x = -Math.PI / 2;
    crossPath.position.set(1, 0.021, 0);
    this.scene.add(crossPath);

    const river = new Mesh(
      new PlaneGeometry(7, 14),
      new MeshStandardMaterial({
        color: "#4e98dd",
        map: createCheckerTexture("#5ea9ea", "#498fd0", 5)
      })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(9, 0.01, -5);
    this.scene.add(river);

    this.rootGroup.add(
      createCamp({ color: "#8f6c43", roof: "#314f9d", position: new Vector3(-8, 0, 6), scale: 1.25 }),
      createCamp({ color: "#83613b", roof: "#7d2f2f", position: new Vector3(8, 0, 6), scale: 1.4 }),
      createWatchTower(new Vector3(-10, 0, -7)),
      createWatchTower(new Vector3(10, 0, -8)),
      createBanner(new Vector3(-3, 0, -2), "#3157a6"),
      createBanner(new Vector3(3, 0, -2), "#8f2e2e"),
      createCrystal(new Vector3(7.5, 0, -9)),
      createCrystal(new Vector3(9.5, 0, -8)),
      createTreeCluster(new Vector3(-12, 0, 10)),
      createTreeCluster(new Vector3(12, 0, 10)),
      createTreeCluster(new Vector3(-13, 0, -11)),
      createTreeCluster(new Vector3(11, 0, -12))
    );

    this.hero = createUnit("#2f6fd0", "#c1dafb");
    this.hero.position.set(0, 0, 4.5);
    this.heroBaseY = this.hero.position.y;

    this.npc = createUnit("#8b3d24", "#ffd27a");
    this.npc.position.set(0.6, 0, -0.6);
    this.npcBaseY = this.npc.position.y;

    this.rootGroup.add(this.hero, this.npc);
    this.scene.add(this.rootGroup);
  }

  private render() {
    const elapsed = this.clock.getElapsedTime();
    this.rootGroup.rotation.y = Math.sin(elapsed * 0.16) * 0.06;

    if (this.hero) {
      const offset = Math.sin(elapsed * 4.6) * 0.04;
      this.hero.position.y += (this.heroBaseY + offset - this.hero.position.y) * 0.16;
    }

    if (this.npc) {
      const offset = Math.cos(elapsed * 4.2) * 0.04;
      this.npc.position.y += (this.npcBaseY + offset - this.npc.position.y) * 0.16;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

function createCheckerTexture(colorA: string, colorB: string, repeat = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create texture context");

  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = colorB;
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillRect(16, 16, 16, 16);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  return texture;
}

function createCamp(opts: { color: string; roof: string; position: Vector3; scale: number }) {
  const group = new Group();
  const body = new Mesh(new BoxGeometry(3, 2, 3), new MeshStandardMaterial({ color: opts.color }));
  body.position.y = 1;

  const roof = new Mesh(new CylinderGeometry(0.4, 2.8, 1.8, 4), new MeshStandardMaterial({ color: opts.roof }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.5;
  group.add(body, roof);
  group.position.copy(opts.position);
  group.scale.setScalar(opts.scale);
  return group;
}

function createWatchTower(position: Vector3) {
  const group = new Group();
  const legs = [
    [-0.7, 0.9, -0.7],
    [0.7, 0.9, -0.7],
    [-0.7, 0.9, 0.7],
    [0.7, 0.9, 0.7]
  ];

  for (const [x, y, z] of legs) {
    const leg = new Mesh(new BoxGeometry(0.2, 1.8, 0.2), new MeshStandardMaterial({ color: "#654524" }));
    leg.position.set(x, y, z);
    group.add(leg);
  }

  const top = new Mesh(new BoxGeometry(2.2, 0.3, 2.2), new MeshStandardMaterial({ color: "#8b6d45" }));
  top.position.y = 1.9;
  const fire = new Mesh(new SphereGeometry(0.35, 8, 8), new MeshStandardMaterial({ color: "#ff9f45", emissive: "#ff7b2a" }));
  fire.position.y = 2.35;
  group.add(top, fire);
  group.position.copy(position);
  return group;
}

function createBanner(position: Vector3, color: string) {
  const group = new Group();
  const pole = new Mesh(new BoxGeometry(0.15, 2.6, 0.15), new MeshStandardMaterial({ color: "#72512e" }));
  pole.position.y = 1.3;
  const cloth = new Mesh(new BoxGeometry(1.2, 1.1, 0.08), new MeshStandardMaterial({ color }));
  cloth.position.set(0.65, 1.9, 0);
  group.add(pole, cloth);
  group.position.copy(position);
  return group;
}

function createCrystal(position: Vector3) {
  const crystal = new Mesh(new CylinderGeometry(0.35, 0.65, 2.4, 6), new MeshStandardMaterial({ color: "#77d4ff", emissive: "#245a78" }));
  crystal.position.copy(position);
  crystal.position.y = 1.2;
  return crystal;
}

function createTreeCluster(position: Vector3) {
  const group = new Group();
  const offsets = [
    [0, 0],
    [1.2, 0.4],
    [-1, 0.6],
    [0.2, -1.2]
  ];

  for (const [x, z] of offsets) {
    const trunk = new Mesh(new CylinderGeometry(0.18, 0.24, 1, 6), new MeshStandardMaterial({ color: "#6c4727" }));
    trunk.position.set(x, 0.5, z);
    const crown = new Mesh(new SphereGeometry(0.9, 10, 10), new MeshStandardMaterial({ color: "#345f2e" }));
    crown.position.set(x, 1.5, z);
    group.add(trunk, crown);
  }

  group.position.copy(position);
  return group;
}

function createUnit(primary: string, secondary: string) {
  const body = new Mesh(new BoxGeometry(0.9, 1.6, 0.9), new MeshStandardMaterial({ color: primary }));
  const head = new Mesh(new SphereGeometry(0.4, 10, 10), new MeshStandardMaterial({ color: secondary }));
  head.position.y = 1.25;

  const group = new Group();
  group.add(body, head);
  return group;
}
