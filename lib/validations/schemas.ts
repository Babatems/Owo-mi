import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signUpSchema = z.object({
  name: z.string().min(2, { error: 'Name must be at least 2 characters' }).trim(),
  email: z.email({ error: 'Please enter a valid email address' }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' })
    .regex(/[a-zA-Z]/, { error: 'Password must contain at least one letter' })
    .regex(/[0-9]/, { error: 'Password must contain at least one number' }),
})

export const signInSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address' }).trim().toLowerCase(),
  password: z.string().min(1, { error: 'Password is required' }),
})

export const magicLinkSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address' }).trim().toLowerCase(),
})

// ─── Family ───────────────────────────────────────────────────────────────────

export const createFamilySchema = z.object({
  name: z.string().min(2, { error: 'Family name must be at least 2 characters' }).trim(),
})

export const inviteMemberSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address' }).trim().toLowerCase(),
  role: z.enum(['admin', 'member'], { error: 'Role must be admin or member' }),
})

// ─── Financial Accounts ───────────────────────────────────────────────────────

export const accountTypes = [
  'checking',
  'savings',
  'credit',
  'tfsa',
  'rrsp',
  'fhsa',
  'resp',
  'investment',
  'cash',
] as const

export const registeredAccountTypes = ['tfsa', 'rrsp', 'fhsa', 'resp'] as const

export const createAccountSchema = z.object({
  name: z.string().min(1, { error: 'Account name is required' }).trim(),
  type: z.enum(accountTypes, { error: 'Invalid account type' }),
  balanceCents: z.number().int({ error: 'Balance must be a whole number of cents' }),
  currency: z.string().length(3).default('CAD'),
  institution: z.string().trim().optional(),
  last4: z
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z
        .string()
        .regex(/^\d{4}$/, { error: 'Last 4 digits must be exactly 4 numbers' })
        .optional()
    ),
  notes: z.string().trim().optional(),
  contributionRoomCents: z.number().int().min(0).optional(),
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Categories ───────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, { error: 'Category name is required' }).trim(),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { error: 'Color must be a valid hex color (e.g. #10B981)' })
    .optional(),
  type: z.enum(['income', 'expense', 'transfer'], { error: 'Invalid category type' }),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Transactions ─────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  accountId: z.string().uuid({ error: 'Invalid account' }),
  amountCents: z
    .number()
    .int({ error: 'Amount must be whole cents' })
    .refine((v) => v !== 0, { error: 'Amount cannot be zero' }),
  currency: z.string().length(3).default('CAD'),
  date: z.coerce.date({ error: 'Invalid date' }),
  description: z.string().min(1, { error: 'Description is required' }).trim(),
  categoryId: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().uuid(),
})

export const transactionFiltersSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reviewed: z.boolean().optional(),
  search: z.string().trim().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
})

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid({ error: 'Invalid category' }),
  periodType: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
  periodStart: z.coerce.date({ error: 'Invalid period start date' }),
  amountCents: z.number().int().positive({ error: 'Budget amount must be positive' }),
  carryoverEnabled: z.boolean().default(false),
})

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Savings Goals ────────────────────────────────────────────────────────────

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, { error: 'Goal name is required' }).trim(),
  targetAmountCents: z.number().int().positive({ error: 'Target amount must be positive' }),
  targetDate: z.coerce.date().optional(),
  linkedAccountId: z.string().uuid().optional(),
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({
  id: z.string().uuid(),
  currentAmountCents: z.number().int().min(0).optional(),
})

// ─── Categorization Rules ─────────────────────────────────────────────────────

export const createRuleSchema = z.object({
  field: z.enum(['description', 'amount']),
  operator: z.enum(['contains', 'equals', 'starts_with', 'ends_with', 'greater_than', 'less_than']),
  value: z.string().min(1, { error: 'Rule value is required' }).trim(),
  categoryId: z.string().uuid({ error: 'Invalid category' }),
  priority: z.number().int().min(0).default(0),
})

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const createTagSchema = z.object({
  name: z.string().min(1, { error: 'Tag name is required' }).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { error: 'Color must be a valid hex color' })
    .optional(),
})

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>
export type CreateRuleInput = z.infer<typeof createRuleSchema>
