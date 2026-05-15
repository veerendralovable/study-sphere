import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subjectsService } from "@/services/subjectsService";
import { roomService } from "@/services/roomService";
import { ArrowLeft } from "lucide-react";

export default function SubjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [subject, setSubject] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    subjectsService.get(slug).then(setSubject);
    roomService.listAll().then((all) => {
      setRooms(
        all.filter((r: any) => r.subject === slug || (r.tags ?? []).includes(slug))
      );
    });
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <Link to="/subjects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All subjects
        </Link>
        <h1 className="mb-2 text-2xl font-semibold">{subject?.name ?? slug}</h1>
        {subject?.description && (
          <p className="mb-6 text-sm text-muted-foreground">{subject.description}</p>
        )}
        <h2 className="mb-3 text-sm uppercase tracking-wide text-muted-foreground">Rooms in this subject</h2>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms yet for this subject. Be the first to create one!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <Card key={r.id} className="bg-gradient-card border-border/60 p-4 shadow-card">
                <div className="font-medium">{r.name}</div>
                <div className="mt-2">
                  <Link to={`/room/${r.id}`}>
                    <Button size="sm" variant="hero">Open</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
