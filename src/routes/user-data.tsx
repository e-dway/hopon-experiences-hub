import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResourceManager } from "@/components/ResourceManager";
import { UserItinerary, Tags, Pois, Itineraries, Packages, Experiences } from "@/lib/api";

export const Route = createFileRoute("/user-data")({
  component: UserDataPage,
  head: () => ({
    meta: [
      { title: "User data — Manager" },
      { name: "description", content: "User itineraries, evaluations, visibility and preferences." },
    ],
  }),
});

function UserDataPage() {
  return (
    <AppLayout title="User data" subtitle="User itineraries, evaluations, visibility and tag preferences">
      <Tabs defaultValue="user-itineraries">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="user-itineraries">User itineraries</TabsTrigger>
          <TabsTrigger value="user-evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="user-pois">User POIs</TabsTrigger>
          <TabsTrigger value="poi-visibility">POI visibility</TabsTrigger>
          <TabsTrigger value="itinerary-visibility">Itinerary visibility</TabsTrigger>
          <TabsTrigger value="package-visibility">Package visibility</TabsTrigger>
          <TabsTrigger value="user-experiences">User experiences</TabsTrigger>
          <TabsTrigger value="tag-preferences">Tag preferences</TabsTrigger>
          <TabsTrigger value="tag-images">Tag images</TabsTrigger>
        </TabsList>
        <TabsContent value="user-itineraries" className="mt-4">
          <ResourceManager queryKey="ui-itins" client={UserItinerary.itineraries} />
        </TabsContent>
        <TabsContent value="user-evaluations" className="mt-4">
          <ResourceManager queryKey="ui-evals" client={UserItinerary.evaluations} />
        </TabsContent>
        <TabsContent value="user-pois" className="mt-4">
          <ResourceManager queryKey="ui-pois" client={UserItinerary.pois} />
        </TabsContent>
        <TabsContent value="poi-visibility" className="mt-4">
          <ResourceManager queryKey="poi-visibility" client={Pois.userVisible} />
        </TabsContent>
        <TabsContent value="itinerary-visibility" className="mt-4">
          <ResourceManager queryKey="itin-visibility" client={Itineraries.userVisibility} />
        </TabsContent>
        <TabsContent value="package-visibility" className="mt-4">
          <ResourceManager queryKey="pkg-visibility" client={Packages.userVisibility} />
        </TabsContent>
        <TabsContent value="user-experiences" className="mt-4">
          <ResourceManager queryKey="user-experiences" client={Experiences.userExperiences} />
        </TabsContent>
        <TabsContent value="tag-preferences" className="mt-4">
          <ResourceManager queryKey="tag-prefs" client={Tags.preferences} />
        </TabsContent>
        <TabsContent value="tag-images" className="mt-4">
          <ResourceManager queryKey="tag-images" client={Tags.images} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
