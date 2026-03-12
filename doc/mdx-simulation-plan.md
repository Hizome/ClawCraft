# ClawCraft：基于 `mdx-m3-viewer` 的建筑与人物调度方案

本文档用于回答一个非常具体的问题：

> 如果只使用 `mdx-m3-viewer`，能不能完成建筑状态切换、人物沿固定路线行走、到建筑附近后播放工作动画？

结论先说：

- 可以。
- 而且以你当前描述的需求来看，`mdx-m3-viewer` 已经足够。
- 暂时不需要为了这套需求引入更复杂的 3D 引擎逻辑。

---

## 1. 目标需求

你目前要做的是一个“调度型”的模型场景，而不是开放式 RTS。

需求可以拆成两类对象：

### 1.1 建筑对象

建筑放在地图上的固定点位，用来表示任务。

建筑需要具备的能力：

- 固定位置显示
- 可设置朝向和缩放
- 根据任务状态切换动画

任务状态示例：

- `idle`
- `running`
- `done`

对应动画示例：

- `idle -> stand`
- `running -> work / spell / alternate`
- `done -> stand alternate / done / upgrade`

前提是模型本身带这些动画序列。

### 1.2 人物对象

人物模型不需要玩家控制，而是沿预设路线自动行走。

人物需要具备的能力：

- 出现在固定起点
- 沿设定路线移动
- 到目标建筑附近后停止
- 切换为工作动画

人物状态示例：

- `idle`
- `walking`
- `working`

对应动画示例：

- `idle -> stand`
- `walking -> walk`
- `working -> work / spell`

---

## 2. 只用 `mdx-m3-viewer` 能不能完成

可以。

原因很简单，你当前需要的能力主要是三类：

1. 模型实例化
2. 模型变换
3. 动画切换

而这些能力 `mdx-m3-viewer` 都有。

### 2.1 模型实例化

```ts
const model = await viewer.load("worker.mdx", pathSolver);
const instance = model.addInstance();
instance.setScene(scene);
```

### 2.2 模型位置/旋转/缩放

实例支持：

- `setLocation()`
- `move()`
- `setRotation()`
- `setScale()`
- `setUniformScale()`

这足够完成：

- 建筑固定摆放
- 人物沿路径移动
- 人物面朝移动方向

### 2.3 动画控制

`MDX` 实例支持：

- `setSequence(id)`
- `setSequenceLoopMode(mode)`

这足够完成：

- 建筑状态切动画
- 人物在 `walk / work / idle` 之间切换

所以结论是：

**你的需求是“调度式模型展示 + 预设状态驱动”，不是完整游戏逻辑，`mdx-m3-viewer` 足够承担这一层。**

---

## 3. 为什么现在不一定需要 Three.js

你现在不是要做：

- 鼠标点地移动
- 实时寻路
- 碰撞系统
- 大地图地形编辑
- 大量单位战斗

你只是要：

- 放建筑
- 放人物
- 让人物走预设路径
- 让建筑和人物切动画

这个层级本质上是：

**业务状态机 + 模型变换 + 动画控制**

不需要完整 3D 世界引擎。

Three.js 以后可能有价值，但对这个阶段不是必需品。

---

## 4. 推荐架构

建议在 `ClawCraft` 里把逻辑分成 4 层。

### 4.1 Viewer 层

职责：

- 创建 `ModelViewer`
- 创建 `Scene`
- 注册 `mdx/blp` handler
- 统一驱动 `updateAndRender()`

这个层只负责渲染运行时，不负责业务。

### 4.2 Asset 层

职责：

- 加载模型
- 缓存模型
- 提供 `createBuildingInstance()`
- 提供 `createWorkerInstance()`

这个层负责资源和实例工厂。

### 4.3 Simulation 层

职责：

- 管理建筑状态
- 管理人物路线
- 每帧更新人物位置
- 人物到点后切换状态
- 联动建筑动画

这是最关键的一层。

### 4.4 UI / Page 层

职责：

- 选择任务
- 切换建筑状态
- 显示当前人物工作状态
- 调试按钮

---

## 5. 推荐的数据结构

### 5.1 建筑

```ts
type BuildingTaskState = "idle" | "running" | "done";

type BuildingConfig = {
  id: string;
  modelPath: string;
  position: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: number;
  sequences: {
    idle: number;
    running: number;
    done: number;
  };
};
```

运行态：

```ts
type BuildingRuntime = {
  config: BuildingConfig;
  instance: any;
  state: BuildingTaskState;
};
```

### 5.2 人物

```ts
type WorkerState = "idle" | "walking" | "working";

type RoutePoint = {
  x: number;
  y: number;
  z: number;
};

type WorkerConfig = {
  id: string;
  modelPath: string;
  speed: number;
  scale?: number;
  startPosition: RoutePoint;
  route: RoutePoint[];
  sequences: {
    idle: number;
    walk: number;
    work: number;
  };
  targetBuildingId: string;
};
```

运行态：

```ts
type WorkerRuntime = {
  config: WorkerConfig;
  instance: any;
  state: WorkerState;
  routeIndex: number;
  position: RoutePoint;
};
```

---

## 6. 建筑怎么实现

建筑最简单。

初始化时：

1. 加载建筑模型
2. 创建实例
3. 放到固定坐标
4. 设置默认动画为 `idle`

