import type { User } from '../types.js'
import { enFaker, zhFaker } from '../utils/faker.js'

const CREATED_AT_FROM = '2024-01-01T00:00:00.000Z'
const CREATED_AT_TO = '2026-01-01T00:00:00.000Z'

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
