import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export const moderationLogsColumns: ColumnDef<any>[] = [
  {
    accessorKey: "timestamp",
    header: "Date/Time",
    cell: ({ row }) => {
      const date = row.getValue("timestamp") as string;
      if (!date) return "N/A";
      
      try {
        return format(new Date(date), "MMM d, yyyy h:mm a");
      } catch (e) {
        return date;
      }
    },
  },
  {
    accessorKey: "username",
    header: "User",
  },
  {
    accessorKey: "original_content",
    header: "Original Message",
    cell: ({ row }) => {
      const content = row.getValue("original_content") as string;
      
      return (
        <div className="max-w-sm truncate bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
          {content}
        </div>
      );
    },
  },
  {
    accessorKey: "filtered_content",
    header: "Filtered Message",
  },
  {
    accessorKey: "reason",
    header: "Reason",
  },
];