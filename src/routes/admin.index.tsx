import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_CANDIDATES } from "@/lib/store";
import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const classColor: Record<string, string> = {
  "Job-ready": "bg-emerald-100 text-emerald-700",
  "Requires training": "bg-amber-100 text-amber-700",
  "Low confidence": "bg-orange-100 text-orange-700",
  "Fraud suspected": "bg-red-100 text-red-700",
};

function AdminDashboard() {
  const [lang, setLang] = useState("all");
  const [cat, setCat] = useState("all");

  const filtered = useMemo(() => {
    return MOCK_CANDIDATES.filter(
      (c) => (lang === "all" || c.language === lang) && (cat === "all" || c.category === cat)
    );
  }, [lang, cat]);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Review all candidates</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-md">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Kannada">Kannada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 sm:hidden">
          {filtered.map((c) => (
            <Link key={c.id} to="/admin/$id" params={{ id: c.id }}>
              <Card className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.id} • {c.language}</p>
                  </div>
                  <span className="text-2xl font-bold">{c.score}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={classColor[c.classification]}>{c.classification}</Badge>
                  {c.flags.map((f) => (
                    <Badge key={f} variant="destructive" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />{f}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <Card className="hidden overflow-hidden sm:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Language</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Classification</th>
                <th className="p-3 text-left">Flags</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.id}</p>
                  </td>
                  <td className="p-3">{c.language}</td>
                  <td className="p-3 font-semibold">{c.score}</td>
                  <td className="p-3">
                    <Badge className={classColor[c.classification]}>{c.classification}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.flags.map((f) => (
                        <Badge key={f} variant="destructive" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link to="/admin/$id" params={{ id: c.id }}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {filtered.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">No candidates match filters.</p>
        )}
      </div>
    </div>
  );
}
