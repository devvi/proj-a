# Unity 到 Godot 完整移植方案

## 1. 结论

本仓库不是一个功能完整的游戏，而是一个停留在“随机房间地图生成”阶段的 2D 原型。所谓“完整移植”应定义为：

1. 在 Godot 中等价重建 `Assets/dungeonRoom.unity` 的实际运行内容；
2. 重写两份业务脚本，保留可观察的地牢生成行为和像素美术效果；
3. 迁移项目实际使用的美术资源；
4. 不移植未被业务代码使用的 iTween，以及 ex2D 自带的九个演示场景；
5. 将第三方演示资源留在 Unity 历史分支或归档目录，不纳入 Godot 成品。

推荐在当前稳定版 **Godot 4.7** 上新建纯 Godot 2D 项目，使用 **GDScript** 重写，而不是尝试自动转换 UnityScript 或沿用旧 DLL。这个项目规模很小，人工重建比修复旧 Unity 工程后做通用转换更可靠。

## 2. 审计依据与现状

### 2.1 项目年代和可恢复性

| 项目 | 结论 | 依据 |
|---|---|---|
| Unity 版本 | Unity `4.1.2f1` | `Assembly-UnityScript.unityproj` 的编译宏为 `UNITY_4_1_2`；二进制场景中也记录了 `4.1.2f1` |
| 最后业务提交 | 2013-04-15 | 仓库只有 `7333b6d`、`deabbcf` 两次提交 |
| 序列化格式 | 二进制 | `.unity`、`.prefab`、`.asset` 和 `ProjectSettings/*.asset` 均不是 YAML 文本 |
| 元数据 | 缺失 | 仓库没有 `.meta` 文件，资源引用依赖当年的 `Library` 数据和二进制内部引用 |
| 源工程整洁度 | 较差 | `Library/`、`Temp/`、IDE 产物和 `.DS_Store` 均被提交 |

因此不能把“升级 Unity 后导出”当作唯一迁移路径。现代 Unity 已移除 UnityScript，ex2D 1.2.0 只有旧版预编译 DLL，且缺失 `.meta` 可能使资源引用在重新导入时断裂。旧环境只应作为取证工具，Godot 工程才是新的源事实。

### 2.2 实际业务范围

业务内容只有：

- 主场景：`Assets/dungeonRoom.unity`
  - 二进制内容可识别到 `Main Camera` 和 `_gameMgr`；
- 业务脚本：
  - `Assets/scripts/_gameMgr.js`：445 行，生成房间、墙、地板、门和十步随机路径；
  - `Assets/scripts/Room.js`：16 行，仅保存四类实例数组；
- 业务预制体：`Assets/prefabs/` 下 5 个；
- 业务 PNG：`Assets/gfx/` 下 10 个，共约 68 KB；
- 业务材质：`Assets/gfx/Materials/` 下 5 个。

核心算法根据正交相机可视尺寸计算房间宽高，用角块、16×16 地板块和墙块拼出房间，再以位标记表示东西南北门，递归生成长度为 10 的房间路径。

当前代码没有玩家、敌人、战斗、UI、音频、存档、网络、导航、关卡切换或正式输入逻辑。项目设置中出现相关 Unity 能力不代表项目使用了这些能力。

### 2.3 第三方内容

| 内容 | 现状 | 移植决策 |
|---|---|---|
| ex2D 1.2.0 | 旧 2D 插件；含运行时/编辑器 DLL、着色器、9 个演示场景及大量演示资源 | 业务依赖由 Godot 原生 2D 节点替代；不移植 DLL 和演示 |
| iTween | 插件源码和 1 个示例场景 | 业务脚本没有调用；不移植。未来补间使用 Godot `Tween` |
| ex2D Shader | Alpha 混合、裁剪、像素对齐、No-Z-Test | 业务精灵用 `CanvasItem` 默认透明混合即可；裁剪/像素对齐按需用 Godot 原生能力 |

仓库中 197 个非 `Library/Temp` 文件里，`Assets/ex2D` 有 144 个文件、约 3.1 MB；绝大多数是供应商演示，不是本项目功能。将它们逐项重做会制造无业务价值的工作，也会错误扩大“完整移植”的边界。

## 3. 目标技术方案

### 3.1 技术选型

