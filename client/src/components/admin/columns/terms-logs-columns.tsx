import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TermsLogsColumnsProps {
  onDelete: (id: number) => void;
}

export const termsLogsColumns = ({ onDelete }: TermsLogsColumnsProps): ColumnDef<any>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "acceptedAt",
    header: "Accepted Date",
    cell: ({ row }) => {
      const date = row.getValue("acceptedAt") as string;
      if (!date) return "N/A";
      
      try {
        return format(new Date(date), "MMM d, yyyy h:mm a");
      } catch (e) {
        return date;
      }
    },
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ row }) => row.getValue("ipAddress") || "N/A",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const log = row.original;
      
      return (
        <div className="flex space-x-2 justify-end">
          <Button 
            size="icon" 
            variant="outline"
            className="h-8 w-8 border-red-200 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDelete(log.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];