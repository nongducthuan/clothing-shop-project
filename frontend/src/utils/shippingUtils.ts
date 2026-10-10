// Tính phí vận chuyển dựa theo tỉnh/thành phố, số lượng sản phẩm và tổng đơn hàng.

// Ngưỡng miễn phí vận chuyển
export const FREE_SHIPPING_THRESHOLD = 500_000;

// Phụ phí mỗi món vượt quá giới hạn
const EXTRA_ITEM_FEE = 5_000;
const FREE_ITEM_LIMIT = 5;

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
  'hồ chí minh':    'inner_city',
  'tp hồ chí minh': 'inner_city',
  'tp.hcm':         'inner_city',
  'hcm':            'inner_city',
  'saigon':         'inner_city',
  'sài gòn':        'inner_city',
  'hà nội':         'inner_city',
  'ha noi':         'inner_city',

  'bình dương':     'nearby',
  'binh duong':     'nearby',
  'đồng nai':       'nearby',
  'dong nai':       'nearby',
  'long an':        'nearby',
  'bà rịa':         'nearby',
  'vũng tàu':       'nearby',
  'bà rịa - vũng tàu': 'nearby',
  'tây ninh':       'nearby',

  'bắc ninh':       'nearby',
  'bac ninh':       'nearby',
  'hưng yên':       'nearby',
  'hung yen':       'nearby',
  'hà đông':        'inner_city',
  'ha dong':        'inner_city',
  'hà nam':         'nearby',
  'vĩnh phúc':      'nearby',
  'vinh phuc':      'nearby',

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
  'ninh bình':      'north',
  'ninh binh':      'north',
  'nam định':       'north',
  'nam dinh':       'north',
  'thái bình':      'north',
  'thai binh':      'north',

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
 * Tách chuỗi thành các "từ" (bỏ dấu câu, gộp khoảng trắng) để so khớp theo CỤM TỪ NGUYÊN VẸN.
 * Không so khớp chuỗi con: "nam" / "an" / "hà" không còn bị khớp nhầm vào tỉnh nào.
 */
function toTokens(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}

interface ZoneEntry {
  phrase: string;
  plain: string;
  zone: ShippingZone;
}

// Cụm dài được thử trước để kết quả khớp cụ thể nhất luôn thắng.
const ZONE_ENTRIES: ZoneEntry[] = Object.entries(PROVINCE_ZONE_MAP)
  .map(([key, zone]) => {
    const phrase = toTokens(key);
    return { phrase, plain: removeAccents(phrase), zone };
  })
  .sort((a, b) => b.phrase.length - a.phrase.length);

/** `text` có chứa nguyên cụm `phrase` (ranh giới từ) hay không. */
function containsPhrase(text: string, phrase: string): boolean {
  return phrase.length > 0 && ` ${text} `.includes(` ${phrase} `);
}

// Tên quốc gia hay xuất hiện ở cuối địa chỉ (đã bỏ dấu, lowercase).
const COUNTRY_SEGMENTS = new Set([
  'viet nam',
  'vietnam',
  'vn',
  'vnm',
  'cong hoa xa hoi chu nghia viet nam',
  'socialist republic of vietnam',
]);

/** Đoạn địa chỉ KHÔNG phải tỉnh/thành: mã bưu chính (4-6 chữ số) hoặc tên quốc gia. */
function isNonProvinceSegment(segment: string): boolean {
  const compact = segment.replace(/[\s-]+/g, '');
  if (/^\d{4,6}$/.test(compact)) return true;
  return COUNTRY_SEGMENTS.has(removeAccents(toTokens(segment)));
}

/**
 * Trích xuất tỉnh/thành phố từ địa chỉ.
 * Địa chỉ dạng: "123 Đường ABC, Phường X, Quận Y, TP. Hồ Chí Minh"
 * → lấy đoạn cuối sau dấu phẩy, NHƯNG bỏ qua mã bưu chính và tên quốc gia ở cuối
 *   (VD "..., Hà Nội, 100000, Việt Nam" → "Hà Nội").
 */
export function extractProvince(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  while (parts.length > 1 && isNonProvinceSegment(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts[parts.length - 1] || '';
}

/**
 * Lấy zone của tỉnh/thành phố.
 */
function getProvinceZone(province: string): ShippingZone {
  if (!province) return 'default';
  const text = toTokens(normalizeProvinceName(province));
  if (!text) return 'default';

  // 1. Khớp cụm từ nguyên vẹn (có dấu) — bắt "Hồ Chí Minh" trong "TP. Hồ Chí Minh 700000"
  for (const entry of ZONE_ENTRIES) {
    if (containsPhrase(text, entry.phrase)) return entry.zone;
  }

  // 2. Fallback không dấu (người dùng gõ "ho chi minh", "ha noi"...)
  const plain = removeAccents(text);
  for (const entry of ZONE_ENTRIES) {
    if (containsPhrase(plain, entry.plain)) return entry.zone;
  }

  return 'default';
}

/**
 * Tính phí vận chuyển.
 *
 * @param province           Tên tỉnh/thành (đã extract từ địa chỉ)
 * @param totalItemQuantity  Tổng số lượng món hàng (sum of item.quantity)
 * @param subtotalAfterDiscount  Tổng đơn sau khi áp discount (membership + voucher)
 * @returns Phí vận chuyển (đơn vị VND). 0 nếu freeship.
 */
export function calculateShippingFee(
  province: string | undefined | null,
  totalItemQuantity: number,
  subtotalAfterDiscount: number
): number | null {
  // Miễn phí khi đơn đạt ngưỡng
  if (subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD) return 0;

  // Nếu chưa có địa chỉ, trả về null để báo UI cần tính toán sau
  if (!province) return null;

  const zone = getProvinceZone(province);
  const baseFee = ZONE_BASE_FEE[zone];

  // Phụ phí số lượng vượt giới hạn
  const extraItems = Math.max(0, totalItemQuantity - FREE_ITEM_LIMIT);
  const extraFee = extraItems * EXTRA_ITEM_FEE;

  return baseFee + extraFee;
}

export function getShippingZoneKey(province: string): string {
  const zone = getProvinceZone(province);
  return `shipping.zone.${zone}`;
}
