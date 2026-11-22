import { getStorefrontUrl } from '../../utils/storefrontUrl';

const envOf = (values: Record<string, string | undefined>): NodeJS.ProcessEnv =>
  values as NodeJS.ProcessEnv;

describe('getStorefrontUrl', () => {
  it('ưu tiên STOREFRONT_URL và bỏ dấu / ở cuối', () => {
    expect(
      getStorefrontUrl(
        envOf({
          STOREFRONT_URL: ' https://shop.vercel.app/ ',
          FRONTEND_URL: 'https://other.vercel.app',
        })
      )
    ).toBe('https://shop.vercel.app');
  });

  it('lấy origin đầu tiên của FRONTEND_URL khi không có STOREFRONT_URL', () => {
    expect(
      getStorefrontUrl(
        envOf({ FRONTEND_URL: 'https://shop.vercel.app/, https://shop-admin.vercel.app' })
      )
    ).toBe('https://shop.vercel.app');
  });

  it('dùng FRONTEND_URL một giá trị như cũ', () => {
    expect(getStorefrontUrl(envOf({ FRONTEND_URL: 'https://shop.example.com' }))).toBe(
      'https://shop.example.com'
    );
  });

  it('bỏ qua STOREFRONT_URL rỗng/khoảng trắng', () => {
    expect(
      getStorefrontUrl(envOf({ STOREFRONT_URL: '   ', FRONTEND_URL: 'https://shop.example.com' }))
    ).toBe('https://shop.example.com');
  });

  it('fallback về localhost:5173 khi không cấu hình gì', () => {
    expect(getStorefrontUrl(envOf({}))).toBe('http://localhost:5173');
    expect(getStorefrontUrl(envOf({ FRONTEND_URL: ' , ' }))).toBe('http://localhost:5173');
  });
});
