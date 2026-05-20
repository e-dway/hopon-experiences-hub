import { Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";

export function OwnerGate({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  if (!settings.owner) {
    return (
      <Card className="p-8 text-center max-w-xl">
        <h2 className="font-display text-2xl mb-2">Set an owner first</h2>
        <p className="text-muted-foreground text-sm mb-4">
          The Hop On Mobility API scopes most resources by an{" "}
          <code className="font-mono">owner</code> identifier. Add yours in settings to
          load data.
        </p>
        <Link
          to="/settings"
          className="inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Open settings
        </Link>
      </Card>
    );
  }
  return <>{children}</>;
}
