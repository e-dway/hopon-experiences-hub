import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResourceManager } from "@/components/ResourceManager";
import { Incoming } from "@/lib/api";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/incoming")({
  component: IncomingPage,
  head: () => ({
    meta: [
      { title: "Incoming integrations — Manager" },
      { name: "description", content: "Webhook URLs, mappings and resources for Regiondo and Bokun." },
    ],
  }),
});

function IncomingPage() {
  const { settings, save } = useSettings();
  const client = settings.client || settings.owner || "";
  return (
    <AppLayout title="Incoming integrations" subtitle="Regiondo & Bokun webhooks, mappings and resources">
      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks">Webhook URLs</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="mt-4 space-y-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label htmlFor="client">Client identifier</Label>
              <Input
                id="client"
                value={settings.client}
                onChange={(e) => save({ client: e.target.value })}
                placeholder="e.g. acme"
              />
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Regiondo</div>
                <code className="text-xs break-all">
                  {client ? Incoming.regiondoWebhookUrl(client) : "Set a client to see the URL"}
                </code>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Bokun</div>
                <code className="text-xs break-all">
                  {client ? Incoming.bokunWebhookUrl(client) : "Set a client to see the URL"}
                </code>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="mt-4">
          <ResourceManager queryKey="incoming-mappings" client={Incoming.mappings} />
        </TabsContent>
        <TabsContent value="resources" className="mt-4">
          <ResourceManager queryKey="incoming-resources" client={Incoming.resources} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
