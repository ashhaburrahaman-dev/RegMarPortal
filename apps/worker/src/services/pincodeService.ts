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

export async function lookupPincode(env: Env, pincode: string): Promise<PincodeResult | null> {
  const cacheKey = `pincode:${pincode}`

  // 1. Check KV cache
  const cached = await env.PINCODE_CACHE.get(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as PincodeResult
    } catch {
      // Cache corruption — fall through to API
    }
  }

  // 2. Fetch from postal API
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    return null
  }

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

  const result: PincodeResult = {
    postOffices: postOffices.map((po) => ({
      name: po.Name,
      branchType: po.BranchType,
    })),
    district: firstPO.District,
    state: firstPO.State,
  }

  // 3. Cache in KV
  await env.PINCODE_CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: KV_TTL_SECONDS,
  })

  return result
}
