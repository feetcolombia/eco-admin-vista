
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Website, Category } from "@/api/productApi";

interface ProductFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: number[];
  handleCategorySelection: (categoryId: number) => void;
  categories: Category[];
  categoriesLoading: boolean;
  selectedWebsite: string;
  setSelectedWebsite: (websiteId: string) => void;
  websites: Website[];
  websitesLoading: boolean;
}

export const ProductFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  handleCategorySelection,
  categories,
  categoriesLoading,
  selectedWebsite,
  setSelectedWebsite,
  websites,
  websitesLoading
}: ProductFiltersProps) => {
  return (
    <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          placeholder="Buscar produtos..." 
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="min-w-[220px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedCategories.length === 0 
                  ? "Categorias" 
                  : `${selectedCategories.length} selecionadas`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-5 h-5 border-2 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategorySelection(category.id)}
                    className={`pl-${category.level * 2}`}
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="min-w-[220px]">
          <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
            <SelectTrigger>
              <SelectValue placeholder="Websites" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {websitesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-5 h-5 border-2 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                websites.map((website) => (
                  <SelectItem key={website.id} value={website.id.toString()}>
                    {website.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
