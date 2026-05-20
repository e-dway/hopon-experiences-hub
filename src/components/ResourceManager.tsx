import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react";

export interface ResourceClient<T> {
  list: (params?: Record<string, unknown>) => Promise<T[]>;
  create?: (body: never) => Promise<unknown>;
  update?: (id: never, body: never) => Promise<unknown>;
  remove?: (id: never) => Promise<unknown>;
}

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  key?: string;
}

interface Props<T extends { id?: number | string }> {
  queryKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ResourceClient<any>;
  columns?: Array<Column<T>>;
  defaultBody?: string;
  listParams?: Record<string, unknown>;
  emptyText?: string;
}

export function ResourceManager<T extends { id?: number | string; [k: string]: unknown }>({
  queryKey,
  client,
  columns,
  defaultBody = "{\n  \n}",
  listParams,
  emptyText = "No items yet.",
}: Props<T>) {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [queryKey, listParams],
    queryFn: () => client.list(listParams),
  });

  const [editing, setEditing] = useState<{ id?: number | string; body: string } | null>(null);
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: number | string; body: string }) => {
      const parsed = JSON.parse(body);
      if (id != null && c.update) return c.update(id, parsed);
      if (c.create) return c.create(parsed);
      throw new Error("No create/update available");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number | string) =>
      c.remove ? c.remove(id) : Promise.reject(new Error("Delete not supported")),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  const cols = columns ?? [
    { header: "ID", render: (r: T) => String(r.id ?? "—") },
    {
      header: "Preview",
      render: (r: T) => (
        <code className="text-xs text-muted-foreground line-clamp-1">
          {JSON.stringify(r).slice(0, 120)}
        </code>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
        {client.create && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => setEditing({ body: defaultBody })}
                className="bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="size-4 mr-1" /> New
              </Button>
            </DialogTrigger>
            {editing && (
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">
                    {editing.id != null ? `Edit #${editing.id}` : "New item"}
                  </DialogTitle>
                </DialogHeader>
                <Textarea
                  className="font-mono text-xs min-h-[320px]"
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                />
                {save.isError && (
                  <p className="text-sm text-destructive">{(save.error as Error).message}</p>
                )}
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => save.mutate(editing)}
                    disabled={save.isPending}
                  >
                    {save.isPending ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">{emptyText}</Card>
      )}
      {(data?.length ?? 0) > 0 && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {cols.map((c, i) => <TableHead key={c.key ?? i}>{c.header}</TableHead>)}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((row, i) => (
                <TableRow key={(row.id as string | number | undefined) ?? i}>
                  {cols.map((c, ci) => <TableCell key={c.key ?? ci}>{c.render(row)}</TableCell>)}
                  <TableCell className="text-right space-x-1">
                    {client.update && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing({ id: row.id, body: JSON.stringify(row, null, 2) });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {client.remove && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (row.id != null && confirm(`Delete #${row.id}?`)) {
                            remove.mutate(row.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
