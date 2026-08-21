import { faker } from '@faker-js/faker/locale/zh_CN'
import { faker as fakerEn } from '@faker-js/faker'
import type { User } from '../types.js'

const CREATED_AT_FROM = '2024-01-01T00:00:00.000Z'
const CREATED_AT_TO = '2026-01-01T00:00:00.000Z'

export const createUser = (id: number): User => ({
  id,
  name: faker.person.fullName(),
  email: faker.internet.email().toLocaleLowerCase(),
  phone: faker.phone.number(),
  avatar: faker.image.avatar(),
  city: fakerEn.location.city(),
  status: id % 4 === 0 ? 0 : 1,
  createdAt: faker.date.between({ from: CREATED_AT_FROM, to: CREATED_AT_TO }).toISOString(),
})

export const createUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, index) => createUser(index + 1))
