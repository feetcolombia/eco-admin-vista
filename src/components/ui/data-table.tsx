import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  align?: "left" | "center" | "right";
}

interface Action<T> {
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "ghost" | "outline";
  colorClass?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
}

export function DataTable<T>({ data, columns, actions }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              className={column.align === "right" ? "text-right" : "text-left"}
            >
              {column.header}
            </TableHead>
          ))}
          {actions && actions.length > 0 && (
            <TableHead className="text-right">Ações</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((column, colIndex) => (
              <TableCell
                key={colIndex}
                className={column.align === "right" ? "text-right" : "text-left"}
              >
                {typeof column.accessor === "function"
                  ? column.accessor(item)
                  : String(item[column.accessor])}
              </TableCell>
            ))}
            {actions && actions.length > 0 && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={action.variant || "ghost"}
                      size="icon"
                      onClick={() => action.onClick(item)}
                      className={action.colorClass}
                    >
                      {action.icon}
                    </Button>
                  ))}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 