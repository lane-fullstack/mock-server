# AI 开发指引

本文件是 AI 在本项目中新增或修改 Mock 路由、类型和数据时必须遵守的操作规则。详细背景和设计说明见 [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)。

## 开始工作前

1. 先阅读 `DEVELOPMENT_RULES.md`、`src/core/mock.ts`、`src/core/resource.ts` 和 `src/core/schema.ts`。
2. 检查现有 `src/routes`、`src/factories`、`src/types.ts`，确认是否已经存在同名资源、路径或类型。
3. 检查 `src/demo` 中是否有可参考的数据结构。`src/demo` 只用于参考，不能作为运行时数据源。
4. 保留用户已有的未提交修改，不覆盖或恢复未明确要求处理的文件。

## 新文件创建范围

- 新增路由文件或数据 factory 文件时，只允许在 `src/routes` 和 `src/factories` 下创建。
- `src/core`、`src/utils`、`src/demo` 和其他目录禁止新增业务文件。
- 当前基础版本使用 `src/routes/index.ts` 和 `src/factories/index.ts`；后续按用户、新闻、认证等业务拆分时，也只能在这两个目录内创建对应文件。
- 其他目录中的已有文件可以按需修改，但不能为了新增业务随意创建新文件。

## 新增资源的固定流程

新增一个资源时，按以下顺序处理：

### 1. 定义领域类型

如果资源是新的，在 `src/types.ts` 中新增接口。资源必须包含 `id: number`，字段命名使用 camelCase。

```ts
export interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: string;
}
```

### 2. 添加数据 factory

当前基础数据添加到 `src/factories/index.ts`。以后新增用户、新闻、认证等业务时，按业务创建独立文件，例如 `user.ts`、`news.ts`、`auth.ts`：

```ts
import type { Product } from "../types.js";
import { zhFaker } from "../utils/faker.js";

export const createProduct = (id: number): Product => ({
  id,
  name: zhFaker.commerce.productName(),
  price: zhFaker.number.float({ min: 1, max: 999, fractionDigits: 2 }),
  createdAt: zhFaker.date.recent().toISOString(),
});

export const createProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) => createProduct(index + 1));

export const products = createProducts(200);
```

factory 必须遵守：

- Faker 只能从 `src/utils/faker.ts` 引入，禁止直接引入 `@faker-js/faker`。
- 导出单条生成函数、批量生成函数和默认数据集合。
- 数据 ID 从 `1` 开始递增且稳定。
- 不在 factory 内定义 OpenAPI schema。
- 不从 `src/demo` 导入数据，不在 `src/routes` 中生产数据。
- 不重新设置 Faker seed。

### 3. 添加路由

当前基础接口添加到 `src/routes/index.ts`。以后新增用户、新闻、认证等业务时，按业务创建独立路由文件，例如 `users.ts`、`news.ts`、`auth.ts`，再由 `src/routes/index.ts` 统一注册：

- 同一业务模块的资源和接口放在同一个路由文件。
- 不按 HTTP 方法拆分文件。
- 路由文件只负责导入对应 factory 数据、声明 schema 和注册资源。
- 入口文件负责创建 Mock Router、挂载模块路由和汇总 OpenAPI。

### 4. 注册 `mock.resource`

业务资源统一使用 `mock.resource`，不要使用 Express 原生路由或 `mock.get/post/put/patch/delete` 注册资源接口。

```ts
import { schema } from "../core/schema.js";
import { products } from "../factories/index.js";
import type { Product } from "../types.js";

mock.resource<Product>({
  name: "Product",
  path: "/api/products",
  data: products,
  methods: ["GET", "POST", "PATCH"],
  schema: schema.object({
    id: schema.integer(),
    name: schema.string(),
    price: schema.number(),
    createdAt: schema.dateTime(),
  }),
  search: ["name"],
  sort: ["id", "price", "createdAt"],
});
```

注册时必须确认：

- `name` 使用单数、首字母大写，例如 `Product`。
- `path` 使用复数资源名，例如 `/api/products`。
- `data` 必须来自对应 factory 的默认数据集合。
- `methods` 明确列出允许的请求方式：`GET`、`POST`、`PUT`、`PATCH`、`DELETE`。
- 只读资源使用 `methods: ['GET']`；不要无理由开放完整 CRUD。
- `search`、`filters`、`sort` 中只能填写类型中真实存在的字段。
- 同一个 path 只能注册一次。

### 5. 在路由中创建 schema

schema 必须在对应路由文件中使用 `src/core/schema.ts` 创建：

- 使用 `schema.object()`、`schema.string()`、`schema.integer()`、`schema.number()`、`schema.email()`、`schema.dateTime()` 等 helper。
- 禁止在 factory 中定义 schema。
- 禁止手写 OpenAPI schema 对象。
- 可选字段必须通过 `schema.object(..., { required: [...] })` 明确声明。
- schema 字段类型必须与 `src/types.ts` 和 factory 返回值一致。

## `src/demo` 规则

- `src/demo` 是参考数据目录，不是业务数据目录。
- `src/demo` 已从 `tsconfig.json` 排除，不参与 TypeScript 检查和构建。
- 任何运行时代码都不能导入 `src/demo`；被导入的排除文件仍可能进入 TypeScript 程序或运行时。
- 参考数据需要转化为 `src/factories` 中的生成逻辑后，才能被路由使用。

## 修改现有资源时

- 先确认是否只是修改字段、数据量、请求方式或 schema；不要重复创建资源。
- 新增字段时同步修改 `src/types.ts`、当前对应的 factory 文件和路由 schema；基础资源使用 `src/factories/index.ts`，已拆分的业务使用对应模块 factory。
- 删除字段时检查搜索、过滤、排序配置及所有引用。
- 调整 `methods` 时确认 OpenAPI 和实际运行路由都符合预期。
- 不要把真实业务数据直接复制到路由文件。
- 不要创建或恢复 `src/data` 作为运行时数据目录。

## 完成前检查

每次新增路由或数据后执行：

```bash
pnpm typecheck
```

并检查：

- 路由使用 `mock.resource`。
- 数据来自 `src/factories`。
- Faker 来自 `src/utils/faker.ts`。
- schema 来自 `src/core/schema.ts` 并位于路由文件。
- `src/demo` 没有被任何运行时代码导入。
- `methods`、搜索、过滤、排序字段配置正确。
- OpenAPI 可通过 `/openapi.json` 生成。

如果检查失败，区分本次改动引入的问题和工作区已有问题，并在交付时明确说明；不要为了通过检查而覆盖用户未提交的修改。
