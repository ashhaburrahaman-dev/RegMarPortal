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

  // 2. Fetch from postal API with standard User-Agent to prevent bot-blocking
  let apiResult
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
    })

    if (!response.ok) {
      console.error('[Pincode API Error] Response status:', response.status)
      return null
    }

    const data = (await response.json()) as Array<{
      Status: string
      Message: string
      PostOffice: PostOffice[] | null
    }>

    apiResult = data[0]
  } catch (err) {
    console.error('[Pincode API Fetch Failed]', err)
    return null
  }

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
