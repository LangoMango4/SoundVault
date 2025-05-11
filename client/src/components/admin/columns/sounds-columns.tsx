import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play } from "lucide-react";

interface SoundsColumnsProps {
  onDelete: (id: number) => void;
}

export const soundsColumns = ({ onDelete }: SoundsColumnsProps): ColumnDef<any>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Sound Name",
  },
  {
    accessorKey: "filename",
    header: "Filename",
  },
  {
    accessorKey: "categoryId",
    header: "Category",
    cell: ({ row }) => {
      const categoryId = row.getValue("categoryId");
      const categoryName = row.original.categoryName || "Uncategorized";
      
      return (
        <Badge variant="outline">
          {categoryName}
        </Badge>
      );
    },
  },
  {
    accessorKey: "accessLevel",
    header: "Access Level",
    cell: ({ row }) => {
      const accessLevel = row.getValue("accessLevel") as string;
      
      let badgeVariant = "secondary";
      if (accessLevel === "admin") badgeVariant = "destructive";
      else if (accessLevel === "full") badgeVariant = "default";
      
      return (
        <Badge variant={badgeVariant as any}>
          {accessLevel}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const sound = row.original;
      
      return (
        <div className="flex space-x-2 justify-end">
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8" 
            onClick={() => {
              const audio = new Audio(`/api/sounds/${sound.id}/file`);
              audio.play();
            }}
          >
            <Play className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="outline"
            className="h-8 w-8 border-red-200 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDelete(sound.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];