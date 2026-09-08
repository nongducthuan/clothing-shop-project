// ─── SHIPPING UTILITIES ───────────────────────────────────────────────────────
// Tính phí vận chuyển dựa theo tỉnh/thành phố, số lượng sản phẩm và tổng đơn hàng.

// Ngưỡng miễn phí vận chuyển
export const FREE_SHIPPING_THRESHOLD = 500_000;

// Phụ phí mỗi món vượt quá giới hạn
const EXTRA_ITEM_FEE = 5_000;
const FREE_ITEM_LIMIT = 5;

// ─── ZONE MAPPING ─────────────────────────────────────────────────────────────

type ShippingZone = 'inner_city' | 'nearby' | 'south' | 'central' | 'north' | 'remote' | 'default';

const ZONE_BASE_FEE: Record<ShippingZone, number> = {
  inner_city: 20_000,  // TP.HCM, Hà Nội
  nearby:     25_000,  // Tỉnh lân cận TP.HCM / HN
  south:      30_000,  // Miền Nam còn lại
  central:    35_000,  // Miền Trung
  north:      35_000,  // Miền Bắc còn lại
  remote:     45_000,  // Tây Nguyên, vùng xa, đảo
  default:    30_000,  // Chưa xác định
};

/** Map tên tỉnh/thành (normalize) → zone */
const PROVINCE_ZONE_MAP: Record<string, ShippingZone> = {
  // ── Inner city ──────────────────────────────────────────────────────────────
  'hồ chí minh':    'inner_city',
  'tp hồ chí minh': 'inner_city',
  'tp.hcm':         'inner_city',
  'hcm':            'inner_city',
  'saigon':         'inner_city',
  'sài gòn':        'inner_city',
  'hà nội':         'inner_city',
  'ha noi':         'inner_city',

  // ── Nearby HCM ──────────────────────────────────────────────────────────────
  'bình dương':     'nearby',
  'binh duong':     'nearby',
  'đồng nai':       'nearby',
  'dong nai':       'nearby',
  'long an':        'nearby',
  'bà rịa':         'nearby',
  'vũng tàu':       'nearby',
  'bà rịa - vũng tàu': 'nearby',
  'tây ninh':       'nearby',

  // ── Nearby HN ───────────────────────────────────────────────────────────────
  'bắc ninh':       'nearby',
  'bac ninh':       'nearby',
  'hưng yên':       'nearby',
  'hung yen':       'nearby',
  'hà đông':        'nearby',
  'hà nam':         'nearby',
  'vĩnh phúc':      'nearby',
  'vinh phuc':      'nearby',

  // ── South ───────────────────────────────────────────────────────────────────
  'tiền giang':     'south',
  'tien giang':     'south',
  'bến tre':        'south',
  'ben tre':        'south',
  'vĩnh long':      'south',
  'vinh long':      'south',
  'đồng tháp':      'south',
  'dong thap':      'south',
  'an giang':       'south',
  'kiên giang':     'south',
  'kien giang':     'south',
  'cần thơ':        'south',
  'can tho':        'south',
  'hậu giang':      'south',
  'hau giang':      'south',
  'sóc trăng':      'south',
  'soc trang':      'south',
  'bạc liêu':       'south',
  'bac lieu':       'south',
  'cà mau':         'south',
  'ca mau':         'south',
  'trà vinh':       'south',
  'tra vinh':       'south',
  'bình phước':     'south',
  'binh phuoc':     'south',
  'bình thuận':     'south',
  'binh thuan':     'south',
  'ninh thuận':     'south',
  'ninh thuan':     'south',

  // ── Central ─────────────────────────────────────────────────────────────────
  'đà nẵng':        'central',
  'da nang':        'central',
  'thừa thiên huế': 'central',
  'huế':            'central',
  'hue':            'central',
  'quảng nam':      'central',
  'quang nam':      'central',
  'quảng ngãi':     'central',
  'quang ngai':     'central',
  'bình định':      'central',
  'binh dinh':      'central',
  'phú yên':        'central',
  'phu yen':        'central',
  'khánh hòa':      'central',
  'khanh hoa':      'central',
  'nha trang':      'central',
  'quảng bình':     'central',
  'quang binh':     'central',
  'quảng trị':      'central',
  'quang tri':      'central',
  'hà tĩnh':        'central',
  'ha tinh':        'central',
  'nghệ an':        'central',
  'nghe an':        'central',
  'thanh hóa':      'central',
  'thanh hoa':      'central',
  'ninh bình':      'central',
  'ninh binh':      'central',
  'nam định':       'central',
  'nam dinh':       'central',
  'thái bình':      'central',
  'thai binh':      'central',

  // ── North ───────────────────────────────────────────────────────────────────
  'hải phòng':      'north',
  'hai phong':      'north',
  'hải dương':      'north',
  'hai duong':      'north',
  'quảng ninh':     'north',
  'quang ninh':     'north',
  'thái nguyên':    'north',
  'thai nguyen':    'north',
  'bắc giang':      'north',
  'bac giang':      'north',
  'phú thọ':        'north',
  'phu tho':        'north',
  'yên bái':        'north',
  'yen bai':        'north',
  'lào cai':        'north',
  'lao cai':        'north',
  'hòa bình':       'north',
  'hoa binh':       'north',
  'sơn la':         'north',
  'son la':         'north',

  // ── Remote ──────────────────────────────────────────────────────────────────
  'đắk lắk':        'remote',
  'dak lak':        'remote',
  'đắk nông':       'remote',
  'dak nong':       'remote',
  'gia lai':        'remote',
  'kon tum':        'remote',
  'lâm đồng':       'remote',
  'lam dong':       'remote',
  'đà lạt':         'remote',
  'da lat':         'remote',
  'điện biên':      'remote',
  'dien bien':      'remote',
  'lai châu':       'remote',
  'lai chau':       'remote',
  'hà giang':       'remote',
  'ha giang':       'remote',
  'cao bằng':       'remote',
  'cao bang':       'remote',
  'lạng sơn':       'remote',
  'lang son':       'remote',
  'bắc kạn':        'remote',
  'bac kan':        'remote',
  'tuyên quang':    'remote',
  'tuyen quang':    'remote',
  'phú quốc':       'remote',
  'phu quoc':       'remote',
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Loại bỏ dấu tiếng Việt để fallback so sánh không dấu
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Normalize chuỗi: lowercase + Unicode NFC + bỏ "tỉnh"/"thành phố"/"tp."
 */
function normalizeProvinceName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/^(tỉnh|thành phố|tp\.?)\s*/i, '')
    .trim();
}

