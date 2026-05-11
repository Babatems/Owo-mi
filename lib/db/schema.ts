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
  numeric,
  smallint,
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

export const providerEnum = pgEnum('provider', ['plaid', 'flinks', 'manual'])

export const connectionStatusEnum = pgEnum('connection_status', [
  'pending',
  'active',
  'login_required',
  'permission_revoked',
  'expired',
  'error',
  'disconnected',
])

export const txnStatusEnum = pgEnum('txn_status', ['pending', 'posted', 'removed'])

export const syncStatusEnum = pgEnum('sync_status', ['running', 'success', 'failed'])

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
    // Plaid-specific fields (null for manual/CSV transactions)
    bankAccountId: uuid('bank_account_id'),
    externalTransactionId: text('external_transaction_id'),
    pendingExternalId: text('pending_external_id'),
    txnStatus: txnStatusEnum('txn_status').default('posted'),
    merchantName: text('merchant_name'),
    paymentChannel: text('payment_channel'),
    logoUrl: text('logo_url'),
    raw: jsonb('raw'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('transactions_family_idx').on(t.familyId),
    index('transactions_account_idx').on(t.accountId),
    index('transactions_date_idx').on(t.date),
    index('transactions_import_hash_idx').on(t.importHash),
    index('transactions_bank_account_idx').on(t.bankAccountId),
    // Postgres allows multiple (NULL, NULL) rows — this only enforces uniqueness for Plaid txns
    unique('txn_plaid_dedup').on(t.bankAccountId, t.externalTransactionId),
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

// ─── Plaid / Aggregator Tables ────────────────────────────────────────────────

export const institutions = pgTable(
  'institutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: providerEnum('provider').notNull(),
    externalId: text('external_id').notNull(),
    name: text('name').notNull(),
    primaryColor: text('primary_color'),
    logoUrl: text('logo_url'),
    oauthSupported: boolean('oauth_supported').notNull().default(false),
    country: text('country').notNull().default('CA'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique('institutions_provider_external_id').on(t.provider, t.externalId)]
)

export const bankConnections = pgTable(
  'bank_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    provider: providerEnum('provider').notNull(),
    institutionId: uuid('institution_id').notNull(),
    externalItemId: text('external_item_id').notNull(),
    cursor: text('cursor'),
    consentExpiresAt: timestamp('consent_expires_at'),
    status: connectionStatusEnum('status').notNull().default('pending'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    lastSuccessfulSyncAt: timestamp('last_successful_sync_at'),
    lastSyncAttemptAt: timestamp('last_sync_attempt_at'),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('bank_connections_family_idx').on(t.familyId),
    unique('bank_connections_provider_item').on(t.provider, t.externalItemId),
  ]
)

// Encrypted access tokens — stored separately with restricted grants
export const connectionSecrets = pgTable('connection_secrets', {
  connectionId: uuid('connection_id').primaryKey(),
  keyVersion: smallint('key_version').notNull().default(1),
  // AES-256-GCM envelope-encrypted fields stored as base64 text
  wrappedDek: text('wrapped_dek').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  ciphertextAccessToken: text('ciphertext_access_token').notNull(),
  ciphertextRefreshToken: text('ciphertext_refresh_token'),
  rotatedAt: timestamp('rotated_at').notNull().defaultNow(),
})

export const bankAccounts = pgTable(
  'bank_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionId: uuid('connection_id').notNull(),
    familyId: text('family_id').notNull(),
    externalAccountId: text('external_account_id').notNull(),
    name: text('name').notNull(),
    officialName: text('official_name'),
    mask: text('mask'),
    type: text('type').notNull(),
    subtype: text('subtype'),
    currency: text('currency').notNull().default('CAD'),
    currentBalance: numeric('current_balance', { precision: 12, scale: 2 }),
    availableBalance: numeric('available_balance', { precision: 12, scale: 2 }),
    limitAmount: numeric('limit_amount', { precision: 12, scale: 2 }),
    balanceUpdatedAt: timestamp('balance_updated_at'),
    closedAt: timestamp('closed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('bank_accounts_connection_idx').on(t.connectionId),
    index('bank_accounts_family_idx').on(t.familyId),
    unique('bank_accounts_connection_external').on(t.connectionId, t.externalAccountId),
  ]
)

// Maps aggregator bank accounts → user-defined logical accounts (financialAccounts)
export const accountMappings = pgTable(
  'account_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userAccountId: uuid('user_account_id').notNull(),
    bankAccountId: uuid('bank_account_id').notNull(),
    isPrimary: boolean('is_primary').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    unique('account_mappings_bank_account_unique').on(t.bankAccountId), // 1 bank acct → 1 logical acct
    index('account_mappings_user_account_idx').on(t.userAccountId),
  ]
)

