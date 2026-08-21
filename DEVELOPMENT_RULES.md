# Mock API 开发规范

本文档用于约束后续 Mock API 的目录结构、路由注册方式、Schema 定义和数据生产方式。新增接口前应先遵守本规范。

## 一、目录职责

```text
src/
├── core/
│   ├── mock.ts       # Mock Router 与 mock.resource 能力
│   ├── resource.ts   # Resource 的 CRUD、分页、搜索、过滤、排序实现
│   └── schema.ts     # 统一的 OpenAPI Schema helper
├── demo/             # 仅供参考的示例数据，不参与构建和运行
├── factories/
│   └── index.ts      # 所有 Mock 数据生产逻辑
├── routes/
│   └── index.ts      # 所有接口注册与路由级 schema
├── utils/            # 通用工具函数
├── types.ts          # 领域数据类型与公共类型
└── config.ts         # 全局配置与初始化
```

目录规则：

- `src/routes` 只负责注册接口、组装 factory 数据和声明 schema，不负责生产数据。
- `src/demo` 只存放参考数据或示例结构，不参与构建、运行和接口响应。
- `src/factories/index.ts` 负责生成完整的 Mock 数据，包括默认数据集合和单条数据生成函数。
- `src/core/schema.ts` 是唯一的 schema helper 来源。路由中不得自行创建 OpenAPI schema 工具。
- `src/core` 只维护通用基础能力，不放具体业务数据或业务字段。
- `src/utils` 只放与具体业务无关的可复用逻辑。

`src/demo` 使用规则：

- `src/demo` 已从 `tsconfig.json` 的检查范围排除。
- routes、factories 和应用入口禁止导入 `src/demo` 中的文件。
- 需要真正提供给接口的数据，必须根据参考内容在 `src/factories` 中实现。
- demo 数据可以不满足生产类型或包含不完整字段，只用于帮助开发者理解数据结构和内容样例。

## 二、路由统一使用 `mock.resource`

标准业务接口统一使用 `mock.resource` 注册。一个 Resource 表示一个具有统一数据模型的资源，并自动提供列表、详情以及配置允许的写入接口。

```ts
import { schema } from '../core/schema.js'
import { products } from '../factories/index.js'
import type { Product } from '../types.js'

const productResource = mock.resource<Product>({
  name: 'Product',
  path: '/api/products',
  data: products,
  methods: ['GET', 'POST', 'PATCH'],
  schema: schema.object({
    id: schema.integer(),
    name: schema.string(),
    price: schema.number(),
    createdAt: schema.dateTime(),
  }),
  search: ['name'],
  filters: ['status'],
  sort: ['id', 'price', 'createdAt'],
})
```

要求：

- 每个资源只注册一次 `mock.resource`。
- `path` 使用 `/api/<资源复数名>`，例如 `/api/users`、`/api/news`。
- `name` 使用单数、首字母大写的资源名，例如 `User`、`News`。
- 必须传入 factory 生成的 `data`，禁止在路由文件内直接写大批量 Mock 数据。
- 通过 `methods` 明确开放的请求方式；不传 `methods` 表示完整 CRUD，只有确实需要完整 CRUD 时才省略。
- 资源接口不要直接使用 Express `router.get/post/...` 注册。
- 资源接口不要用 `mock.get/post/put/patch/delete` 替代 `mock.resource`。

`methods` 支持以下值：

```ts
type MockResourceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

常用配置：

- 只读资源：`methods: ['GET']`
- 可新增资源：`methods: ['GET', 'POST']`
- 可编辑资源：`methods: ['GET', 'POST', 'PUT', 'PATCH']`
- 完整 CRUD：省略 `methods` 或显式传入全部方法

## 三、Schema 必须在路由中声明

每个 `mock.resource` 的业务 schema 都在对应路由文件内创建，并且统一使用 `src/core/schema.ts` 导出的 `schema`。

```ts
import { schema } from '../core/schema.js'

