import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

// ─────────────────────────────────────────────────────────────────────────────
// users
// ─────────────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'OPERATOR'] }).notNull(),
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lockedUntil: integer('locked_until'), // Unix timestamp (nullable)
  lastLogin: integer('last_login'), // Unix timestamp (nullable)
  createdAt: integer('created_at').$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').$defaultFn(() => Math.floor(Date.now() / 1000)),
})

// ─────────────────────────────────────────────────────────────────────────────
// login_logs
// ─────────────────────────────────────────────────────────────────────────────
export const loginLogs = sqliteTable('login_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id),
  username: text('username').notNull(),
  ipAddress: text('ip_address'),
  loginStatus: text('login_status', {
    enum: ['SUCCESS', 'FAILED', 'LOCKED'],
  }).notNull(),
  loginTime: integer('login_time').$defaultFn(() => Math.floor(Date.now() / 1000)),
})

// ─────────────────────────────────────────────────────────────────────────────
// marriages
// ─────────────────────────────────────────────────────────────────────────────
export const marriages = sqliteTable(
  'marriages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    regBookNo: text('reg_book_no').notNull(),
    pageNo: text('page_no').notNull(),
    regYear: integer('reg_year').notNull(),
    memoNumber: text('memo_number').notNull().unique(),
    marriageDate: text('marriage_date').notNull(), // ISO: YYYY-MM-DD
    registrationDate: text('registration_date').notNull(),
    dowerAmount: real('dower_amount').notNull(),
    paymentMethod: text('payment_method', {
      enum: ['CASH', 'DEFERRED'],
    }).notNull(),
    deferredAmount: real('deferred_amount').default(0).notNull(),
    promptAmount: real('prompt_amount').default(0).notNull(),
    createdBy: text('created_by').references(() => users.id),
    createdAt: integer('created_at').$defaultFn(() => Math.floor(Date.now() / 1000)),
    updatedAt: integer('updated_at').$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (t) => ({
    memoIdx: index('idx_memo').on(t.memoNumber),
    yearIdx: index('idx_year').on(t.regYear),
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// persons
// ─────────────────────────────────────────────────────────────────────────────
export const persons = sqliteTable(
  'persons',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    marriageId: text('marriage_id')
      .notNull()
      .references(() => marriages.id, { onDelete: 'cascade' }),
    role: text('role', {
      enum: ['GROOM', 'BRIDE', 'WAKIL', 'WITNESS1', 'WITNESS2'],
    }).notNull(),
    fullName: text('full_name').notNull(),
    fatherName: text('father_name'),
    pincode: text('pincode'),
    postOffice: text('post_office'),
    stateName: text('state_name'),
    districtName: text('district_name'),
    policeStation: text('police_station'),
    villageCity: text('village_city'),
  },
  (t) => ({
    marriageIdx: index('idx_persons_marriage').on(t.marriageId),
  })
)

// Type exports for convenience
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type LoginLog = typeof loginLogs.$inferSelect
export type Marriage = typeof marriages.$inferSelect
export type NewMarriage = typeof marriages.$inferInsert
export type Person = typeof persons.$inferSelect
export type NewPerson = typeof persons.$inferInsert
