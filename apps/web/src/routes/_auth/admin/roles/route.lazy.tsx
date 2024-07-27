import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRoleResponseSchema,
  createRoleSchema,
  deleteRoleResponseSchema,
  getPaginatedRolesResponseSchema,
  updateRoleResponseSchema,
  updateRoleSchema,
} from "@roles-permissions/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
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
import { roleKeys, roleQuries } from "~/common/keys/roles";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { DataTableColumnHeader } from "~/components/ui/data-table/data-table-column-header";
import { DataTablePagination } from "~/components/ui/data-table/data-table-pagination";
import { DataTableViewOptions } from "~/components/ui/data-table/data-table-view-options";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuAlertDialogItem,
  DropdownMenuContent,
  DropdownMenuDialogItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UiTable,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/utils/api-client";
import { format } from "date-fns";
import { HTTPError } from "ky";
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";
import { z, ZodError } from "zod";

export const Route = createLazyFileRoute("/_auth/admin/roles")({
  component: RolePage,
});

function RolePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Roles</h3>
          <p className="text-sm text-muted-foreground">Manage your roles </p>
        </div>
        <CreateRoleDialog />
      </div>
      <Separator />
      <RolesTable />
    </>
  );
}

const rolesSchema = getPaginatedRolesResponseSchema.shape.data.pick({
  roles: true,
}).shape.roles;

type Role = z.infer<typeof rolesSchema>[number];

interface RoleFormProps {
  role?: Role;
  schema: z.AnyZodObject;
  isPending: boolean;
  onSubmit: (values: unknown) => void;
}

function RoleForm({ role, schema, isPending, onSubmit }: RoleFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          className="space-y-4"
          disabled={isPending}
          aria-disabled={isPending}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                aria-disabled={isPending}
              >
                Close
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              aria-disabled={isPending}
            >
              {isPending && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Form>
  );
}

function CreateRoleDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const { isPending, mutate } = useMutation({
    mutationKey: ["roles", "add"],
    mutationFn: async (values: Role) => {
      const res = await api.post("roles", { json: values });

      return createRoleResponseSchema.parse(await res.json());
    },
    onSuccess: () => {
      toast.success("Role added successfully");
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while addding role");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Role</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
          <DialogDescription>
            Add role details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <RoleForm
          schema={createRoleSchema}
          isPending={isPending}
          onSubmit={(values) =>
            mutate(values, {
              onSuccess: () => {
                setOpen(false);
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
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
    cell: ({ row, table }) => <RolesTableActions row={row} table={table} />,
  },
];

export function RolesTable() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch({
    select: (search) => search,
  });

  const { data } = useQuery(roleQuries.list(searchParams));
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
      to: "/admin/roles",
      search: {
        name: globalFilter,
        page: newPagination.pageIndex + 1,
        perPage: newPagination.pageSize,
      },
      replace: true,
    });
  }

  const table = useReactTable({
    data: data?.data.roles ?? [],
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
    <div className="space-y-4">
      <RolesTableToolbar table={table} />
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
                  No Roles.
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

interface RolesToolbarProps<TData> {
  table: Table<TData>;
}

export function RolesTableToolbar<TData>({ table }: RolesToolbarProps<TData>) {
  const navigate = useNavigate();
  const debounced = useDebounceCallback((value: string) => {
    table.setGlobalFilter(value);
    navigate({
      to: "/admin/roles",
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

interface RolesActionsProps {
  table: Table<Role>;
  row: Row<Role>;
}

export function RolesTableActions({ row }: RolesActionsProps) {
  const role = row.original;
  const queryClient = useQueryClient();

  const [open, setOpen] = React.useState(false);
  const [hasOpenItem, setHasOpenItem] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const dropdownMenuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const focusRef = React.useRef<HTMLButtonElement | null>(null);

  const { isPending, mutate } = useMutation({
    mutationKey: ["roles", "edit", role.id],
    mutationFn: async (values: unknown) => {
      const res = await api.put(`roles/${role.id}`, { json: values });
      const json = await res.json();

      return json;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while updating role");
      }
    },
  });

  const { mutate: mutateDeleteRole } = useMutation({
    mutationKey: ["roles", "delete", role.id],
    mutationFn: async () => {
      const res = await api.delete(`roles/${role.id}`);

      return deleteRoleResponseSchema.parse(await res.json());
    },
    onSuccess: () => {
      toast.success("Role deleted successfuly");
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
    onError: async (error) => {
      if (error instanceof HTTPError) {
        const data = await error.response.json();
        if (data.message) toast.error(data.message);
      } else {
        toast.error("Something went wrong while deleting role");
      }
    },
  });

  function handleItemSelect() {
    focusRef.current = dropdownMenuTriggerRef.current;
  }

  function handleItemOpenChange(open: boolean) {
    setHasOpenItem(open);

    if (open === false) setOpen(false);
  }

  function handleOpenEditRoleDialog(open: boolean) {
    handleItemOpenChange(open);
    setEditOpen(open);
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
          onOpenChange={handleOpenEditRoleDialog}
        >
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Edit role details here. Click save when you are done.
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            isPending={isPending}
            schema={updateRoleSchema}
            role={role}
            onSubmit={(values) =>
              mutate(values, {
                onSuccess: () => {
                  handleOpenEditRoleDialog(false);
                },
              })
            }
          />
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
              <Button variant="destructive" onClick={() => mutateDeleteRole()}>
                Continue
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </DropdownMenuAlertDialogItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
