
import { Category } from "@/api/productApi";

// Helper function to flatten the category tree for easier display
export const flattenCategories = (category: Category, categories: Category[] = []): Category[] => {
  categories.push(category);
  
  if (category.children_data && category.children_data.length > 0) {
    category.children_data.forEach(child => {
      flattenCategories(child, categories);
    });
  }
  
  return categories;
};
