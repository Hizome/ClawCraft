# ClawCraft：`mdx-m3-viewer` 接入说明

本文档基于当前项目 `web/` 中已安装的 `mdx-m3-viewer@5.12.0` 整理，目标是回答两个核心问题：

1. 它能不能让一批 `MDX` 模型在网页里“动起来”？
2. 它能不能对模型绑定操作，而不是只做静态预览？

结论先说：

- 可以，不只是静态预览。
- 它支持模型实例、动画序列、队伍颜色、贴图覆盖、摄像机控制、拾取相关坐标换算。
- 它适合做 `Warcraft 3` 模型预览器、角色展示、单位场景、带交互的模型查看器。
- 但它不是完整游戏引擎，很多“玩法层”能力仍然要你自己写。

同时必须注意一件事：

- 这个库的上游 README 明确写了：`NO LONGER ACTIVELY MAINTAINED`

所以它能用，但接入策略应该偏保守，建议封装一层，不要把全项目直接绑死在它的内部细节上。

---

## 1. 安装状态

当前项目已经安装：

- `mdx-m3-viewer@5.12.0`

安装包说明里写明它主要面向：

- `MDX` / `MDL`
- `BLP1`
- `M3`
- `W3M/W3X`

对我们当前最重要的是：

- `MDX` 模型
- `BLP` 贴图

---

## 2. 它到底能做什么

从当前安装包的导出和类型声明来看，最核心的是这几个模块：

- `viewer`
- `parsers`
- `common`
- `utils`

实际做网页模型展示时，主要用的是 `viewer`。

`viewer` 里最重要的对象有：

- `ModelViewer`
- `Scene`
- `Camera`
- `Model`
- `ModelInstance`
- `Texture`
- `GenericResource`
- `handlers`

其中 `handlers` 里和我们关系最大的是：

- `handlers.mdx`
- `handlers.blp`
- `handlers.tga`
- `handlers.dds`
- `handlers.m3`
- `handlers.War3MapViewer`

---

## 3. 最小工作流

这个库的最小流程是：

1. 创建 `canvas`
2. 创建 `ModelViewer`
3. 注册格式处理器
4. 创建 `Scene`
5. 加载模型
6. 创建模型实例
7. 把实例挂到场景里
8. 每帧调用 `updateAndRender()`

最小示例：

