import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../services/apiClient.js";
import { PRICE_RANGES, GENDERS } from "../../components/customer/search/searchConstants.js";

export function useSearch() {
  // --- STATES ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // URL Params
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || "";
  const urlGender = searchParams.get("gender") || "all";
  const urlCategory = searchParams.get("category") || "";

  // Local Filters
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [filterPrice, setFilterPrice] = useState(0);

  // Pill Styles & Refs
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef([]);

  const [categoryPillStyle, setCategoryPillStyle] = useState({ top: 0, height: 0 });
  const categoryRefs = useRef([]);

  const [pricePillStyle, setPricePillStyle] = useState({ top: 0, height: 0 });
  const priceRefs = useRef([]);

  // --- MEMOS ---
  const uniqueCategories = useMemo(() => {
    const unique = [];
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
      const productNameNorm = (p.name || "").toLowerCase();
      const queryNorm = (urlQuery || "").toLowerCase();
      const matchQuery = productNameNorm.includes(queryNorm);

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
      const price = Number(p.price) || 0;
      const matchPrice = price >= selectedRange.min && price < selectedRange.max;

      return matchQuery && matchGender && matchCategory && matchPrice;
    });
  }, [products, urlQuery, urlGender, urlCategory, filterPrice, categories]);

  const resultDisplayText = useMemo(() => {
    let text = "All Products";
    const currentCategory = categories.find((c) => String(c.id) === String(urlCategory));
    const catName = currentCategory ? currentCategory.name : "";

    if (urlQuery && catName) text = `"${urlQuery}" in ${catName}`;
    else if (urlQuery) text = `"${urlQuery}"`;
    else if (catName) text = catName;

    return text;
  }, [urlQuery, urlCategory, categories]);

  // --- EFFECTS ---
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, promoRes] = await Promise.all([
          API.get("/products?limit=2000"),
          API.get("/categories"),
          API.get("/promotions").catch(() => ({ data: [] })),
        ]);

        const prodData = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.data || [];
        const catData = Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || [];
        const promoData = promoRes.data?.data || promoRes.data || [];

        setProducts(prodData);
        setCategories(catData);
        setActivePromotions(promoData);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate Gender Pill Style
  useEffect(() => {
    if (loading) return;
    const activeIndex = GENDERS.findIndex((g) => g.id === urlGender);
    const index = activeIndex !== -1 ? activeIndex : 0;
    const activeButton = buttonRefs.current[index];

    if (activeButton) {
      setPillStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
    }
  }, [urlGender, loading]);

  // Calculate Category Pill Style
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

  // Calculate Price Pill Style
  useEffect(() => {
    if (loading) return;
    const activeBtn = priceRefs.current[filterPrice];
    if (activeBtn) {
      setPricePillStyle({ top: activeBtn.offsetTop, height: activeBtn.offsetHeight });
    }
  }, [filterPrice, loading]);

  // --- HANDLERS ---
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) newParams.set("query", searchInput);
    else newParams.delete("query");
    setSearchParams(newParams);
  };

  const updateFilter = (key, value) => {
    if (key === "price") {
      setFilterPrice(value);
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") newParams.set(key, value);
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
