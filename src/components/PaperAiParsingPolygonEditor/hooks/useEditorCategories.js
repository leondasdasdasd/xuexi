import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_CATEGORY_COLOR,
  normalizeCategories,
} from "../annotationGeometry";

/**
 * @param {{
 *   polygonCategories?: Array<string | import("../annotationGeometry").EditorCategory>
 * }} params
 */
export const useEditorCategories = ({ polygonCategories }) => {
  const categories = useMemo(
    () => normalizeCategories(polygonCategories),
    [polygonCategories],
  );
  const [activeCategory, setActiveCategory] = useState(
    categories.length > 0 ? categories[0].value : "",
  );

  useEffect(() => {
    const fallbackCategory = categories.length > 0 ? categories[0].value : "";

    setActiveCategory((currentCategory) => {
      if (
        currentCategory &&
        categories.some((item) => item.value === currentCategory)
      ) {
        return currentCategory;
      }

      return fallbackCategory;
    });
  }, [categories]);

  const categoryMap = useMemo(
    () =>
      categories.reduce((result, item) => {
        result[item.value] = item;
        return result;
      }, {}),
    [categories],
  );

  const activeCategoryConfig = activeCategory
    ? categoryMap[activeCategory]
    : null;
  const activeStrokeColor =
    (activeCategoryConfig && activeCategoryConfig.color) ||
    DEFAULT_CATEGORY_COLOR;

  return {
    activeCategory,
    activeStrokeColor,
    categories,
    categoryMap,
    setActiveCategory,
  };
};