export const syncHistory = pgTable(
  'sync_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionId: uuid('connection_id').notNull(),
    status: syncStatusEnum('status').notNull().default('running'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms'),
    txnsAdded: integer('txns_added').notNull().default(0),
    txnsModified: integer('txns_modified').notNull().default(0),
    txnsRemoved: integer('txns_removed').notNull().default(0),
    cursorBefore: text('cursor_before'),
    cursorAfter: text('cursor_after'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    context: jsonb('context'),
  },
  (t) => [index('sync_history_connection_idx').on(t.connectionId)]
)

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: providerEnum('provider').notNull(),
    webhookType: text('webhook_type').notNull(),
    webhookCode: text('webhook_code').notNull(),
    externalItemId: text('external_item_id'),
    idempotencyKey: text('idempotency_key').notNull(),
    signatureValid: boolean('signature_valid').notNull().default(false),
    receivedAt: timestamp('received_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastError: text('last_error'),
    payload: jsonb('payload'),
    headers: jsonb('headers'),
  },
  (t) => [
    unique('webhook_events_idempotency_key').on(t.idempotencyKey),
    index('webhook_events_item_idx').on(t.externalItemId),
  ]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const financialAccountRelations = relations(financialAccounts, ({ many }) => ({
  transactions: many(transactions),
  accountMappings: many(accountMappings),
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
  bankAccount: one(bankAccounts, {
    fields: [transactions.bankAccountId],
    references: [bankAccounts.id],
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

export const institutionRelations = relations(institutions, ({ many }) => ({
  connections: many(bankConnections),
}))

export const bankConnectionRelations = relations(bankConnections, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [bankConnections.institutionId],
    references: [institutions.id],
  }),
  secret: one(connectionSecrets, {
    fields: [bankConnections.id],
    references: [connectionSecrets.connectionId],
  }),
  bankAccounts: many(bankAccounts),
  syncHistory: many(syncHistory),
}))

export const connectionSecretRelations = relations(connectionSecrets, ({ one }) => ({
  connection: one(bankConnections, {
    fields: [connectionSecrets.connectionId],
    references: [bankConnections.id],
  }),
}))

export const bankAccountRelations = relations(bankAccounts, ({ one, many }) => ({
  connection: one(bankConnections, {
    fields: [bankAccounts.connectionId],
    references: [bankConnections.id],
  }),
  mapping: one(accountMappings, {
    fields: [bankAccounts.id],
    references: [accountMappings.bankAccountId],
  }),
  transactions: many(transactions),
}))

export const accountMappingRelations = relations(accountMappings, ({ one }) => ({
  userAccount: one(financialAccounts, {
    fields: [accountMappings.userAccountId],
    references: [financialAccounts.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [accountMappings.bankAccountId],
    references: [bankAccounts.id],
  }),
}))

export const syncHistoryRelations = relations(syncHistory, ({ one }) => ({
  connection: one(bankConnections, {
    fields: [syncHistory.connectionId],
    references: [bankConnections.id],
  }),
}))