- 引擎：Godot 4.7 的固定补丁版本；进入实现后锁定版本，不随意跨次版本升级；
- 渲染：2D Canvas，Compatibility 渲染器优先，覆盖老旧集显和 Web；
- 语言：类型化 GDScript；
- 坐标：Godot 原生像素坐标，`1 px = 1 unit`；
- 逻辑分辨率：在基线取证后固定；拉伸模式使用 `canvas_items`，像素风目标平台启用整数缩放；
- 测试：GDScript 无头测试加运行截图对比；
- 资产：源 PNG 直接导入，不把 Unity 材质、图集数据库或 DLL 复制进新工程。

选择 GDScript 的原因是业务代码本来就是已被 Unity 淘汰的 UnityScript，无法从“保留 C# 代码”中受益；核心重写量只有约 460 行。若团队已有强制 C# 工具链，可保持下述节点和数据设计不变，仅将脚本换成 Godot C#。

### 3.2 建议目录

```text
godot/
├── project.godot
├── assets/
│   └── dungeon/            # 从 Assets/gfx 筛选出的原始 PNG
├── scenes/
│   ├── main.tscn
│   ├── dungeon/
│   │   ├── dungeon.tscn
│   │   ├── room.tscn
│   │   └── door.tscn
│   └── debug/
│       └── generator_debug.tscn
├── scripts/
│   └── dungeon/
│       ├── dungeon_generator.gd
│       ├── room.gd
│       ├── room_layout.gd
│       └── direction.gd
├── resources/
│   └── dungeon_tileset.tres
└── tests/
    ├── test_dungeon_generator.gd
    └── fixtures/
```

Unity 原工程暂时保留在仓库根目录，等 Godot 验收完成后再决定是否移动到 `legacy-unity/`。迁移过程中不要一边重排旧工程一边做行为对照。

### 3.3 场景与组件映射

| Unity/ex2D | Godot | 说明 |
|---|---|---|
| `dungeonRoom.unity` | `main.tscn` | 新主场景 |
| `GameObject` / `Transform` | `Node2D` | 房间及容器 |
| Prefab | 可实例化 `.tscn` | 门或可复用房间组件 |
| `Camera` 正交模式 | `Camera2D` | 固定逻辑视口并处理像素对齐 |
| `exSprite` | `Sprite2D` 或 `TileMapLayer` tile | 地牢优先使用 tile |
| `exSprite.width/height` | `TileSet` tile size / `Texture2D.get_size()` | 不再依赖插件 DLL |
| `HFlip()` / `VFlip()` | tile 翻转或 `Sprite2D.flip_h/flip_v` | 保留角块和墙块朝向 |
| Z 坐标 | `z_index` 或 TileMap 层顺序 | 地板、门、墙分层 |
| `Instantiate` | `PackedScene.instantiate()` 或铺 tile | 大量静态块推荐 TileMap |
| `Room` 数组组件 | `Room` 节点加类型化集合 | 不保存无效空引用 |
| `Random.RandomRange` | `RandomNumberGenerator` | 支持显式 seed |
| iTween | `create_tween()` | 当前业务无需实现 |
| ex2D 裁剪 Shader | `Control.clip_contents` / CanvasItem Shader | 仅未来 UI 或确有裁剪时使用 |

### 3.4 Godot 节点结构

```text
Main (Node2D)
├── World (Node2D)
│   └── Dungeon (Node2D, dungeon_generator.gd)
│       └── Rooms (Node2D)
│           ├── Room_0_0 (Node2D, room.gd)
│           │   ├── Floor (TileMapLayer)
│           │   ├── Walls (TileMapLayer)
│           │   └── Doors (Node2D)
│           └── ...
└── Camera2D
```

每个房间单独实例化可保持旧工程的组织语义。地板和墙用 `TileMapLayer`，避免为每个 16×16 tile 创建一个独立节点。门在当前原型中只是图像，可用 tile；若下一阶段需要开关、碰撞或跨房间事件，则使用 `door.tscn`。

### 3.5 数据与算法重构

用纯数据先生成布局，再渲染场景，避免旧代码把随机逻辑、重复检测和实例化混在一起：

```gdscript
enum Direction { EAST = 1, SOUTH = 2, NORTH = 4, WEST = 8 }

class_name RoomLayout
var grid_position: Vector2i
var doors: int
```

核心接口建议为：

```gdscript
func generate(seed: int, room_count: int) -> Array[RoomLayout]
func build(layouts: Array[RoomLayout], viewport_size: Vector2i) -> void
```

实现规则：