```tsx
"use client";

import { useEffect, useRef } from "react";

export function MdxPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      if (!canvasRef.current) return;

      const ModelViewer = (await import("mdx-m3-viewer")).default;
      const viewer = new ModelViewer.viewer.ModelViewer(canvasRef.current);

      viewer.addHandler(ModelViewer.viewer.handlers.mdx);
      viewer.addHandler(ModelViewer.viewer.handlers.blp);

      const scene = viewer.addScene();
      scene.camera.move([0, 0, 500]);

      const model = await viewer.load("/models/footman.mdx", (path) => `/assets/war3/${path}`);
      if (!model || disposed) return;

      const instance = model.addInstance();
      instance.setScene(scene);

      function step() {
        if (disposed) return;
        requestAnimationFrame(step);
        viewer.updateAndRender();
      }

      step();
    }

    void boot();

    return () => {
      disposed = true;
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

---

## 4. “动起来”到底包含哪些能力

答案是：包含，而且不止一种“动”。

### 4.1 播放模型自带动画

`MDX` 实例支持直接切动画序列：

- `setSequence(id)`
- `setSequenceLoopMode(mode)`

这意味着你可以：

- 播放站立
- 播放行走
- 播放攻击
- 播放施法
- 播放死亡

前提是模型本身带这些序列。

示例：

```ts
const instance = model.addInstance();
instance.setScene(scene);
instance.setSequence(0);
instance.setSequenceLoopMode(2);
```

常见 loop mode：

- `0`: 不循环
- `1`: 按模型默认规则
- `2`: 强制循环

### 4.2 操作模型变换

实例本身继承自通用节点系统，可以做：

- `move()`
- `setLocation()`
- `setRotation()`
- `setScale()`
- `setUniformScale()`
- `setParent()`

也就是说你可以：

- 拖动模型位置
- 做旋转展示台
- 缩放角色
- 把武器、特效、挂点跟随到父对象

示例：

```ts
instance.setLocation([0, 0, 0]);
instance.setUniformScale(1.25);
```

### 4.3 动态改队伍颜色

`MDX` 实例支持：

- `setTeamColor(id)`

这很适合做：

- 人机阵营区分
- UI 中切换玩家颜色
- 多实例同模型不同队伍展示

### 4.4 动态换贴图

`MDX` 实例支持：

- `setTexture(index, texture?)`
- `setParticle2Texture(index, texture?)`
- `setEventTexture(index, texture?)`

这意味着你可以：

- 给同一模型换皮肤
- 替换粒子贴图
- 做装备外观变化

### 4.5 显示/隐藏

实例支持：

- `show()`
- `hide()`

这适合做：

- 选择状态切换
- UI 里切换不同模型
- 分层显示不同特效

---

## 5. 能不能“绑定操作”

可以，但要区分两层：

### 5.1 可以直接绑定的层

这是 `mdx-m3-viewer` 本身就能支持的：

- 绑定按钮切换动画
- 绑定按钮切换队伍颜色
- 绑定滑杆缩放模型
- 绑定拖拽旋转摄像机
- 绑定点击切换模型实例状态
- 绑定资源选择切换贴图

这些都是“模型展示层 / 交互层”的能力。

比如：

```ts
walkButton.onclick = () => instance.setSequence(1);
attackButton.onclick = () => instance.setSequence(2);
redButton.onclick = () => instance.setTeamColor(0);
blueButton.onclick = () => instance.setTeamColor(1);
```

### 5.2 需要你自己补的层

这是它不替你完成的：

- 单位状态机
- 技能系统
- 鼠标选中逻辑
- 网格寻路
- 战斗判定
- 伤害结算
- UI 命令卡系统
- 完整地图逻辑

也就是说：

它是一个很强的 `Warcraft 3 WebGL 渲染/展示库`，不是一个完整 RTS 引擎。

---

## 6. 摄像机和“操作感”

`Scene` 自带 `camera`，`Camera` 里最有用的接口有：

- `move()`
- `setLocation()`
- `rotate()`
- `face()`
- `moveToAndFace()`
- `worldToScreen()`
- `screenToWorldRay()`

这意味着你可以做：

- 模型展示摄像机
- RPG 式角色检视
- 简单点击地面射线
- 屏幕坐标转世界坐标

这里尤其重要的是：

- `screenToWorldRay()`

它给了你从屏幕点位往世界打射线的基础能力。  
如果你后面要做“点击模型选中”“点击场景交互”，这是很关键的入口。

但它只提供坐标换算，不直接给你完整点击系统。

---

## 7. 资源加载方式

### 7.1 标准加载

使用：

- `viewer.load(src, pathSolver?, solverParams?)`

这适合：

- 加载 `.mdx`
- 自动递归加载模型依赖的 `.blp`

推荐总是配 `pathSolver`，避免模型里相对路径找不到资源。

示例：

```ts
const model = await viewer.load("units/human/Footman/Footman.mdx", (path) => {
  return `/assets/war3/${path}`;
});
```

### 7.2 通用资源加载

使用：

- `viewer.loadGeneric(fetchUrl, dataType, callback?)`

适合：

- 读配置
- 读表
- 读额外纹理
- 统一走 viewer 的缓存层

---

## 8. 适不适合我们接下来的一批 MDX 素材

适合，尤其适合下面这些场景：

### 8.1 角色/单位展示页

很适合。

你可以做：

- 英雄展示
- 单位图鉴
- 模型轮播
- 阵营预览

### 8.2 主菜单 / 种族选择

很适合。

比如：

- Human/Orc/Night Elf/Undead 四族按钮旁边放动态模型
- 鼠标悬停切换站立/攻击动画

### 8.3 HUD 中单位预览区

适合。

例如右下角单位面板里显示当前选中单位的 3D 模型。

### 8.4 真正的大地图 RTS 场景

可以尝试，但不建议一开始就这么做。

因为：

- 你还要自己处理地图、选中、寻路、碰撞、逻辑同步
- 工程复杂度会迅速上升

建议先从：

- 单模型预览
- 小型角色展示场景
- 低数量单位场景

开始。

---

## 9. 在 ClawCraft 里怎么接最稳

建议分三层：

### 第一层：`MdxViewerCanvas`

职责：

- 只负责创建 viewer、scene、camera
- 只负责 load / dispose
- 不关心业务

### 第二层：`MdxUnitPreview`

职责：

- 接收 `modelPath`
- 接收 `sequence`
- 接收 `teamColor`
- 接收 `scale`
- 接收 `rotation`

这是业务真正会复用的组件层。

### 第三层：页面/游戏 UI 层

职责：

- 按钮操作
- 当前种族切换
- 模型切换
- 事件绑定

不要在页面组件里直接堆全部 `mdx-m3-viewer` 逻辑。

---

## 10. 现阶段的明确结论

如果你的问题是：

> 我接下来会使用一系列的 mdx 素材，我能不能让他在网页上“动起来”，甚至对模型绑定操作，而不是简简单单的一个预览？

答案是：

- 能。
- 而且这是 `mdx-m3-viewer` 真正擅长的方向之一。

你可以做到：

- 播放模型动画
- 切动画序列
- 切队伍颜色
- 改贴图
- 缩放/旋转/移动模型
- 绑定 UI 操作
- 做简单点击交互

但你不能指望它自动给你：

- 完整 RTS 游戏逻辑
- 完整单位控制系统
- 完整地图玩法框架

---

## 11. 对 ClawCraft 的建议路线

建议你按这个顺序接：

1. 先做一个独立的 `MDX 模型预览组件`
2. 支持：
   - 加载 `.mdx`
   - 自动找 `.blp`
   - 切 `sequence`
   - 切 `teamColor`
   - 缩放与旋转
3. 再把它接进：
   - 种族选择页
   - HUD 的单位展示区
4. 最后再考虑是否扩展到更大的 3D/地图场景

---

## 12. 风险与注意事项

- 上游库已不活跃维护，后续问题要准备自己修。
- `MDX` 模型资源路径经常不规范，`pathSolver` 必须认真做。
- `BLP`、贴图路径、Reforged/Classic 资源混用时要提前定规范。
- 在 Next.js 里必须放到客户端组件里动态加载，不能走服务端直接执行。
- 大量模型同时播放动画时，性能要提前压测。

---

## 13. 下一步建议

下一步最值得做的是直接在 `web/` 里落一个最小可运行组件：

- `components/mdx/mdx-unit-preview.tsx`

功能建议先做：

- 传入 `modelPath`
- 传入 `sequence`
- 传入 `teamColor`
- 传入 `scale`
- 自动播放

做完这一步，ClawCraft 就真正具备接入 Warcraft 3 模型资产的基础能力了。
