import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResourceManager } from "@/components/ResourceManager";
import { Utils, type IconAsset } from "@/lib/api";

export const Route = createFileRoute("/utils")({
  component: UtilsPage,
  head: () => ({
    meta: [
      { title: "Map assets — Manager" },
      { name: "description", content: "Manage icons, markers and intro pictures used across the apps." },
    ],
  }),
});

function UtilsPage() {
  return (
    <AppLayout title="Map assets" subtitle="Icons, markers and intro pictures">
      <Tabs defaultValue="icons">
        <TabsList>
          <TabsTrigger value="icons">Icons</TabsTrigger>
          <TabsTrigger value="markers">Markers</TabsTrigger>
          <TabsTrigger value="intropics">Intro pictures</TabsTrigger>
        </TabsList>
        <TabsContent value="icons" className="mt-4">
          <ResourceManager<IconAsset>
            queryKey="utils-icons"
            client={Utils.icons}
            columns={[
              { header: "ID", render: (r) => String(r.id ?? "—") },
              { header: "Name", render: (r) => r.name ?? "—" },
              {
                header: "URL",
                render: (r) =>
                  r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="underline text-xs">
                      {r.url}
                    </a>
                  ) : "—",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="markers" className="mt-4">
          <ResourceManager<IconAsset>
            queryKey="utils-markers"
            client={Utils.markersCrud}
            columns={[
              { header: "ID", render: (r) => String(r.id ?? "—") },
              { header: "Name", render: (r) => r.name ?? "—" },
              {
                header: "URL",
                render: (r) =>
                  r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="underline text-xs">
                      {r.url}
                    </a>
                  ) : "—",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="intropics" className="mt-4">
          <ResourceManager<IconAsset>
            queryKey="utils-intropics"
            client={Utils.intropicsCrud}
            columns={[
              { header: "ID", render: (r) => String(r.id ?? "—") },
              { header: "Name", render: (r) => r.name ?? "—" },
              {
                header: "URL",
                render: (r) =>
                  r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="underline text-xs">
                      {r.url}
                    </a>
                  ) : "—",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
