import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define columns for terms logs table
export const termsLogsColumns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "userId",
    header: "User ID",
  },
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
  },
  {
    accessorKey: "userAgent",
    header: "User Agent",
    cell: ({ row }) => {
      const userAgent = row.getValue("userAgent") as string;
      // Truncate long user agents
      return userAgent?.length > 30 ? userAgent.substring(0, 30) + "..." : userAgent;
    },
  },
  {
    accessorKey: "acceptedAt",
    header: "Accepted At",
    cell: ({ row }) => {
      const date = row.getValue("acceptedAt");
      if (!date) return "-";
      return new Date(date as string).toLocaleString();
    },
  },
  {
    accessorKey: "termsVersion",
    header: "Terms Version",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const log = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(log.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(log.ipAddress)}
            >
              Copy IP Address
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Log</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];