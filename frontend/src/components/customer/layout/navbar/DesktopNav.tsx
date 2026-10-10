import { useState, useRef } from "react";
import type { MouseEvent } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { getImageUrl as getImgUrl } from "../../../../utils/imageUtils";
import { GENDERS } from "./navbarShared";
import type { CategoryItem, Gender, NavigateFn } from "./navbarShared";

const DesktopNav = ({ menuData, navigate }: { menuData: Record<Gender, CategoryItem[]>; navigate: NavigateFn }) => {
  const [hoveredGender, setHoveredGender] = useState<Gender | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const closeTimer = useRef<number | null>(null);
  const { t } = useLanguage();
  const { getLocalizedText } = useLanguage();

  const handleMouseEnter = (gender: Gender, e: MouseEvent<HTMLDivElement>) => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    setHoveredGender(gender);

    if (e.currentTarget) {
      setPillStyle({
        left: e.currentTarget.offsetLeft,
        width: e.currentTarget.offsetWidth,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    closeTimer.current = window.setTimeout(() => {
      setHoveredGender(null);
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }, 200);
  };

  return (
    <div
      className="hidden md:flex relative bg-slate-100/80 dark:bg-white/10 backdrop-blur-sm rounded-full p-1.5 mx-auto shadow-inner border border-slate-200/60 dark:border-white/10"
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute top-1.5 bottom-1.5 bg-violet-600 rounded-full transition-all duration-300 ease-out shadow-md pointer-events-none"
        style={pillStyle}
      ></div>

      {GENDERS.map((gender) => (
        <div
          key={gender}
          className="relative z-10"
          onMouseEnter={(e) => handleMouseEnter(gender, e)}
        >
          <div
            className={`cursor-pointer uppercase font-bold text-sm tracking-wide px-6 py-2 transition-colors duration-300 ${
              hoveredGender === gender
                ? "text-white"
                : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t(`gender.${gender}`)}
          </div>

          {hoveredGender === gender && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-5 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-[600px] z-50 animate-fadeIn"
              onMouseEnter={() => { if (closeTimer.current !== null) window.clearTimeout(closeTimer.current); }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4">
                {menuData[gender].map((cat) => (
                  <div
                    key={cat.id}
                    className="cursor-pointer group text-center"
                    onClick={() => navigate(`/category/${cat.id}?gender=${gender}`)}
                  >
                    <div className="mx-auto w-32 aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-colors group-hover:border-violet-500 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/40">
                      <img
                        src={getImgUrl(cat.image_url || cat.preview_image)}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                        alt={getLocalizedText(cat, 'name')}
                      />
                    </div>
                    <span className="block text-sm font-bold mt-3 text-slate-800 dark:text-slate-200 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {getLocalizedText(cat, 'name')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DesktopNav;