schema.object({
  id: schema.integer(),
  title: schema.string(),
  amount: schema.number(),
  enabled: schema.boolean(),
  createdAt: schema.dateTime(),
})
```

要求：

- 不要在 factory 中定义 OpenAPI schema；factory 只负责数据。
- 不要手写 `{ type: 'string' }` 等 OpenAPI schema 对象。
- 字段类型必须与 `src/types.ts` 和 factory 实际生成的数据保持一致。
- 默认情况下 `schema.object()` 会将所有字段设为 required；有可选字段时显式传入 `required`。
- 关联已有组件时使用 `schema.ref()`，不要复制同一份 schema。
- 搜索、过滤和排序字段必须是资源实际存在的字段，并与 `mock.resource` 的配置保持一致。

## 四、当前基础文件与后续模块拆分

当前基础版本只保留两个生产入口文件：

- `src/routes/index.ts`：注册当前资源、声明路由 schema，并挂载 Mock Router。
- `src/factories/index.ts`：集中存放当前资源的数据生成函数和默认数据集合。

后续新增业务时，必须按业务模块拆分文件，并由入口文件统一汇总：

```text
src/factories/
├── index.ts            # 入口与当前基础数据
├── user.factory.ts     # 用户数据
├── news.factory.ts     # 新闻数据
└── auth.factory.ts     # 认证数据（如果需要）

src/routes/
├── index.ts            # 创建 mock、挂载并汇总各模块路由
├── users.ts            # 用户路由
├── news.ts             # 新闻路由
└── auth.ts             # 认证路由
```

拆分规则：

- 当前已有的基础内容可以继续放在两个 `index.ts` 中。
- 新增用户、新闻、认证等业务时，分别创建对应的 factory 和 route 文件。
- 同一业务模块的资源和接口放在同一个文件。
- 不按 HTTP 方法拆文件。

路由文件示例：

```ts
import { schema } from '../core/schema.js'
import { products } from '../factories/index.js'
import type { Product } from '../types.js'

mock.resource<Product>({
  name: 'Product',
  path: '/api/products',
  data: products,
  methods: ['GET'],
  schema: schema.object({
    id: schema.integer(),
    name: schema.string(),
  }),
  search: ['name'],
})
```

新增业务时创建对应的模块文件，并在 `src/routes/index.ts` 中完成注册；不要把不同业务长期堆在入口文件中。

## 五、所有数据必须由 `src/factories` 生产

所有 Resource 的 `data` 都必须来自 `src/factories`。数据生产不得放在路由文件、`src/data`、`src/demo` 或 `src/core` 中。

推荐 factory 结构：

```ts
import type { Product } from '../types.js'
import { zhFaker } from '../utils/faker.js'

export const createProduct = (id: number): Product => ({
  id,
  name: zhFaker.commerce.productName(),
  price: zhFaker.number.float({ min: 1, max: 999, fractionDigits: 2 }),
  createdAt: zhFaker.date.recent().toISOString(),
})

export const createProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) => createProduct(index + 1))

export const products = createProducts(200)
```

要求：

- factory 文件按资源命名，例如 `user.factory.ts`、`news.factory.ts`。
- 导出单条生成函数、批量生成函数和默认数据集合（如 `createUser`、`createUsers`、`users`）。
- Faker 统一通过 `src/utils/faker.ts` 使用，不在 factory 中直接引入 `@faker-js/faker`。
- 数据 ID 必须稳定且从 `1` 开始递增，便于详情、更新和删除接口测试。
- factory 负责字段默认值、数据规模、随机数据规则；路由不重复这些逻辑。
- 需要固定结果时使用项目统一的 Faker seed，不在业务 factory 内重新 seed。
- 领域类型放在 `src/types.ts`，factory 返回值必须标注对应类型。

## 六、命名与接口约定

- `src/routes/index.ts` 和 `src/factories/index.ts` 始终保留为入口文件；后续新增业务模块可在同级目录创建独立文件，并由入口统一汇总。
- 资源名称使用单数形式，URL 使用复数形式。
- 字段命名使用 camelCase。
- 列表接口和详情接口由 `mock.resource` 自动生成，不重复手写。
- 搜索、过滤、排序只通过 `search`、`filters`、`sort`（或其等价配置）声明。
- 不为同一个资源重复注册相同 path，避免 OpenAPI 和运行时路由冲突。

## 七、提交前检查

新增或修改接口后至少执行：

```bash
pnpm typecheck
```

并确认：

- 路由只注册 `mock.resource` 资源接口。
- schema 来自 `src/core/schema.ts`，且字段和类型一致。
- data 来自 `src/factories`。
- factory 没有直接引入 `@faker-js/faker`。
- `methods` 与实际需要开放的请求方式一致。
- 同一业务模块没有被无故拆散，同一文件没有混入无关业务。
- OpenAPI 文档可以通过 `/openapi.json` 正常生成。
