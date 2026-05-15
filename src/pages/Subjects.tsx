import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { subjectsService } from "@/services/subjectsService";
import { BookOpen } from "lucide-react";

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    subjectsService.list().then(setSubjects);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
          <BookOpen className="h-6 w-6 text-primary" /> Subject hubs
        </h1>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {subjects.map((s) => (
            <Link key={s.slug} to={`/subjects/${s.slug}`}>
              <Card className="bg-gradient-card border-border/60 p-5 shadow-card transition-base hover:border-primary/40 hover:shadow-glow">
                <div className="text-2xl">📚</div>
                <div className="mt-2 font-medium">{s.name}</div>
                {s.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
