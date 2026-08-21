import '../config.js'
import { faker as zhFaker } from '@faker-js/faker/locale/zh_CN'
import { faker as enFaker } from '@faker-js/faker'

export { enFaker, zhFaker }

export const pick = <T>(items: readonly T[]): T => zhFaker.helpers.arrayElement(items)
