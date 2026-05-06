import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  unique,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum('account_type', [
  'checking',
  'savings',
  'credit',
  'tfsa',
  'rrsp',
  'fhsa',
  'resp',
  'investment',
  'cash',
])

export const categoryTypeEnum = pgEnum('category_type', ['income', 'expense', 'transfer'])

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member'])

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'LOGIN',
  'LOGOUT',
])

export const budgetPeriodEnum = pgEnum('budget_period', ['weekly', 'biweekly', 'monthly', 'yearly'])

export const ruleOperatorEnum = pgEnum('rule_operator', [
  'contains',
  'equals',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
])

export const ruleFieldEnum = pgEnum('rule_field', ['description', 'amount'])

// ─── Better Auth tables (managed by better-auth — DO NOT modify) ─────────────
// Better Auth creates: user, session, account, verification, organization, member, invitation
// We reference organization.id as familyId in our application tables.

// ─── Application Tables ───────────────────────────────────────────────────────

export const financialAccounts = pgTable(
  'financial_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    name: text('name').notNull(),
    slug: text('slug'),
    type: accountTypeEnum('type').notNull(),
    balanceCents: integer('balance_cents').notNull().default(0),
    currency: text('currency').notNull().default('CAD'),
    institution: text('institution'),
    last4: text('last4'),
    notes: text('notes'),
    contributionRoomCents: integer('contribution_room_cents'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('financial_accounts_family_idx').on(t.familyId),
    unique('financial_accounts_family_slug').on(t.familyId, t.slug),
  ]
)

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    parentId: uuid('parent_id'),
    name: text('name').notNull(),
    icon: text('icon'),
    color: text('color'),
    type: categoryTypeEnum('type').notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('categories_family_idx').on(t.familyId)]
)

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('tags_family_idx').on(t.familyId),
    unique('tags_family_name_unique').on(t.familyId, t.name),
  ]
)

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').notNull(),
    familyId: text('family_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('CAD'),
    date: timestamp('date').notNull(),
    description: text('description').notNull(),
    categoryId: uuid('category_id'),
    notes: text('notes'),
    importHash: text('import_hash'),
    transferId: uuid('transfer_id'),
    reviewed: boolean('reviewed').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('transactions_family_idx').on(t.familyId),
    index('transactions_account_idx').on(t.accountId),
    index('transactions_date_idx').on(t.date),
    index('transactions_import_hash_idx').on(t.importHash),
  ]
)

export const transactionTags = pgTable(
  'transaction_tags',
  {
    transactionId: uuid('transaction_id').notNull(),
    tagId: uuid('tag_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.transactionId, t.tagId] })]
)

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    categoryId: uuid('category_id').notNull(),
    periodType: budgetPeriodEnum('period_type').notNull().default('monthly'),
    periodStart: timestamp('period_start').notNull(),
    amountCents: integer('amount_cents').notNull(),
    carryoverEnabled: boolean('carryover_enabled').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('budgets_family_idx').on(t.familyId)]
)

export const savingsGoals = pgTable(
  'savings_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    name: text('name').notNull(),
    targetAmountCents: integer('target_amount_cents').notNull(),
    currentAmountCents: integer('current_amount_cents').notNull().default(0),
    targetDate: timestamp('target_date'),
    linkedAccountId: uuid('linked_account_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('savings_goals_family_idx').on(t.familyId)]
)

export const categorizationRules = pgTable(
  'categorization_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    field: ruleFieldEnum('field').notNull().default('description'),
    operator: ruleOperatorEnum('operator').notNull().default('contains'),
    value: text('value').notNull(),
    categoryId: uuid('category_id').notNull(),
    priority: integer('priority').notNull().default(0),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('categorization_rules_family_idx').on(t.familyId),
    index('categorization_rules_priority_idx').on(t.familyId, t.priority),
  ]
)

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    action: auditActionEnum('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('audit_log_family_idx').on(t.familyId),
    index('audit_log_created_idx').on(t.createdAt),
  ]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const financialAccountRelations = relations(financialAccounts, ({ many }) => ({
  transactions: many(transactions),
}))

export const categoryRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  rules: many(categorizationRules),
}))

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  account: one(financialAccounts, {
    fields: [transactions.accountId],
    references: [financialAccounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  tags: many(transactionTags),
}))

export const transactionTagRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id],
  }),
  tag: one(tags, { fields: [transactionTags.tagId], references: [tags.id] }),
}))

export const budgetRelations = relations(budgets, ({ one }) => ({
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
}))

export const savingsGoalRelations = relations(savingsGoals, ({ one }) => ({
  linkedAccount: one(financialAccounts, {
    fields: [savingsGoals.linkedAccountId],
    references: [financialAccounts.id],
  }),
}))

export const categorizationRuleRelations = relations(categorizationRules, ({ one }) => ({
  category: one(categories, {
    fields: [categorizationRules.categoryId],
    references: [categories.id],
  }),
}))
