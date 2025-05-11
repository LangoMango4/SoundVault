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

// Define columns for users table
export const usersColumns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: "ID",
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
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "accessLevel",
    header: "Access Level",
  },
  {
    accessorKey: "approved",
    header: "Approved",
    cell: ({ row }) => {
      const approved = row.getValue("approved");
      return (
        <div className="text-center">
          {approved ? (
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Yes</span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">No</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "registration_date",
    header: "Registration Date",
    cell: ({ row }) => {
      const date = row.getValue("registration_date");
      return date ? new Date(date as string).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      
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
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem>Edit User</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];