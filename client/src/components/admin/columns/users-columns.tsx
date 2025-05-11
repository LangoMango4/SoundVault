import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface UsersColumnsProps {
  onEdit: (user: any) => void;
  onDelete: (id: number) => void;
  onApprove: (user: any) => void;
  onReject: (user: any) => void;
}

export const usersColumns = ({ onEdit, onDelete, onApprove, onReject }: UsersColumnsProps): ColumnDef<any>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "fullName",
    header: "Full Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      
      return (
        <Badge variant={role === "admin" ? "destructive" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "approved",
    header: "Status",
    cell: ({ row }) => {
      const approved = row.getValue("approved");
      
      return (
        <Badge variant={approved ? "success" : "outline"} className={approved ? "bg-green-100 text-green-800 hover:bg-green-100/80" : "bg-amber-100 text-amber-800 hover:bg-amber-100/80"}>
          {approved ? "Approved" : "Pending"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "registration_date",
    header: "Registered",
    cell: ({ row }) => {
      const date = row.getValue("registration_date") as string;
      if (!date) return "N/A";
      
      try {
        return format(new Date(date), "MMM d, yyyy");
      } catch (e) {
        return date;
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      const approved = row.getValue("approved");
      
      return (
        <div className="flex space-x-2 justify-end">
          {!approved && (
            <>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-8 w-8 bg-green-50 border-green-200 hover:bg-green-100" 
                onClick={() => onApprove(user)}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-8 w-8 bg-red-50 border-red-200 hover:bg-red-100" 
                onClick={() => onReject(user)}
              >
                <XCircle className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
          
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8" 
            onClick={() => onEdit(user)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="outline"
            className="h-8 w-8 border-red-200 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDelete(user.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];