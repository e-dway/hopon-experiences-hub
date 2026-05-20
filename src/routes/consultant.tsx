import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResourceManager } from "@/components/ResourceManager";
import { Consultant } from "@/lib/api";

export const Route = createFileRoute("/consultant")({
  component: ConsultantPage,
  head: () => ({
    meta: [
      { title: "Consultant — Manager" },
      { name: "description", content: "Manage consultant personas, sessions, messages and artifacts." },
    ],
  }),
});

function ConsultantPage() {
  return (
    <AppLayout title="Consultant" subtitle="Personas, sessions, messages and artifacts">
      <Tabs defaultValue="personas">
        <TabsList>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        </TabsList>
        <TabsContent value="personas" className="mt-4">
          <ResourceManager queryKey="consultant-personas" client={Consultant.manage.personas} />
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <ResourceManager queryKey="consultant-sessions" client={Consultant.manage.sessions} />
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <ResourceManager queryKey="consultant-messages" client={Consultant.manage.messages} />
        </TabsContent>
        <TabsContent value="artifacts" className="mt-4">
          <ResourceManager queryKey="consultant-artifacts" client={Consultant.manage.artifacts} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
