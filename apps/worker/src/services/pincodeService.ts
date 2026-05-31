import type { Env } from '../types.js'

const KV_TTL_SECONDS = 604800 // 7 days

export interface PostOffice {
  Name: string
  BranchType: string
  DeliveryStatus: string
  Taluk: string
  Circle: string
  District: string
  Division: string
  Region: string
  State: string
  Country: string
  Pincode: string
}

export interface PincodeResult {
  postOffices: Array<{ name: string; branchType: string }>
  district: string
  state: string
}

/**
 * Tries India Post API with a 3-second timeout.
 * Returns null on failure so we can fall back.
 */
async function tryIndiaPostApi(pincode: string): Promise<PincodeResult | null> {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: AbortSignal.timeout(3000),
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) return null

    const data = (await response.json()) as Array<{
      Status: string
      Message: string
      PostOffice: PostOffice[] | null
    }>

    const apiResult = data[0]
    if (!apiResult || apiResult.Status !== 'Success' || !apiResult.PostOffice?.length) {
      return null
    }

    const postOffices = apiResult.PostOffice
    const firstPO = postOffices[0]!
    return {
      postOffices: postOffices.map((po) => ({ name: po.Name, branchType: po.BranchType })),
      district: firstPO.District,
      state: firstPO.State,
    }
  } catch {
    return null
  }
}

/**
 * Falls back to Nominatim (OpenStreetMap) for basic state + district.
 * Returns an empty postOffices array — the client will show manual Post Office input.
 */
async function tryNominatimFallback(pincode: string): Promise<PincodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&addressdetails=1&limit=1`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MarriageRegistryPortal/1.0 (marriage-registry@localhost)',
      },
    })

    if (!response.ok) return null

    const data = (await response.json()) as Array<{
      address?: {
        state?: string
        county?: string
        city_district?: string
        suburb?: string
        city?: string
      }
    }>

    const result = data[0]
    if (!result?.address) return null

    const addr = result.address
    const state = addr.state ?? ''
    // Use county as district, fallback to city_district or city
    const district = addr.county ?? addr.city_district ?? addr.city ?? ''

    if (!state && !district) return null

    return {
      postOffices: [], // Nominatim doesn't have post office data
      district,
      state,
    }
  } catch {
    return null
  }
}

export async function lookupPincode(env: Env, pincode: string): Promise<PincodeResult | null> {
  const cacheKey = `pincode:${pincode}`

  // 1. Check KV cache
  const cached = await env.PINCODE_CACHE.get(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as PincodeResult
    } catch {
      // Cache corruption — fall through
    }
  }

  // 2. Try India Post API (fast, has post offices)
  let result = await tryIndiaPostApi(pincode)

  // 3. If India Post fails, try Nominatim (slower, no post offices but has state/district)
  if (!result) {
    result = await tryNominatimFallback(pincode)
  }

  if (!result) return null

  // 4. Cache successful result in KV
  await env.PINCODE_CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: KV_TTL_SECONDS,
  })

  return result
}
