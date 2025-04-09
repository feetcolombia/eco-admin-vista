import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Website } from "@/api/types/productTypes";

interface ProductFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategories: number[];
  handleCategorySelection: (categoryId: number) => void;
  categories: any[];
  categoriesLoading: boolean;
  selectedWebsite: string;
  setSelectedWebsite: (value: string) => void;
  websites: Website[];
  websitesLoading: boolean;
  onSearch: () => void;
}

export function ProductFilters({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  handleCategorySelection,
  categories,
  categoriesLoading,
  selectedWebsite,
  setSelectedWebsite,
  websites,
  websitesLoading,
  onSearch
}: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <div className="flex-1">
          <Label>Buscar por SKU</Label>
          <div className="relative flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Digite o SKU do produto..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="button" 
              onClick={onSearch}
              className="bg-ecommerce-500 hover:bg-ecommerce-600"
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="w-full md:w-72">
          <Label>Website</Label>
          <Select
            value={selectedWebsite}
            onValueChange={setSelectedWebsite}
            disabled={websitesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={websitesLoading ? "Carregando..." : "Selecione um website"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {websites.map((website) => (
                <SelectItem key={website.id} value={website.id.toString()}>
                  {website.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-72">
          <Label>Categoria</Label>
          <Select
            value={selectedCategories[0]?.toString() || "all"}
            onValueChange={(value) => handleCategorySelection(value === "all" ? 0 : Number(value))}
            disabled={categoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