1. 使用 `Dictionary[Vector2i, RoomLayout]` 做占用表，不再线性扫描动态数组；
2. 每一步从当前坐标未被占用的邻居中抽取方向；
3. 同时给当前房间和相邻房间设置一对互为相反方向的门；
4. 若没有空邻居则回溯或从已有房间重新选起点，绝不无界递归；
5. 同一 seed、房间数和视口必须生成完全相同的布局；
6. 布局生成不读取屏幕、相机或节点，便于无头测试；
7. 房间像素尺寸由固定 tile 尺寸和逻辑视口推导，但至少保证有效内部区域。

旧方向值为 `EAST=2, SOUTH=4, NORTH=8, WEST=16`。Godot 没有外部存档需要兼容，建议改为从 bit 0 开始的标准值；如果取证发现二进制资源或外部数据依赖旧值，再保留原值。

旧实现有几处不应盲目复制的缺陷：

- `attachDoorToRoom()` 在门实例化前先将未赋值的 `door` 加入数组；
- `indices` 从索引 1 开始存坐标，留下无意义的索引 0；
- 重复房间分支递归后没有立即返回，存在重复创建和状态继续执行的风险；
- 方向移动在重复分支与正常分支中不一致；
- 递归没有明确的失败上限；
- 使用 `GameObject.Find()` 按字符串查房间；
- 地板循环使用 `numX/numY`，但前面另算的 `tileNumX/tileNumY` 没有参与铺设。

迁移默认保留“意图行为”（连通、无重叠、门成对、指定数量），而不是保留这些缺陷。若必须做到 bug-for-bug 一致，应在取证阶段单独建立兼容模式。

## 4. 资产迁移

### 4.1 业务 PNG

`Assets/gfx` 包含以下原图：

- 结构：`left_top_wall.png`（48×48）、`top_wall.png`（16×32）、`floor_out_1.png`（16×16）；
- 门：`left_door_frame.png`（32×48）、`down_door_locked.png`（20×13）；
- 装饰/候选地板：`decorate_carpet_1.png`、`decorate_wall_1.png`、`floor_inner_1.png`、`floor_inner_2.png`；
- `tailszb5.png`（312×170，RGB），用途需要在基线取证时确认。

PNG 可直接复制到 Godot。导入设置统一为：

- Filter：关闭；
- Mipmaps：关闭；
- Repeat：关闭；
- 压缩：无损；
- 像素透明边缘：在实际渲染出现色边时再调整；
- 默认采样：Nearest。

然后创建一个 `TileSet`：

- tile 基准为 16×16；
- 48×48 角块和 32/48 像素门可用 Atlas tile region 或独立 `Sprite2D`；
- 将水平/垂直翻转变体配置成 tile alternative，或由铺设代码设置 transform；
- 地板、墙、门分别放在不同 `TileMapLayer`，显式控制绘制顺序。

### 4.2 不直接迁移的格式

下列文件不应直接进入 Godot：

- `.mat`：Unity/ex2D 材质二进制，Godot 无法复用；
- `.prefab`、`.unity`：Unity 4 二进制序列化；
- `_ex2D_AtlasDB.asset`、`_ex2D_SpriteAnimationDB.asset`：ex2D 专有数据库；
- `ex2D.Runtime.dll`、`ex2D.Editor.dll`：面向 Unity/Mono 3.5 的插件；
- `.shader`：ShaderLab/CG 语法与 Godot Shader 不兼容；
- `Library/`、`Temp/`、`.pidb`、`.sln`、`.csproj`：旧引擎和 IDE 生成物。

业务层只需默认 alpha 混合；旧 `SpriteBlend.shader` 的效果等价于 Godot 默认 2D 精灵。`SpriteBlendPixelPerfect.shader` 中实际像素舍入代码已被注释，不值得逐行翻译。只有在视觉对比证明必要时，才新增 Godot CanvasItem shader。

### 4.3 第三方演示的处理

将 ex2D 演示和 iTween Sample 标记为 `legacy/vendor-samples`，不进入 Godot 导出：

- 如果目标只是迁移本项目，保留 Git 历史即可；
- 如果法律或归档要求必须可浏览，可把原始文件留在 Unity 归档，不转成 Godot 场景；
- 只有产品负责人明确确认这些演示也是交付功能时，才另建迁移清单。届时分别映射到 `AnimatedSprite2D`、`AnimationPlayer`、`GPUParticles2D`、Godot `Control` 和 `Tween`。

还应确认 ex2D、iTween 以及演示美术的许可证。仓库当前只有 readme，没有清晰的许可证文件；未确认前不得把供应商演示素材随 Godot 成品发布。