伪代码：

```ts
async function createBuilding(viewer, scene, config) {
  const model = await viewer.load(config.modelPath, pathSolver);
  if (!model) return null;

  const instance = model.addInstance();
  instance.setScene(scene);
  instance.setLocation(config.position);

  if (config.scale) {
    instance.setUniformScale(config.scale);
  }

  instance.setSequence(config.sequences.idle);
  instance.setSequenceLoopMode(2);

  return {
    config,
    instance,
    state: "idle",
  };
}
```

状态切换时：

```ts
function setBuildingState(building, state) {
  building.state = state;

  if (state === "idle") {
    building.instance.setSequence(building.config.sequences.idle);
  } else if (state === "running") {
    building.instance.setSequence(building.config.sequences.running);
  } else if (state === "done") {
    building.instance.setSequence(building.config.sequences.done);
  }
}
```

---

## 7. 人物路线怎么实现

人物的关键不是“寻路”，而是“预设路径插值”。

也就是说：

- 你已经提前给出路线点
- 每帧只需要往下一个点推进
- 到点后切下一个点
- 到终点后进入 `working`

### 7.1 路径更新逻辑

伪代码：

```ts
function updateWorker(worker, dt) {
  if (worker.state !== "walking") return;

  const target = worker.config.route[worker.routeIndex];
  if (!target) {
    worker.state = "working";
    worker.instance.setSequence(worker.config.sequences.work);
    return;
  }

  const dx = target.x - worker.position.x;
  const dy = target.y - worker.position.y;
  const dz = target.z - worker.position.z;

  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist < 0.001) {
    worker.routeIndex += 1;

    if (worker.routeIndex >= worker.config.route.length) {
      worker.state = "working";
      worker.instance.setSequence(worker.config.sequences.work);
    }

    return;
  }

  const step = worker.config.speed * dt;
  const t = Math.min(1, step / dist);

  worker.position.x += dx * t;
  worker.position.y += dy * t;
  worker.position.z += dz * t;

  worker.instance.setLocation([worker.position.x, worker.position.y, worker.position.z]);
}
```

### 7.2 行走朝向

如果你想让人物朝着路线方向走，需要额外根据移动向量更新旋转。

也就是说：

- 用当前点到目标点的方向算朝向
- 每帧或每段更新一次 `setRotation()`

这一步要根据模型的朝向约定来调，但技术上完全可做。

---

## 8. 人物到建筑后如何联动

这是你需求里的核心业务。

推荐逻辑：

1. 人物开始时状态是 `walking`
2. 建筑开始时状态是 `idle`
3. 当人物到达建筑目标点附近：
   - 人物切 `working`
   - 建筑切 `running`
4. 当任务结束：
   - 人物切 `idle`
   - 建筑切 `done`

伪代码：

```ts
if (worker.state === "walking" && workerArrived(worker, building)) {
  worker.state = "working";
  worker.instance.setSequence(worker.config.sequences.work);

  setBuildingState(building, "running");
}

if (taskFinished(building)) {
  worker.state = "idle";
  worker.instance.setSequence(worker.config.sequences.idle);

  setBuildingState(building, "done");
}
```

---

## 9. 能做到什么程度

### 9.1 能做到的

只用 `mdx-m3-viewer`，你可以做到：

- 地图上固定摆放建筑
- 按任务状态切建筑动画
- 地图上固定摆放人物
- 人物沿预设路线移动
- 人物到目标点后切工作动画
- 人物和建筑状态联动
- 根据 UI 或数据驱动整个流程

这已经足够完成“任务场景化表达”。

### 9.2 做起来会比较费劲但不是不能做的

- 多人物同时调度
- 多建筑同时排队任务
- 挂点特效
- 粒子切换
- 复杂相机移动

### 9.3 暂时不建议靠它直接承担的

- 完整大地图系统
- 鼠标点击地形选点移动
- RTS 寻路
- 碰撞检测
- 大规模单位行为树

这些不是它的强项。

---

## 10. 当前阶段对 ClawCraft 的建议

按你现在的需求，建议分 3 步走。

### 第一步：单建筑 + 单人物

最小 Demo：

- 1 个建筑
- 1 个人物
- 人物从起点走到建筑
- 到达后切 `work`
- 建筑切 `running`

### 第二步：任务完成状态

加入：

- 定时完成
- 建筑切 `done`
- 人物切回 `idle`

### 第三步：多任务扩展

再扩展到：

- 多建筑
- 多人物
- 任务分配
- UI 触发

---

## 11. 一句话结论

如果你的目标是：

- 建筑作为任务节点
- 建筑有状态动画
- 人物按预设路线移动
- 人物到建筑附近后工作

那么：

**只使用 `mdx-m3-viewer` 就可以完成。**

对 `ClawCraft` 来说，这条路线是可行的，而且是当前阶段最务实的方案。

---

## 12. 下一步建议

下一步最合理的是直接落一个最小可运行原型：

- `1` 个建筑实例
- `1` 个工人实例
- `1` 条预设路线
- `3` 个状态：
  - 建筑：`idle/running/done`
  - 工人：`walking/working/idle`

等这个最小原型跑起来，再考虑是否需要进一步引入 Three.js 做更复杂的场景控制。
