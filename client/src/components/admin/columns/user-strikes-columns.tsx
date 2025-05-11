import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const userStrikesColumns: ColumnDef<any>[] = [
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "strikeCount",
    header: "Strike Count",
    cell: ({ row }) => {
      const count = row.getValue("strikeCount") as number;
      
      let badgeVariant = "secondary";
      if (count >= 5) badgeVariant = "destructive";
      else if (count >= 3) badgeVariant = "warning";
      
      return (
        <Badge variant={badgeVariant as any}>
          {count}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lastStrikeDate",
    header: "Last Strike",
    cell: ({ row }) => {
      const date = row.getValue("lastStrikeDate") as string;
      if (!date) return "N/A";
      
      try {
        return format(new Date(date), "MMM d, yyyy");
      } catch (e) {
        return date;
      }
    },
  },
  {
    accessorKey: "status",
    header: "Chat Status",
    cell: ({ row }) => {
      const strikeCount = row.getValue("strikeCount") as number;
      const restricted = strikeCount >= 5;
      
      return (
        <Badge variant={restricted ? "destructive" : "success"} className={restricted ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
          {restricted ? "Restricted" : "Normal"}
        </Badge>
      );
    },
  },
];