## 5. 分阶段执行与质量门

### 阶段 A：冻结范围并建立可观察基线

任务：

1. 明确目标平台、窗口策略和“完整”的业务边界；
2. 用隔离的 Unity 4.1.2 环境尝试打开原工程，禁止现代 Unity 原地升级；
3. 记录主场景节点、相机 `orthographicSize`、窗口尺寸、各 prefab 的锚点/尺寸/Z 值和材质；
4. 固定至少 10 组随机运行结果，录屏并截取房间边界、门朝向、相邻关系；
5. 尝试 AssetRipper 等工具读取二进制场景；输出只用于取证，不直接作为 Godot 源资产。

质量门：

- 得到可复核的主场景截图或明确记录“旧工程无法启动”；
- 每个业务 prefab 都有节点、纹理、pivot、transform 对照表；
- 已确认逻辑分辨率和目标平台。

若旧 Unity 无法恢复，不阻塞迁移：依据 PNG 尺寸、两份业务脚本和二进制字符串信息人工重建，并将“视觉近似、功能等价”写入验收口径。

### 阶段 B：Godot 骨架与资产管线

任务：

1. 创建 `godot/project.godot`、主场景和 Camera2D；
2. 配置渲染器、逻辑视口、整数缩放和输入默认值；
3. 导入业务 PNG，统一像素纹理设置；
4. 创建 TileSet、房间场景和三层 TileMap；
5. 增加可视化调试开关：seed、网格坐标、门 bitmask、房间边界。

质量门：

- 无脚本错误和缺失资源；
- 单房间四角、四边、地板和四向门均可独立预览；
- 1×、2×、3× 缩放无纹理过滤和 tile 接缝。

### 阶段 C：生成逻辑重写

任务：

1. 实现纯数据 `generate()`；
2. 实现布局到房间实例的 `build()`；
3. 处理视口变化；默认采用固定逻辑视口，不因物理窗口尺寸改变生成拓扑；
4. 加入 seed 输入与调试重生成；
5. 明确装饰图、锁门图当前是未使用资产，不擅自添加新玩法。

质量门：

- 默认生成恰好 10 个唯一房间；
- 所有相邻门互相对应；
- 所有房间从起点可达；
- 同 seed 可复现；
- 大批量 seed 测试没有死循环、越界或重复坐标；
- 节点重生成后无遗留房间或引用。

### 阶段 D：表现对齐

任务：

1. 对齐旧版 pivot、翻转、旋转和绘制层级；
2. 对齐房间在相机中的边界与不同宽高比表现；
3. 检查 alpha、透明边缘、像素抖动和 tile 接缝；
4. 用 Godot 默认渲染替代旧 shader，仅对真实差异写专用 shader。

质量门：

- 目标逻辑分辨率下，房间尺寸、门中心和四角位置与基线一致；
- 相同布局的截图通过人工视觉验收；
- Camera2D 平移时没有亚像素闪烁。

### 阶段 E：平台导出和仓库收尾

任务：

1. 仅为已确认的平台安装并固定 export templates；
2. 创建版本化的 `export_presets.cfg`，敏感签名信息不入库；
3. 配置无头检查、脚本静态检查、测试和最小启动冒烟；
4. 增加 Godot 专用 `.gitignore`，排除 `.godot/` 和导出目录；
5. 验收后再删除或归档 `Library/`、`Temp/`、IDE 产物；此清理应独立提交；
6. 补充运行、测试、导出和资源授权说明。

质量门：

- 每个目标平台可启动、生成地图、退出且无错误日志；
- 干净 clone 后可按文档导入并运行；
- 仓库不再依赖 Unity 安装即可构建 Godot 版本；
- 发布包不包含 ex2D/iTween 演示和编辑器 DLL。

## 6. 测试策略

### 6.1 生成器单元测试

至少覆盖：

- `room_count` 为 1、10 和较大压力值；
- 固定 seed 的快照；
- 位置唯一性；
- 门位标记合法性；
- 东西、南北门互反；
- 从 `(0, 0)` 遍历可达所有房间；
- 极窄或极小视口时返回明确错误或采用最小房间尺寸；
- 连续重生成不会增加旧节点；
- 多组 seed 压力测试无无限递归。

### 6.2 场景与视觉测试

- 单房间四方向门组合截图；
- 默认十房间截图；
- 横屏、竖屏、超宽屏截图；
- 不同整数缩放截图；
- 调试覆盖层截图；
- 连续生成时监控节点数和帧时间。

