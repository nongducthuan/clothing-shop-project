import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = "Clothing Shop - Thời Trang & Phụ Kiện";
const DEFAULT_DESCRIPTION =
  "Cửa hàng thời trang nam nữ phong cách hiện đại, thanh toán trực tuyến MoMo/VNPay, giao hàng nhanh toàn quốc.";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image,
  url,
  type = "website",
}: SEOProps) {
  const pageTitle = title ? `${title} | Clothing Shop` : DEFAULT_TITLE;
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
