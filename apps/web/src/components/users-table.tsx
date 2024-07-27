import { paginatedUsersResponseSchema } from "@roles-permissions/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  Row,
  SortingState,
  Table,
  VisibilityState,
} from "@tanstack/react-table";
import { usersKeys, usersQuries } from "~/common/keys/users";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { DataTableViewOptions } from "~/components/ui/data-table/data-table-view-options";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuAlertDialogItem,
  DropdownMenuContent,
  DropdownMenuDialogItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UiTable,
} from "~/components/ui/table";
import { Route as ProductsRoute } from "~/routes/_auth/users/route";
import { api } from "~/utils/api-client";
import { format } from "date-fns";
import { HTTPError } from "ky";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";
import { z } from "zod";
import { Button } from "./ui/button";
import { DataTableColumnHeader } from "./ui/data-table/data-table-column-header";
import { DataTablePagination } from "./ui/data-table/data-table-pagination";

const usersSchema = paginatedUsersResponseSchema.shape.data.pick({
  users: true,
}).shape.users;

type User = z.infer<typeof usersSchema>[number];

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => <span>{format(row.original.createdAt, "PPP")}</span>,
  },
  {
    id: "actions",
    header: () => (
      <div className="flex h-8 items-center font-medium">Actions</div>
    ),
    cell: ({ row, table }) => <ProductsTableActions row={row} table={table} />,
  },
];

export function ProductsTable() {
  const navigate = useNavigate();
  const searchParams = ProductsRoute.useSearch({
    select: (search) => search,
  });

  const { data } = useQuery(usersQuries.list(searchParams));
  const pageCount = data?.data.pagination.total ?? 0;

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const globalFilter = React.useMemo(
    () => searchParams.name ?? "",
    [searchParams.name],
  );

  const pagination = React.useMemo(
    () => ({
      pageIndex: pageCount > 0 ? searchParams.page - 1 : -1,
      pageSize: searchParams.perPage,
    }),
    [searchParams.page, searchParams.perPage, pageCount],
  );

  function handleSetPagination(updaterOrValue?: unknown) {
    if (typeof updaterOrValue !== "function") return;

    const newPagination = updaterOrValue(pagination);
    navigate({
      to: "/users",
      search: {
        name: globalFilter,
        page: newPagination.pageIndex + 1,
        perPage: newPagination.pageSize,
      },
      replace: true,
    });
  }

  const table = useReactTable({
    data: data?.data.users ?? [],
    columns,
    state: {
      sorting,
      pagination,
      columnVisibility,
      globalFilter,
    },
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handleSetPagination,
    manualPagination: true,
  });

  return (
    <div className="mt-10 space-y-4">
      <ProductsTableToolbar table={table} />
      <div className="rounded-md border">
        <UiTable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No Products.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

interface ProductsToolbarProps<TData> {
  table: Table<TData>;
}

export function ProductsTableToolbar<TData>({
  table,
}: ProductsToolbarProps<TData>) {
  const navigate = useNavigate();
  const debounced = useDebounceCallback((value: string) => {
    table.setGlobalFilter(value);
    navigate({
      to: "/users",
      search: {
        name: value,
        page:
          table.getPageCount() > 0
            ? table.getState().pagination.pageIndex + 1
            : 1,
        perPage: table.getState().pagination.pageSize,
      },
    });
  }, 500);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          defaultValue={table.getState().globalFilter}
          placeholder="Search name"
          className="w-[250px]"
          onChange={(e) => debounced(e.target.value)}
        />
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

interface ProductsTableActionsProps {
  table: Table<User>;
  row: Row<User>;
}

export function ProductsTableActions({
  row,
  table,
}: ProductsTableActionsProps) {
  const product = row.original;
  const navigate = useNavigate();
  //   const queryClient = useQueryClient();
  const searchProduct = ProductsRoute.useSearch({
    select: (search) => search.product,
  });
  const [open, setOpen] = React.useState(() => product.id === searchProduct);
  const [hasOpenItem, setHasOpenItem] = React.useState(
    () => product.id === searchProduct,
  );
  const [editOpen, setEditOpen] = React.useState(
    () => product.id === searchProduct,
  );
  const dropdownMenuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const focusRef = React.useRef<HTMLButtonElement | null>(null);

  //   const { isPending, mutate } = useMutation({
  //     mutationKey: ["products", "edit", product.id],
  //     mutationFn: async (values: unknown) => {
  //       const res = api.put(`products/${product.id}`, { json: values });

  //       return updateProductResponseSchema.parse(await res.json());
  //     },
  //     onSuccess: () => {
  //       toast.success("Product updated successfully");
  //       queryClient.invalidateQueries({ queryKey: productsKeys.all });
  //     },
  //     onError: async (error) => {
  //       if (error instanceof HTTPError) {
  //         const data = await error.response.json();
  //         if (data.message) toast.error(data.message);
  //       } else {
  //         toast.error("Something went wrong while updating product");
  //       }
  //     },
  //   });

  //   const { mutate: mutateDeleteProduct } = useMutation({
  //     mutationKey: ["products", "delete", product.id],
  //     mutationFn: async () => {
  //       const res = await api.delete(`products/${product.id}`);

  //       return deleteProductResponseSchema.parse(await res.json());
  //     },
  //     onSuccess: () => {
  //       toast.success("Product deleted successfuly");
  //       queryClient.invalidateQueries({ queryKey: productsKeys.all });
  //     },
  //     onError: async (error) => {
  //       if (error instanceof HTTPError) {
  //         const data = await error.response.json();
  //         if (data.message) toast.error(data.message);
  //       } else {
  //         toast.error("Something went wrong while deleting product");
  //       }
  //     },
  //   });

  function handleItemSelect() {
    focusRef.current = dropdownMenuTriggerRef.current;
  }

  function handleItemOpenChange(open: boolean) {
    setHasOpenItem(open);

    if (open === false) setOpen(false);
  }

  function handleOpenEditProductDialog(open: boolean) {
    handleItemOpenChange(open);
    setEditOpen(open);
    navigate({
      to: "/users",
      search: {
        name: table.getState().globalFilter,
        page:
          table.getPageCount() > 0
            ? table.getState().pagination.pageIndex + 1
            : 1,
        perPage: table.getState().pagination.pageSize,
        ...(open ? { product: product.id } : {}),
      },
      replace: true,
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={dropdownMenuTriggerRef}
          variant="ghost"
          className="flex size-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
        hidden={hasOpenItem}
        onCloseAutoFocus={(event) => {
          if (focusRef.current) {
            focusRef.current?.focus();
            focusRef.current = null;
            event.preventDefault();
          }
        }}
      >
        <DropdownMenuDialogItem
          open={editOpen}
          triggerChildern={
            <>
              <PencilIcon className="mr-2 size-4" /> Edit
            </>
          }
          onSelect={handleItemSelect}
          onOpenChange={handleOpenEditProductDialog}
        >
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Edit product details here. Click save when you are done.
            </DialogDescription>
          </DialogHeader>
        </DropdownMenuDialogItem>

        <DropdownMenuAlertDialogItem
          triggerChildern={
            <>
              <Trash2Icon className="mr-2 size-4" /> Delete
            </>
          }
          onSelect={handleItemSelect}
          onOpenChange={handleItemOpenChange}
          className="text-red-500 focus:cursor-pointer focus:bg-destructive focus:text-white"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will delete product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive">Continue</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </DropdownMenuAlertDialogItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
