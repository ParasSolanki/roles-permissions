import { paginatedUsersResponseSchema } from "@roles-permissions/schema";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  Table,
  VisibilityState,
} from "@tanstack/react-table";
import { roleQuries } from "~/common/keys/roles";
import { usersQuries } from "~/common/keys/users";
import { Can } from "~/components/can";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/ui/data-table/data-table-column-header";
import { DataTableFacetedFilter } from "~/components/ui/data-table/data-table-faceted-filter";
import { DataTablePagination } from "~/components/ui/data-table/data-table-pagination";
import { DataTableViewOptions } from "~/components/ui/data-table/data-table-view-options";
import {
  DropdownMenu,
  DropdownMenuAlertDialogItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DebouncedInput } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UiTable,
} from "~/components/ui/table";
import { authState, usePermissions } from "~/hooks/use-auth";
import { format } from "date-fns";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { z } from "zod";

export const Route = createLazyFileRoute("/_auth/admin/users/")({
  component: UsersPage,
});

function UsersPage() {
  return (
    <>
      <div>
        <h3 className="text-lg font-medium">Users</h3>
        <p className="text-sm text-muted-foreground">Manage your users </p>
      </div>
      <Separator />
      <UsersTable />
    </>
  );
}

const usersSchema = paginatedUsersResponseSchema.shape.data.pick({
  users: true,
}).shape.users;

type User = z.infer<typeof usersSchema>[number];

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const myUser = row.original.id === authState.user?.id;

      return (
        <span>
          {row.original.displayName}
          {myUser && (
            <Badge variant="secondary" className="ml-1">
              You
            </Badge>
          )}
        </span>
      );
    },
  },
  {
    id: "roleName",
    accessorFn: ({ role }) => role.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => <span>{format(row.original.createdAt, "PPP")}</span>,
  },
];

export function UsersTable() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch({
    select: (search) => search,
  });
  const { hasPermissions } = usePermissions();
  const { data } = useQuery(usersQuries.list(searchParams));

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const pageCount = data?.data.pagination.total ?? 0;
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
      to: "/admin/users",
      search: {
        name: "",
        page: newPagination.pageIndex + 1,
        perPage: newPagination.pageSize,
      },
      replace: true,
    });
  }

  const tableColumns = React.useMemo(() => {
    const canManageActions = hasPermissions(["users:edit", "users:delete"]);

    if (canManageActions) {
      return columns.concat([
        {
          id: "actions",
          header: () => (
            <div className="flex h-8 items-center font-medium">Actions</div>
          ),
          cell: ({ row, table }) => (
            <UsersTableActions row={row} table={table} />
          ),
        },
      ]);
    }
    return columns;
  }, [hasPermissions]);

  const table = useReactTable({
    data: data?.data.users ?? [],
    columns: tableColumns,
    state: {
      sorting,
      pagination,
      columnVisibility,
      columnFilters,
    },
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handleSetPagination,
    onColumnFiltersChange: setColumnFilters,
    manualPagination: true,
    manualFiltering: true,
  });

  React.useEffect(() => {
    const name = columnFilters.find((filter) => filter.id === "displayName");
    const role = columnFilters.find((filter) => filter.id === "roleName");

    navigate({
      to: "/admin/users",
      search: {
        name: name?.value as string,
        role: Array.isArray(role?.value) ? role.value.join(",") : undefined,
        page:
          table.getPageCount() > 0
            ? table.getState().pagination.pageIndex + 1
            : 1,
        perPage: table.getState().pagination.pageSize,
      },
    });
  }, [columnFilters]);

  return (
    <div className="space-y-4">
      <UsersTableToolbar table={table} />
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
                  No Users.
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

interface UsersToolbarProps<TData> {
  table: Table<TData>;
}

export function UsersTableToolbar<TData>({ table }: UsersToolbarProps<TData>) {
  const { data } = useQuery(roleQuries.all());

  const roleOptions = React.useMemo(() => {
    if (!data) return [];

    return data.data.roles.map((r) => ({ value: r.name, label: r.name }));
  }, [data]);

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <DebouncedInput
          defaultValue={
            (table.getColumn("displayName")?.getFilterValue() as string) ?? ""
          }
          placeholder="Search name"
          className="w-[250px]"
          onUpdate={(value) =>
            table.getColumn("displayName")?.setFilterValue(value)
          }
        />
        {table.getColumn("roleName") && (
          <DataTableFacetedFilter
            column={table.getColumn("roleName")}
            title="Role"
            options={roleOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="px-2 lg:px-3"
          >
            Reset
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}

interface UsersActionsProps {
  table: Table<User>;
  row: Row<User>;
}

export function UsersTableActions({ row }: UsersActionsProps) {
  const user = row.original;
  //   const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [hasOpenItem, setHasOpenItem] = React.useState(false);
  const dropdownMenuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const focusRef = React.useRef<HTMLButtonElement | null>(null);

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
        <Can permission="users:edit">
          <DropdownMenuItem asChild>
            <Link to="/admin/users/$userId" params={{ userId: user.id }}>
              <PencilIcon className="mr-2 size-4" aria-hidden="true" /> Edit
            </Link>
          </DropdownMenuItem>
        </Can>

        <Can permission="users:delete">
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
                This action cannot be undone. This will delete user.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive">Continue</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </DropdownMenuAlertDialogItem>
        </Can>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
