import { faker } from '@faker-js/faker/locale/zh_CN'
import { faker as fakerEn } from '@faker-js/faker'

const parseInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export const config = {
  port: parseInteger(process.env.PORT, 3001) || 3001,
  mockDelay: parseInteger(process.env.MOCK_DELAY, 0),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  fakerSeed: 12345,
}

// Seeding once before the data modules run makes every server restart reproducible.
faker.seed(config.fakerSeed)
fakerEn.seed(config.fakerSeed)
