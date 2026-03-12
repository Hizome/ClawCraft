# ClawCraft：基于 `mdx-m3-viewer` 的点击选中方案

本文档回答以下问题：

1. 能不能点击建筑或人物模型？
2. 点击后能不能让 UI 显示人物头像、建筑信息？
3. 能不能在人物脚下或建筑脚下显示选择光环？
4. 这些事情是不是必须依赖 Three.js？

结论先说：

- 可以做到。
- 而且当前这类需求不必须依赖 Three.js。
- `mdx-m3-viewer` + 自己的选择逻辑 + React 状态管理，就能完成基础版本。

---

## 1. 需求拆解

你的需求实际由 3 部分组成：

### 1.1 点击命中

用户点击场景中的：

- 建筑模型
- 人物模型

系统需要识别“当前点中了谁”。

### 1.2 选中后的 UI 变化

当选中了某个对象后：

- UI 显示人物头像
- UI 显示人物状态
- UI 显示建筑信息
- UI 显示当前任务状态

### 1.3 选中反馈

当对象被选中时：

- 人物脚下出现选择光环
- 建筑脚下出现选择光环

---

## 2. 不用 Three.js 能不能做

可以。

原因是你目前并不需要：

- 复杂物理
- 碰撞系统
- 大规模实时拾取
- 大地图地形点击寻路

你需要的是：

- 在数量可控的对象里判断“点中了谁”
- 记录当前选中对象
- 改变 UI
- 显示一个光环实例

这完全可以自己实现。

---

## 3. 选中系统推荐实现

建议把“可选中对象”统一抽象成一个运行时结构。

```ts
type SelectableKind = "worker" | "building";

type SelectableObject = {
  id: string;
  kind: SelectableKind;
  position: { x: number; y: number; z: number };
  radius: number;
  instance: any;
  selectionRing?: any;
  meta: Record<string, unknown>;
};
```

这里最关键的是：

- `position`
- `radius`
- `instance`
- `selectionRing`

这 4 个字段足够支撑第一版点击与反馈系统。

---

## 4. 点击命中怎么做

### 4.1 第一版最推荐方案：距离命中

如果你当前场景里：

- 人物数量不多
- 建筑数量不多
- 都有明确中心点

那最简单的做法不是“精确点击模型三角面”，而是：

**把每个对象当成一个带半径的可点击区域。**

做法：

1. 鼠标点击画布
2. 计算点击落点对应的世界位置，或近似平面位置
3. 遍历所有对象
4. 找距离最近且在 `radius` 范围内的对象

伪代码：

```ts
function pickObject(worldX: number, worldZ: number, objects: SelectableObject[]) {
  let best: SelectableObject | null = null;
  let bestDist = Infinity;

  for (const object of objects) {
    const dx = object.position.x - worldX;
    const dz = object.position.z - worldZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= object.radius && dist < bestDist) {
      best = object;
      bestDist = dist;
    }
  }

  return best;
}
```

这套方法的优点：

- 简单
- 稳定
- 足够适合你现在这种任务节点场景

### 4.2 为什么不先做精确模型拾取

因为第一版没必要。

你当前目标不是：

- FPS 射击
- 超精确点击骨骼
- 复杂遮挡下拾取

你现在做的是：

- 点人物
- 点建筑
- UI 联动

所以“中心点 + 半径”最务实。

---

## 5. `mdx-m3-viewer` 在点击中的作用

它本身不会直接给你完整的点击选中系统。

但它提供了很关键的基础能力：

- `camera.screenToWorldRay()`
- `camera.worldToScreen()`

这意味着你可以：

- 从屏幕点位往世界发射射线
- 做屏幕坐标与世界坐标换算

如果后面你要做更像 RTS 的交互，可以从这里继续往下扩展。

但对第一版来说，建议不要一上来就做复杂拾取。

---

## 6. UI 联动怎么做

这一层最简单，直接交给 React 状态。

