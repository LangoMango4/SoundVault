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

// Define columns for user strikes table
export const userStrikesColumns: ColumnDef<any>[] = [
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
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.getValue("reason") as string;
      // Truncate long reasons
      return reason?.length > 40 ? reason.substring(0, 40) + "..." : reason;
    },
  },
  {
    accessorKey: "moderationType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("moderationType") as string;
      let className = "px-2 py-1 rounded-full text-xs ";
      
      switch(type) {
        case "profanity":
          className += "bg-yellow-100 text-yellow-800";
          break;
        case "hate_speech":
          className += "bg-red-100 text-red-800";
          break;
        case "inappropriate":
          className += "bg-orange-100 text-orange-800";
          break;
        case "concerning":
          className += "bg-purple-100 text-purple-800";
          break;
        case "personal_info":
          className += "bg-blue-100 text-blue-800";
          break;
        default:
          className += "bg-gray-100 text-gray-800";
      }
      
      return <span className={className}>{type}</span>;
    }
  },
  {
    accessorKey: "originalMessage",
    header: "Original Message",
    cell: ({ row }) => {
      const message = row.getValue("originalMessage") as string;
      // Truncate long messages
      return message?.length > 30 ? message.substring(0, 30) + "..." : message;
    },
  },
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }) => {
      const date = row.getValue("timestamp");
      if (!date) return "-";
      return new Date(date as string).toLocaleString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const strike = row.original;
      
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
              onClick={() => navigator.clipboard.writeText(strike.originalMessage)}
            >
              Copy Message
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete Strike</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];