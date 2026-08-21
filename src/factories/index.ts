import type { News, User } from '../types.js'
import { enFaker, pick, zhFaker } from '../utils/faker.js'

const CREATED_AT_FROM = '2024-01-01T00:00:00.000Z'
const CREATED_AT_TO = '2026-01-01T00:00:00.000Z'

const topics = ['社区服务', '本地生活', '城市活动', '便民资讯', '商家动态']
const actions = ['推出', '发布', '开启', '公布', '迎来']
const subjects = ['全新服务方案', '周末活动安排', '最新优惠信息', '社区报名通知', '生活指南']
const details = ['居民可以在线查看详情并提前预约', '相关工作人员将持续更新后续安排', '感兴趣的用户可以根据需要参与', '活动现场还准备了实用的服务内容']

const createChineseTitle = (): string => `${pick(topics)}${pick(actions)}${pick(subjects)}`

const createChineseSummary = (): string =>
  `${pick(topics)}带来${pick(subjects)}，${pick(details)}。`

const createChineseContent = (): string =>
  Array.from({ length: 3 }, () => `${pick(topics)}${pick(actions)}${pick(subjects)}，${pick(details)}。`).join('\n')

export const createNewsItem = (id: number): News => ({
  id,
  title: createChineseTitle(),
  summary: createChineseSummary(),
  content: createChineseContent(),
  author: zhFaker.person.fullName(),
  categoryId: (id % 5) + 1,
  views: zhFaker.number.int({ min: 10, max: 100000 }),
  createdAt: zhFaker.date.between({ from: CREATED_AT_FROM, to: CREATED_AT_TO }).toISOString(),
})

export const createNews = (count: number): News[] =>
  Array.from({ length: count }, (_, index) => createNewsItem(index + 1))

export const news = createNews(300)

export const createUser = (id: number): User => ({
  id,
  name: zhFaker.person.fullName(),
  email: zhFaker.internet.email().toLocaleLowerCase(),
  phone: zhFaker.phone.number(),
  avatar: zhFaker.image.avatar(),
  city: enFaker.location.city(),
  status: id % 4 === 0 ? 0 : 1,
  createdAt: zhFaker.date.between({ from: CREATED_AT_FROM, to: CREATED_AT_TO }).toISOString(),
})

export const createUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, index) => createUser(index + 1))

export const users = createUsers(200)
