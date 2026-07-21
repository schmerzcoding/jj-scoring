import { CreateEventForm } from "@/components/create-event-form";

export default function AdminNewEventPage() {
  return <CreateEventForm manageBasePath="/admin/competitions" />;
}
