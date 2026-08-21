# Mock API Server

一个面向本地开发的轻量 Mock API Server。它使用 Node.js、TypeScript、Express 和 Faker，数据只保存在内存中，服务器重启后会根据固定 seed 恢复初始数据。

## 安装与启动

```bash
pnpm install
pnpm dev
```

其他命令：

```bash
pnpm start       # 使用 tsx 启动
pnpm typecheck   # TypeScript strict 类型检查
```

默认地址是 `http://localhost:3001`，可以通过启动命令前的环境变量覆盖；项目同时提供 `.env.example` 作为配置参考：

```env
PORT=3001
MOCK_DELAY=300
CORS_ORIGIN=*
```

例如：

```bash
MOCK_DELAY=300 pnpm dev
```

启动后：

```text
API:      http://localhost:3001/api/*
OpenAPI:  http://localhost:3001/openapi.json
Docs UI:  http://localhost:3001/docs
```

## 内置接口

Users 通过 Resource 注册并拥有完整 CRUD；News 配置为只读 Resource，只提供列表和详情：

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

GET    /api/news
GET    /api/news/:id

POST   /api/login
```

打开 `/docs` 会加载 `openapi-ui-dist@latest` 页面，并读取 `/openapi.json` 展示接口文档。

## OpenAPI 与 API 文档

`/openapi.json` 由 Resource 和自定义 Route 注册时自动生成，格式为 OpenAPI 3.1，不需要手工维护整份 JSON。`/docs` 使用 `openapi-ui-dist@latest` 模板加载这份文档。

Resource 的 `schema` 会注册到 `components.schemas`，例如 `User`、`News`；列表响应会自动生成 `UserListResponse`、`NewsListResponse`，其中 `items` 引用对应 Resource schema。

## 新增 Resource

新增普通接口只需创建数据工厂并注册一次：

```ts
import { schema } from '../core/schema.js'

mock.resource<Product>({
  name: 'Product',
  path: '/api/products',
  data: createProducts(500),
  schema: schema.object({
    id: schema.integer(),
    name: schema.string(),
    price: schema.number(),
    categoryId: schema.integer(),
    status: schema.integer(),
    createdAt: schema.dateTime(),
  }),
  search: ['name'],
  filters: ['categoryId', 'status'],
  sort: ['id', 'price', 'createdAt'],
})
```

它会自动注册 CRUD、分页、搜索、过滤、排序、OpenAPI paths 和 schema。`schema.object()` 默认将字段都列为 required；需要自定义时传入第二个参数：

```ts
schema.object({
  id: schema.integer(),
  name: schema.string(),
  email: schema.email(),
}, { required: ['id', 'name', 'email'] })
```

可用的 schema helper 包括 `string()`、`email()`、`integer()`、`number()`、`dateTime()`、`boolean()`、`array()`、`object()` 和 `ref()`。

如果接口只需要 GET，不需要新增、修改和删除，可以限制 `methods`：

```ts
mock.resource<News>({
  name: 'News',
  path: '/api/news',
  data: news,
  methods: ['GET'],
  schema: schema.object({
    id: schema.integer(),
    title: schema.string(),
  }),
  search: ['title'],
})
```

`methods` 支持 `GET`、`POST`、`PUT`、`PATCH`、`DELETE`；不填写时默认注册完整 CRUD。`GET` 会同时提供列表和详情接口。

## 自定义 Route

特殊业务接口使用 `mock.get()`、`mock.post()`、`mock.put()`、`mock.patch()` 或 `mock.delete()`，路由和 OpenAPI 会同时注册：

```ts
mock.post('/api/login', {
  summary: '用户登录',
  body: schema.object({
    username: schema.string(),
    password: schema.string(),
  }),
  response: schema.object({
    token: schema.string(),
  }),
  errorStatuses: [401],
  handler(request, response) {
    // 在这里编写简单的 Mock 逻辑
  },
})
```

`body` 和 `response` 描述 JSON 请求体及统一响应中的 `data`，`errorStatuses` 描述可模拟的错误状态。

列表接口统一支持：

```text
GET /api/users?page=2&pageSize=20
GET /api/users?keyword=lane
GET /api/users?status=1
GET /api/users?sortBy=id&order=desc
GET /api/news?categoryId=2&sortBy=createdAt&order=desc
```

`page` 默认是 1，`pageSize` 默认是 20，最大是 100。非法分页参数会回退到默认值；超过最大页时会使用最后一页。搜索、过滤和排序字段由每个 Resource 的配置控制。

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

失败响应：

```json
{
  "code": 404,
  "message": "User not found",
  "data": null
}
```

## 延迟与错误模拟

全局延迟通过 `MOCK_DELAY=300` 设置，也可以单次请求覆盖：

```text
GET /api/users?_delay=2000
```

通过 `_status` 模拟 `401`、`403`、`404`、`429`、`500` 或 `503`：

```text
GET /api/users?_status=500
```

这两个开关由全局 middleware 处理，所有 API 路由都可使用。

## 给客户端使用

Flutter：

```text
API_BASE_URL=http://localhost:3001
```

Android Emulator 访问宿主机时使用：

```text
http://10.0.2.2:3001
```

真机调试时将 `localhost` 替换成开发电脑在局域网中的 IP，并确保设备和电脑在同一网络。

Vue：

```env
VITE_API_BASE_URL=http://localhost:3001
```

React 可使用同样的 `http://localhost:3001` 基地址。
# mock-server