旧项目随机数不可控且存在逻辑缺陷，不适合做逐帧黄金标准。应对齐几何规则和视觉锚点，并给 Godot 新实现建立确定性黄金 fixture。

### 6.3 性能基线

当前规模只有 10 个房间，性能风险很低，但仍应设约束：

- 生成过程不能逐帧泄漏节点或资源；
- 静态地板和墙使用 TileMap，不为每块 tile 保留独立脚本；
- 生成应在一帧或受控分批中完成，不能无界递归；
- Debug overlay 在发布构建关闭。

## 7. 风险与处理

| 风险 | 严重度 | 处理 |
|---|---:|---|
| Unity 二进制场景且无 `.meta` | 高 | 旧版 Unity/AssetRipper 双路径取证；5 个 prefab 人工重建兜底 |
| UnityScript 已移除 | 高 | 不升级脚本链，直接按行为重写为 GDScript |
| ex2D DLL 无源码且年代久远 | 高 | 用 Sprite2D/TileMapLayer/AnimationPlayer 原生替代 |
| 旧代码自身存在生成 bug | 高 | 先定义意图行为；测试唯一、连通、门互反和终止性 |
| 相机尺寸/像素单位未知 | 中 | 阶段 A 读取二进制或运行旧版，冻结逻辑视口和 pivot |
| 第三方演示授权不明 | 中 | 不随产品迁移或发布，先确认许可证 |
| 目标平台未指定 | 中 | 架构保持平台无关；导出阶段再按明确平台配置 |
| 把演示误当业务功能 | 中 | 以主场景引用和业务脚本调用为准，变更范围需书面确认 |

## 8. 工作量结构

不按日历时间承诺，按技术复杂度拆分如下：

| 工作包 | 相对复杂度 | 原因 |
|---|---:|---|
| 旧工程取证 | 高 | 二进制格式、Unity 4.1.2、缺失 `.meta`、旧 DLL |
| Godot 工程骨架 | 低 | 单场景、纯 2D、无外部服务 |
| 业务 PNG 与 TileSet | 低 | 仅 10 张小 PNG、无模型和音频 |
| 地牢生成器重写 | 中 | 代码少，但需修正重复/递归/门一致性 |
| 视觉对齐 | 中 | 需要确认 ex2D pivot、单位和相机设置 |
| 自动化测试 | 中 | 需为旧原型补建确定性和结构测试 |
| 平台导出 | 待定 | 取决于桌面、Web、Android 或 iOS 的实际目标 |

影响范围最大的不确定项不是编码，而是旧场景取证和“是否必须移植供应商演示”的产品决策。

## 9. 交付物

实施完成后应包含：

1. 可直接打开的 `godot/` 工程；
2. `main.tscn`、房间/门子场景、TileSet 和业务 PNG；
3. 确定性的地牢布局生成器与场景构建器；
4. 生成器单元测试、场景冒烟测试和视觉基线；
5. 目标平台导出配置；
6. 架构、资源来源、运行、测试、导出说明；
7. Unity 到 Godot 的资源/行为对照表；
8. 旧工程归档及第三方许可证清单。

## 10. 最终验收标准

满足以下条件即可认定本项目已完整移植：

- Godot 是唯一运行时依赖，主功能不加载 Unity 资产或旧 DLL；
- 能生成指定数量、无重复、全连通、门互相对应的房间；
- 默认行为等价于旧原型的十房间随机地牢；
- 墙角、墙、地板、门的像素效果和层级通过基线对比；
- 固定 seed 可复现；
- 指定目标平台全部通过启动和生成冒烟测试；
- 干净 clone 可按文档复现构建；
- ex2D/iTween 业务依赖全部移除；
- 未使用的第三方演示不会进入发布包；
- 所有与旧版缺陷不同的行为都在迁移记录中明确说明。

## 11. 开工前必须确认的决策

实施前只需要产品/技术负责人确认四项：

1. “完整”是否仅指 `dungeonRoom.unity` 的实际功能，还是错误地把 ex2D/iTween 示例也算产品功能；
2. 首发目标平台及逻辑分辨率；
3. 生成器是保留旧缺陷，还是按本方案实现稳定的意图行为；
4. 是否拥有并允许发布 `Assets/gfx` 与第三方资源的授权。

默认建议分别是：仅迁移实际产品功能；先桌面加 Web；修正旧缺陷；仅发布授权明确的业务 PNG。
