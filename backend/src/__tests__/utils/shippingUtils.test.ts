import { calculateShippingFee, extractProvince, getShippingZoneKey, FREE_SHIPPING_THRESHOLD } from '../../utils/shippingUtils';

// Bản backend của shippingUtils phải khớp frontend/src/utils/shippingUtils.ts.
describe('shippingUtils (server)', () => {
    it('miễn phí ship khi đơn đạt ngưỡng, kể cả khi chưa có tỉnh', () => {
        expect(calculateShippingFee('', 1, FREE_SHIPPING_THRESHOLD)).toBe(0);
    });

    it('trả null khi thiếu tỉnh và đơn chưa đủ miễn phí', () => {
        expect(calculateShippingFee('', 1, 100000)).toBeNull();
    });

    it('tính phụ phí khi vượt 5 món', () => {
        expect(calculateShippingFee('Hồ Chí Minh', 6, 100000)).toBe(25000);
        expect(calculateShippingFee('Điện Biên', 8, 100000)).toBe(60000);
    });

    describe('extractProvince – bỏ mã bưu chính và quốc gia ở cuối địa chỉ', () => {
        it('bỏ "Việt Nam" ở cuối', () => {
            expect(extractProvince('12 Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh, Việt Nam')).toBe('Thành phố Hồ Chí Minh');
            expect(extractProvince('12 Nguyen Hue, Quan 1, Ho Chi Minh, Vietnam')).toBe('Ho Chi Minh');
        });

        it('bỏ mã bưu chính ở cuối', () => {
            expect(extractProvince('5 Phố Huế, Hà Nội, 100000')).toBe('Hà Nội');
            expect(extractProvince('5 Phố Huế, Hà Nội, 100000, Việt Nam')).toBe('Hà Nội');
        });

        it('không bỏ đoạn cuối nếu đó là đoạn duy nhất', () => {
            expect(extractProvince('Việt Nam')).toBe('Việt Nam');
            expect(extractProvince('')).toBe('');
        });

        it('không nhầm số nhà / số quận với mã bưu chính', () => {
            expect(extractProvince('Đường A, Quận 1')).toBe('Quận 1');
        });
    });

    describe('calculateShippingFee – nhận diện tỉnh/thành', () => {
        const fee = (province: string) => calculateShippingFee(province, 1, 100000);

        it('địa chỉ có quốc gia / mã bưu chính vẫn tính đúng vùng', () => {
            expect(fee(extractProvince('12 Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh, Việt Nam'))).toBe(20000);
            expect(fee(extractProvince('5 Phố Huế, Hà Nội, 100000, Việt Nam'))).toBe(20000);
            expect(fee(extractProvince('Hẻm 3, TP. Hồ Chí Minh 700000'))).toBe(20000);
        });

        it('chuỗi quá ngắn / chung chung KHÔNG bị khớp nhầm vào tỉnh nào (rơi về mặc định)', () => {
            for (const text of ['Nam', 'An', 'Hà', 'Bình', 'Long', 'Quảng']) {
                expect(fee(text)).toBe(30000);
            }
        });

        it('vẫn nhận diện tên viết không dấu, viết tắt, có tiền tố', () => {
            expect(fee('ho chi minh')).toBe(20000);
            expect(fee('Ha Noi')).toBe(20000);
            expect(fee('TP.HCM')).toBe(20000);
            expect(fee('tphcm')).toBe(20000);
            expect(fee('Thành phố Đà Nẵng')).toBe(35000);
            expect(fee('Tỉnh Bình Dương')).toBe(25000);
            expect(fee('Thừa Thiên Huế')).toBe(35000);
            expect(fee('Bà Rịa - Vũng Tàu')).toBe(25000);
        });

        it('tỉnh lạ / không có trong bảng → phí mặc định', () => {
            expect(fee('Atlantis')).toBe(30000);
        });
    });

    describe('vùng giao hàng', () => {
        it('Hà Đông là quận của Hà Nội → tính như nội thành', () => {
            expect(calculateShippingFee('Hà Đông', 1, 100000)).toBe(20000);
            expect(getShippingZoneKey('Hà Đông')).toBe('shipping.zone.inner_city');
        });

        it('Hà Nam vẫn là tỉnh lân cận', () => {
            expect(getShippingZoneKey('Hà Nam')).toBe('shipping.zone.nearby');
        });

        it('Nam Định / Thái Bình / Ninh Bình thuộc miền Bắc, Thanh Hóa vẫn là miền Trung', () => {
            expect(getShippingZoneKey('Nam Định')).toBe('shipping.zone.north');
            expect(getShippingZoneKey('Thái Bình')).toBe('shipping.zone.north');
            expect(getShippingZoneKey('Ninh Bình')).toBe('shipping.zone.north');
            expect(getShippingZoneKey('Thanh Hóa')).toBe('shipping.zone.central');
        });
    });
});
