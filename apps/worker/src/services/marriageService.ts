import { eq, like, desc, asc, and, sql } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { marriages, persons } from '../db/schema.js'
import type { Env } from '../types.js'
import type { MarriageCreate } from '@regmar/shared'

export async function listMarriages(
  env: Env,
  opts: {
    page: number
    limit: number
    year?: number
    search?: string
    sortBy?: 'marriageDate' | 'memoNumber'
    order?: 'asc' | 'desc'
  }
) {
  const db = getDb(env.DB)
  const offset = (opts.page - 1) * opts.limit

  // Build where conditions
  const conditions = []
  if (opts.year) {
    conditions.push(eq(marriages.regYear, opts.year))
  }
  if (opts.search) {
    const term = `%${opts.search}%`
    conditions.push(like(marriages.memoNumber, term))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const orderFn = opts.order === 'asc' ? asc : desc
  const orderCol = opts.sortBy === 'memoNumber' ? marriages.memoNumber : marriages.marriageDate

  // Get total count
  const [countResult] = await db
    .select({ total: sql<number>`count(*)` })
    .from(marriages)
    .where(whereClause)

  // Get paginated marriages
  const marriageList = await db
    .select()
    .from(marriages)
    .where(whereClause)
    .orderBy(orderFn(orderCol))
    .limit(opts.limit)
    .offset(offset)

  if (marriageList.length === 0) {
    return { data: [], total: countResult?.total ?? 0, page: opts.page, limit: opts.limit }
  }

  // Get groom and bride names for each marriage
  const ids = marriageList.map((m) => m.id)
  const personsList = await db
    .select()
    .from(persons)
    .where(
      and(
        sql`${persons.marriageId} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`,
        sql`${persons.role} IN ('GROOM', 'BRIDE')`
      )
    )

  const personsMap = new Map<string, { groomName?: string; brideName?: string }>()
  for (const p of personsList) {
    const entry = personsMap.get(p.marriageId) ?? {}
    if (p.role === 'GROOM') entry.groomName = p.fullName
    if (p.role === 'BRIDE') entry.brideName = p.fullName
    personsMap.set(p.marriageId, entry)
  }

  const data = marriageList.map((m) => ({
    ...m,
    groomName: personsMap.get(m.id)?.groomName ?? '',
    brideName: personsMap.get(m.id)?.brideName ?? '',
  }))

  return { data, total: countResult?.total ?? 0, page: opts.page, limit: opts.limit }
}

export async function getMarriageById(env: Env, id: string) {
  const db = getDb(env.DB)

  const [marriage] = await db.select().from(marriages).where(eq(marriages.id, id)).limit(1)
  if (!marriage) return null

  const personsList = await db
    .select()
    .from(persons)
    .where(eq(persons.marriageId, id))

  return { ...marriage, persons: personsList }
}

export async function createMarriage(env: Env, data: MarriageCreate, createdBy: string) {
  const db = getDb(env.DB)
  const now = Math.floor(Date.now() / 1000)

  const marriageId = crypto.randomUUID()
  const marriageData = {
    id: marriageId,
    regBookNo: data.regBookNo,
    pageNo: data.pageNo,
    regYear: data.regYear,
    memoNumber: data.memoNumber,
    marriageDate: data.marriageDate,
    registrationDate: data.registrationDate,
    dowerAmount: data.dowerAmount,
    paymentMethod: data.paymentMethod,
    deferredAmount: data.deferredAmount,
    promptAmount: data.promptAmount,
    createdBy,
    createdAt: now,
    updatedAt: now,
  }

  const personInserts = data.persons.map((p) => ({
    id: crypto.randomUUID(),
    marriageId,
    role: p.role,
    fullName: p.fullName,
    fatherName: p.fatherName ?? null,
    pincode: p.pincode ?? null,
    postOffice: p.postOffice ?? null,
    stateName: p.stateName ?? null,
    districtName: p.districtName ?? null,
    policeStation: p.policeStation ?? null,
    villageCity: p.villageCity ?? null,
  }))

  // Use D1 batch for atomicity
  await env.DB.batch([
    db.insert(marriages).values(marriageData).toSQL() as unknown as D1PreparedStatement,
    ...personInserts.map(
      (p) => db.insert(persons).values(p).toSQL() as unknown as D1PreparedStatement
    ),
  ])

  return { id: marriageId, memoNumber: data.memoNumber }
}

export async function updateMarriage(env: Env, id: string, data: MarriageCreate) {
  const db = getDb(env.DB)
  const now = Math.floor(Date.now() / 1000)

  const personInserts = data.persons.map((p) => ({
    id: crypto.randomUUID(),
    marriageId: id,
    role: p.role,
    fullName: p.fullName,
    fatherName: p.fatherName ?? null,
    pincode: p.pincode ?? null,
    postOffice: p.postOffice ?? null,
    stateName: p.stateName ?? null,
    districtName: p.districtName ?? null,
    policeStation: p.policeStation ?? null,
    villageCity: p.villageCity ?? null,
  }))

  await env.DB.batch([
    db
      .update(marriages)
      .set({
        regBookNo: data.regBookNo,
        pageNo: data.pageNo,
        regYear: data.regYear,
        memoNumber: data.memoNumber,
        marriageDate: data.marriageDate,
        registrationDate: data.registrationDate,
        dowerAmount: data.dowerAmount,
        paymentMethod: data.paymentMethod,
        deferredAmount: data.deferredAmount,
        promptAmount: data.promptAmount,
        updatedAt: now,
      })
      .where(eq(marriages.id, id))
      .toSQL() as unknown as D1PreparedStatement,
    db
      .delete(persons)
      .where(eq(persons.marriageId, id))
      .toSQL() as unknown as D1PreparedStatement,
    ...personInserts.map(
      (p) => db.insert(persons).values(p).toSQL() as unknown as D1PreparedStatement
    ),
  ])

  return getMarriageById(env, id)
}

export async function deleteMarriage(env: Env, id: string) {
  const db = getDb(env.DB)
  await db.delete(marriages).where(eq(marriages.id, id))
}

export async function searchMarriages(
  env: Env,
  opts: { memo?: string; groom?: string; bride?: string; year?: number }
) {
  const db = getDb(env.DB)

  let query = db
    .select({
      marriage: marriages,
      person: persons,
    })
    .from(marriages)
    .leftJoin(persons, eq(persons.marriageId, marriages.id))

  const conditions = []

  if (opts.memo) conditions.push(like(marriages.memoNumber, `%${opts.memo}%`))
  if (opts.year) conditions.push(eq(marriages.regYear, opts.year))

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query
  }

  const rows = await query.limit(100)

  // Group by marriage, filter by person name if needed
  const marriageMap = new Map<
    string,
    { marriage: (typeof marriages.$inferSelect); persons: (typeof persons.$inferSelect)[] }
  >()

  for (const row of rows) {
    if (!marriageMap.has(row.marriage.id)) {
      marriageMap.set(row.marriage.id, { marriage: row.marriage, persons: [] })
    }
    if (row.person) {
      marriageMap.get(row.marriage.id)!.persons.push(row.person)
    }
  }

  let results = Array.from(marriageMap.values())

  // Filter by groom/bride name after grouping
  if (opts.groom) {
    const term = opts.groom.toLowerCase()
    results = results.filter((r) =>
      r.persons.some((p) => p.role === 'GROOM' && p.fullName.toLowerCase().includes(term))
    )
  }
  if (opts.bride) {
    const term = opts.bride.toLowerCase()
    results = results.filter((r) =>
      r.persons.some((p) => p.role === 'BRIDE' && p.fullName.toLowerCase().includes(term))
    )
  }

  return results.map((r) => ({
    ...r.marriage,
    groomName: r.persons.find((p) => p.role === 'GROOM')?.fullName ?? '',
    brideName: r.persons.find((p) => p.role === 'BRIDE')?.fullName ?? '',
  }))
}