/**
 * Trích xuất tỉnh/thành phố từ địa chỉ Nominatim.
 * Nominatim trả về dạng: "123 Đường ABC, Phường X, Quận Y, TP. Hồ Chí Minh"
 * → lấy phần cuối cùng sau dấu phẩy cuối.
 */
export function extractProvince(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  // Lấy phần cuối (thường là tỉnh/thành phố)
  return parts[parts.length - 1] || '';
}

/**
 * Lấy zone của tỉnh/thành phố.
 */
function getProvinceZone(province: string): ShippingZone {
  if (!province) return 'default';
  const normalized = normalizeProvinceName(province);
  const unaccented = removeAccents(normalized);

  // 1. Match trực tiếp gốc (NFC)
  if (PROVINCE_ZONE_MAP[normalized]) return PROVINCE_ZONE_MAP[normalized];

  // 2. Match một phần gốc (để bắt "Hồ Chí Minh" trong "TP. Hồ Chí Minh")
  for (const [key, zone] of Object.entries(PROVINCE_ZONE_MAP)) {
    const keyNfc = key.normalize('NFC');
    if (normalized.includes(keyNfc) || keyNfc.includes(normalized)) {
      return zone;
    }
  }

  // 3. Fallback match không dấu (cho trường hợp người dùng gõ không dấu)
  for (const [key, zone] of Object.entries(PROVINCE_ZONE_MAP)) {
    const keyUnaccented = removeAccents(key);
    if (unaccented.includes(keyUnaccented) || keyUnaccented.includes(unaccented)) {
      return zone;
    }
  }

  return 'default';
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

/**
 * Tính phí vận chuyển.
 *
 * @param province           Tên tỉnh/thành (đã extract từ địa chỉ)
 * @param totalItemQuantity  Tổng số lượng món hàng (sum of item.quantity)
 * @param subtotalAfterDiscount  Tổng đơn sau khi áp discount (membership + voucher)
 * @returns Phí vận chuyển (đơn vị VND). 0 nếu freeship.
 */
export function calculateShippingFee(
  province: string,
  totalItemQuantity: number,
  subtotalAfterDiscount: number
): number {
  // Miễn phí khi đơn đạt ngưỡng
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) return 0;

  const zone = getProvinceZone(province);
  const baseFee = ZONE_BASE_FEE[zone];

  // Phụ phí số lượng vượt giới hạn
  const extraItems = Math.max(0, totalItemQuantity - FREE_ITEM_LIMIT);
  const extraFee = extraItems * EXTRA_ITEM_FEE;

  return baseFee + extraFee;
}