例如：

```ts
type Selection =
  | { type: "worker"; id: string }
  | { type: "building"; id: string }
  | null;
```

点击后：

```ts
setSelection({ type: "worker", id: "worker-1" });
```

然后 UI 根据 `selection` 去读数据：

- 如果是人物：
  - 显示头像
  - 显示名字
  - 显示状态：`walking / working / idle`
- 如果是建筑：
  - 显示建筑名称
  - 显示任务状态：`idle / running / done`

也就是说：

- 点击识别属于场景层
- UI 变化属于 React 层

这两层解耦是最好的。

---

## 7. 选择光环怎么做

### 7.1 推荐方案：独立光环实例

最稳的方法不是在模型内部找特殊材质，而是给每个对象额外挂一个“选择圈”。

实现方式：

- 加载一个光环模型或一个简单底盘模型
- 作为独立实例存在
- 默认隐藏
- 当对象被选中时显示

伪代码：

```ts
function showSelectionRing(object: SelectableObject) {
  if (!object.selectionRing) return;

  object.selectionRing.show();
  object.selectionRing.setLocation([
    object.position.x,
    object.position.y,
    object.position.z,
  ]);
}

function hideSelectionRing(object: SelectableObject) {
  object.selectionRing?.hide();
}
```

### 7.2 光环跟随

如果对象会移动，比如工人：

每帧更新对象位置时，同时更新光环位置。

```ts
worker.instance.setLocation([x, y, z]);
worker.selectionRing?.setLocation([x, y, z]);
```

### 7.3 建筑光环

建筑因为位置固定，更简单：

- 初始化时就在脚下
- 只有选中时 `show()`
- 取消选中时 `hide()`

---

## 8. 推荐交互流程

建议你把交互流程设计成这样：

1. 用户点击画布
2. 场景层计算点中了哪个对象
3. 更新 `selection`
4. 隐藏所有对象的光环
5. 给当前选中对象显示光环
6. React UI 根据 `selection` 切换显示内容

伪代码：

```ts
function selectObject(next: SelectableObject | null) {
  for (const object of allObjects) {
    object.selectionRing?.hide();
  }

  if (next?.selectionRing) {
    next.selectionRing.show();
  }

  if (!next) {
    setSelection(null);
    return;
  }

  setSelection({ type: next.kind, id: next.id });
}
```

---

## 9. 推荐代码分层

### 9.1 `SelectionManager`

职责：

- 保存所有可选中对象
- 接收点击事件
- 做命中判断
- 维护当前选中对象

### 9.2 `SelectionRingController`

职责：

- 创建每个对象对应的光环实例
- 同步位置
- 控制显示/隐藏

### 9.3 `SelectionPanel`

职责：

- 根据当前 `selection` 渲染人物信息或建筑信息

### 9.4 `SimulationLayer`

职责：

- 继续负责建筑状态和人物路径
- 不直接管 UI

---

## 10. 第一版最实用的策略

建议先不要做复杂拾取，先做：

### 第一步

- 每个建筑/人物有一个点击半径
- 点最近对象

### 第二步

- 选中后显示底部或右侧信息面板

### 第三步

- 脚下显示选择光环

### 第四步

- 如果以后确实需要，再升级到更精确的射线/包围体拾取

---

## 11. 一句话结论

如果你的目标是：

- 点击人物或建筑
- UI 显示对应信息
- 脚下显示选择光环

那么：

**只使用 `mdx-m3-viewer` 也可以完成。**

而且对 `ClawCraft` 当前阶段来说，这是更简单、更稳、更合适的方案。

---

## 12. 下一步建议

如果继续实现，最合理的开发顺序是：

1. 先做 `SelectionManager`
2. 先做“点击半径命中”
3. 再加 `selection` 状态和 UI 面板
4. 最后补选择光环实例

这样可以最快把“点建筑/点人物 -> UI 变化”跑通。
