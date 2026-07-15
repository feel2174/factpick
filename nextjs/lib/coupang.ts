import 'server-only';
import crypto from 'crypto';

const COUPANG_HOST = 'https://api-gateway.coupang.com';
const SEARCH_PATH = '/v2/providers/affiliate_open_api/apis/openapi/products/search';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;

export interface CoupangProduct {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  categoryName: string;
  keyword: string;
  rank: number;
  isRocket: boolean;
  isFreeShipping: boolean;
}

interface CoupangSearchResponse {
  rCode: string;
  rMessage: string;
  data?: { productData?: CoupangProduct[] };
}

function signedDate() {
  return new Date().toISOString().slice(2, 19).replace(/[-:]/g, '') + 'Z';
}

export function normalizeCoupangLimit(limit?: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit!)));
}

export async function searchCoupangProducts(
  keyword: string,
  limit = DEFAULT_LIMIT,
): Promise<CoupangProduct[]> {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  const normalizedKeyword = keyword.trim().slice(0, 60);
  const normalizedLimit = normalizeCoupangLimit(limit);

  if (!accessKey || !secretKey) {
    throw new Error('Coupang Partners API credentials are not configured');
  }
  if (!normalizedKeyword) return [];

  const method = 'GET';
  const query = `keyword=${encodeURIComponent(normalizedKeyword)}&limit=${normalizedLimit}`;
  const datetime = signedDate();
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(datetime + method + SEARCH_PATH + query)
    .digest('hex');
  const authorization = [
    'CEA algorithm=HmacSHA256',
    `access-key=${accessKey}`,
    `signed-date=${datetime}`,
    `signature=${signature}`,
  ].join(', ');

  const response = await fetch(`${COUPANG_HOST}${SEARCH_PATH}?${query}`, {
    method,
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Coupang Partners API request failed (${response.status})`);
  }

  const payload = await response.json() as CoupangSearchResponse;
  if (payload.rCode !== '0') {
    throw new Error(`Coupang Partners API error: ${payload.rMessage || payload.rCode}`);
  }

  return (payload.data?.productData ?? []).slice(0, normalizedLimit);
}
