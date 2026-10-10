import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../services/apiClient.ts";
import { PRICE_RANGES, GENDERS } from "../../components/customer/search/searchConstants.ts";
import { matchesProductSearch } from "../../utils/productSearchUtils";
import { calculateSalePrice } from "../../utils/priceUtils";
import { useLanguage } from "../../context/LanguageContext";

interface SearchProduct {
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  description?: string;
  description_vi?: string;
  description_en?: string;
  image_url?: string;
  gender?: "male" | "female" | "unisex";
  category_id?: number | string | null;
  price: number;
  sale_percent?: number;
}

interface SearchCategory {
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  [key: string]: unknown;
}

interface SearchPromotion {
  id: number;
  name?: string;
  buy_quantity: number;
  gift_quantity: number;
  [key: string]: unknown;
}

export function useSearch() {
  const { t, getLocalizedText } = useLanguage();
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [activePromotions, setActivePromotions] = useState<SearchPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || "";
  const urlGender = searchParams.get("gender") || "all";
  const urlCategory = searchParams.get("category") || "";

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [filterPrice, setFilterPrice] = useState(0);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [categoryPillStyle, setCategoryPillStyle] = useState({ top: 0, height: 0 });
  const categoryRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [pricePillStyle, setPricePillStyle] = useState({ top: 0, height: 0 });
  const priceRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const uniqueCategories = useMemo(() => {
    const unique: SearchCategory[] = [];
    const seen = new Set();
    categories.forEach((c) => {
      const key = (c.name || "").trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    });
    return unique;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    return products.filter((p) => {
      const matchQuery = matchesProductSearch(p, urlQuery);

      let matchGender = true;
      if (urlGender !== "all") matchGender = p.gender === urlGender;

      let matchCategory = true;
      if (urlCategory) {
        const currentCategory = categories.find(
          (c) => String(c.id) === String(urlCategory)
        );
        if (currentCategory) {
          const sameNameCategoryIds = categories
            .filter(
              (c) =>
                (c.name || "").trim().toLowerCase() ===
                currentCategory.name.trim().toLowerCase()
            )
            .map((c) => String(c.id));
          matchCategory = sameNameCategoryIds.includes(String(p.category_id));
        } else {
          matchCategory = String(p.category_id) === String(urlCategory);
        }
      }

      const selectedRange = PRICE_RANGES[filterPrice] || PRICE_RANGES[0];
      const price = calculateSalePrice(p.price, p.sale_percent);
      const matchPrice = price >= selectedRange.min && price < selectedRange.max;

      return matchQuery && matchGender && matchCategory && matchPrice;
    });
  }, [products, urlQuery, urlGender, urlCategory, filterPrice, categories]);

  const resultDisplayText = useMemo(() => {
    let text = t("search.all_products", "All Products");
    const currentCategory = categories.find((c) => String(c.id) === String(urlCategory));
    const catName = currentCategory ? getLocalizedText(currentCategory, "name") : "";

    if (urlQuery && catName) text = `"${urlQuery}" in ${catName}`;
    else if (urlQuery) text = `"${urlQuery}"`;
    else if (catName) text = catName;

    return text;
  }, [urlQuery, urlCategory, categories, t, getLocalizedText]);

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    let cancelled = false;
    const fetchAllProducts = async (): Promise<SearchProduct[]> => {
      const pageSize = 2000;
      const firstResponse = await API.get("/products", { params: { page: 1, limit: pageSize } });
      const extractProducts = (data: unknown): SearchProduct[] => {
        if (Array.isArray(data)) return data as SearchProduct[];
        if (data && typeof data === "object") {
          const record = data as { data?: unknown; products?: unknown };
          if (Array.isArray(record.data)) return record.data as SearchProduct[];
          if (Array.isArray(record.products)) return record.products as SearchProduct[];
        }
        return [];
      };

      const allProducts = extractProducts(firstResponse.data);
      const reportedPages = Number((firstResponse.data as { totalPages?: unknown })?.totalPages);
      const totalPages = Number.isFinite(reportedPages) && reportedPages > 0 ? Math.floor(reportedPages) : 1;

      // The search screen intentionally renders all matches without pagination. Fetch
      // remaining API pages in small batches so large catalogues aren't truncated.
      for (let firstPage = 2; firstPage <= totalPages; firstPage += 4) {
        const pageNumbers = Array.from(
          { length: Math.min(4, totalPages - firstPage + 1) },
          (_, index) => firstPage + index
        );
        const responses = await Promise.all(pageNumbers.map((page) =>
          API.get("/products", { params: { page, limit: pageSize } })
        ));
        responses.forEach((response) => allProducts.push(...extractProducts(response.data)));
      }
      return allProducts;
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, catRes, promoRes] = await Promise.all([
          fetchAllProducts(),
          API.get("/categories"),
          API.get("/promotions").catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        const catData = Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || [];
        const promoData = promoRes.data?.data || promoRes.data || [];

        setProducts(prodData);
        setCategories(catData);
        setActivePromotions(Array.isArray(promoData) ? promoData : []);
      } catch (err) {
        if (!cancelled) console.error("Error loading data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading) return;
    const activeIndex = GENDERS.findIndex((g) => g.id === urlGender);
    const index = activeIndex !== -1 ? activeIndex : 0;
    const activeButton = buttonRefs.current[index];

    if (activeButton) {
      setPillStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
    }
  }, [urlGender, loading]);

  useEffect(() => {
    if (loading) return;
    let activeIndex = 0;

    if (urlCategory) {
      const currentCat = categories.find((cat) => String(cat.id) === String(urlCategory));
      if (currentCat) {
        const index = uniqueCategories.findIndex((c) => c.name === currentCat.name);
        if (index !== -1) activeIndex = index + 1;
      }
    }

    const activeBtn = categoryRefs.current[activeIndex];
    if (activeBtn) {
      setCategoryPillStyle({ top: activeBtn.offsetTop, height: activeBtn.offsetHeight });
    }
  }, [urlCategory, uniqueCategories, categories, loading]);

  useEffect(() => {
    if (loading) return;
    const activeBtn = priceRefs.current[filterPrice];
    if (activeBtn) {
      setPricePillStyle({ top: activeBtn.offsetTop, height: activeBtn.offsetHeight });
    }
  }, [filterPrice, loading]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) newParams.set("query", searchInput);
    else newParams.delete("query");
    setSearchParams(newParams);
  };

  const updateFilter = (key: string, value: string | number) => {
    if (key === "price") {
      setFilterPrice(Number(value));
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") newParams.set(key, String(value));
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setFilterPrice(0);
    setSearchInput("");
  };

  return {
    state: {
      loading, showMobileFilter, searchInput, filterPrice, urlGender, urlCategory,
      pillStyle, categoryPillStyle, pricePillStyle,
      uniqueCategories, categories, filteredProducts, activePromotions, resultDisplayText
    },
    refs: {
      buttonRefs, categoryRefs, priceRefs
    },
    actions: {
      setSearchInput, setShowMobileFilter, handleSearchSubmit, updateFilter, clearFilters
    }
  };
}
