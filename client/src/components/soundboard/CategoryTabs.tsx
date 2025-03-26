import { Category } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="mb-6 border-b border-neutral-200 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mb-6 border-b border-neutral-200">
      <nav className="flex space-x-4 overflow-x-auto pb-2">
        <button
          key="all"
          onClick={() => onSelectCategory("all")}
          className={`px-4 py-2 whitespace-nowrap ${
            selectedCategory === "all"
              ? "text-primary border-b-2 border-primary font-medium"
              : "text-neutral-600 hover:text-primary"
          }`}
        >
          All Sounds
        </button>
        
        {categories?.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.slug)}
            className={`px-4 py-2 whitespace-nowrap ${
              selectedCategory === category.slug
                ? "text-primary border-b-2 border-primary font-medium"
                : "text-neutral-600 hover:text-primary"
            }`}
          >
            {category.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
