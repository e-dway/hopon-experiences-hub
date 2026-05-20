import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/lib/settings";
import { Bookings } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
  head: () => ({
    meta: [
      { title: "Bookings — Manager" },
      { name: "description", content: "View bookings and reservations for your client account." },
    ],
  }),
});

function BookingsPage() {
  const { settings } = useSettings();
  const client = settings.client;
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", client],
    queryFn: () => Bookings.forClient(client),
    enabled: !!client,
  });

  return (
    <AppLayout title="Bookings" subtitle={client ? `Client: ${client}` : "Reservations from the tableau API"}>
      {!client && (
        <Card className="p-8 text-center max-w-xl">
          <h2 className="font-display text-2xl mb-2">Set a client first</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Bookings are scoped by a <code className="font-mono">client</code> identifier.
            Add yours in settings.
          </p>
          <Link to="/settings"
            className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90">
            Open settings
          </Link>
        </Card>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}
      {data && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No bookings.
                  </TableCell>
                </TableRow>
              )}
              {data.map((b, i) => (
                <TableRow key={`${b.id}-${i}`}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell className="font-mono text-xs">{b.start}</TableCell>
                  <TableCell className="font-mono text-xs">{b.end}</TableCell>
                  <TableCell className="text-right text-xs font-mono text-muted-foreground">{b.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppLayout>
  );
}
