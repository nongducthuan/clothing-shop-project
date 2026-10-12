import { describe, expect, it } from 'vitest';
import { matchesProductSearch, normalizeSearchText } from './productSearchUtils';

describe('productSearchUtils', () => {
  it('normalizes Vietnamese accents and the letter đ', () => {
    expect(normalizeSearchText('Đầm Áo Sơ Mi')).toBe('dam ao so mi');
  });

  it('finds products by Vietnamese names without requiring accents', () => {
    expect(matchesProductSearch({ name_vi: 'Áo sơ mi nữ' }, 'ao so mi')).toBe(true);
  });

  it('finds products by English names', () => {
    expect(matchesProductSearch({ name_en: 'Cotton Oversized T-Shirt' }, 'oversized')).toBe(true);
  });

  it('finds products by localized descriptions', () => {
    expect(matchesProductSearch({ description_en: 'Soft breathable cotton fabric' }, 'breathable')).toBe(true);
    expect(matchesProductSearch({ description_vi: 'Chất liệu cotton thoáng mát' }, 'thoang mat')).toBe(true);
  });

  it('matches an empty query and safely ignores missing text fields', () => {
    expect(matchesProductSearch({}, '')).toBe(true);
    expect(matchesProductSearch({}, 'shirt')).toBe(false);
  });
});
