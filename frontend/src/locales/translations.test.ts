import { describe, it, expect } from 'vitest';
import { translations } from './translations';

/**
 * Chặn tái phát lỗi double-encode (mojibake).
 *
 * File translations.ts từng bị lưu sai encoding: nội dung UTF-8 bị decode nhầm bằng
 * codepage đơn byte rồi ghi lại, khiến 'Sắp ra mắt' thành 'Sáº¯p ra máº¯t' và toàn bộ
 * giao diện tiếng Việt hiển thị sai. Các ký tự dưới đây không bao giờ có trong
 * tiếng Việt đúng chuẩn nhưng luôn xuất hiện khi bị lỗi kiểu này.
 *
 * Nếu test fail: chạy `node scripts/fix-mojibake.cjs --write` để sửa lại.
 */
const MOJIBAKE_SIGNATURES = /[»ºÆ¡¿½¾²³µ¶·¸¹]|[\u0080-\u009F]/;

describe('translations – encoding tiếng Việt', () => {
  it('locale vi không còn dấu hiệu double-encode', () => {
    const broken = Object.entries(translations.vi).filter(([, value]) =>
      MOJIBAKE_SIGNATURES.test(String(value))
    );
    expect(broken).toEqual([]);
  });

  it('giữ đúng nội dung tiếng Việt của các key quan trọng', () => {
    expect(translations.vi['nav.home']).toBe('Trang chủ');
    expect(translations.vi['nav.login']).toBe('Đăng nhập');
    expect(translations.vi['admin.user_management']).toBe('Quản lý Người dùng');
    expect(translations.vi['admin.toast_new_order']).toBe(
      'Đơn hàng mới #{orderId} từ {customerName} - {total}'
    );
    expect(translations.vi['admin.users_title']).toBe('Người dùng');
    expect(translations.vi['admin.confirm_delete_user']).toBe(
      'Bạn có chắc muốn xóa người dùng này?'
    );
  });

  it('key của 2 locale luôn khớp nhau', () => {
    expect(Object.keys(translations.vi).sort()).toEqual(Object.keys(translations.en).sort());
  });
});
