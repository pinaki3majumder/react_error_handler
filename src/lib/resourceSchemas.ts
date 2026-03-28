import { z } from 'zod'

const requiredText = z.string().trim().min(1, 'must be a non-empty string')

const companySchema = z
  .object({
    name: requiredText.optional(),
    department: requiredText.optional(),
  })
  .optional()

const userSchema = z.object({
  id: z.number(),
  firstName: requiredText,
  lastName: requiredText,
  email: requiredText,
  phone: requiredText,
  company: companySchema,
})

const recipeSchema = z.object({
  id: z.number(),
  name: requiredText,
  cuisine: requiredText,
  difficulty: requiredText,
  rating: z.number(),
  cookTimeMinutes: z.number(),
})

const cartSchema = z.object({
  id: z.number(),
  total: z.number(),
  discountedTotal: z.number(),
  totalProducts: z.number(),
  totalQuantity: z.number(),
})

const responseSchemas = {
  users: z.object({
    users: z.array(userSchema),
  }),
  recipes: z.object({
    recipes: z.array(recipeSchema),
  }),
  carts: z.object({
    carts: z.array(cartSchema),
  }),
}

export type User = z.infer<typeof userSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type Cart = z.infer<typeof cartSchema>
export type ResourceItem = User | Recipe | Cart
export type ResourceKey = keyof typeof responseSchemas

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return 'response'
  }

  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'symbol') {
      return result
    }

    if (typeof segment === 'number') {
      return `${result}[${segment}]`
    }

    return result ? `${result}.${String(segment)}` : String(segment)
  }, '')
}

export function validateResourceResponse(resourceKey: ResourceKey, data: unknown) {
  if (resourceKey === 'users') {
    const validationResult = responseSchemas.users.safeParse(data)

    if (validationResult.success) {
      return {
        success: true as const,
        items: validationResult.data.users,
      }
    }

    const [issue] = validationResult.error.issues
    const fieldPath = formatIssuePath(issue?.path ?? [])

    return {
      success: false as const,
      errorMessage: 'API response validation failed.',
      missingDetails: issue ? `${fieldPath}: ${issue.message}` : 'Unknown schema validation issue.',
    }
  }

  if (resourceKey === 'recipes') {
    const validationResult = responseSchemas.recipes.safeParse(data)

    if (validationResult.success) {
      return {
        success: true as const,
        items: validationResult.data.recipes,
      }
    }

    const [issue] = validationResult.error.issues
    const fieldPath = formatIssuePath(issue?.path ?? [])

    return {
      success: false as const,
      errorMessage: 'API response validation failed.',
      missingDetails: issue ? `${fieldPath}: ${issue.message}` : 'Unknown schema validation issue.',
    }
  }

  const validationResult = responseSchemas.carts.safeParse(data)

  if (validationResult.success) {
    return {
      success: true as const,
      items: validationResult.data.carts,
    }
  }

  const [issue] = validationResult.error.issues
  const fieldPath = formatIssuePath(issue?.path ?? [])

  return {
    success: false as const,
    errorMessage: 'API response validation failed.',
    missingDetails: issue ? `${fieldPath}: ${issue.message}` : 'Unknown schema validation issue.',
  }
}
