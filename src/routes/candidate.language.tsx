import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { Languages } from "lucide-react";

export const Route = createFileRoute("/candidate/language")({
  component: LanguagePage,
});

const OPTIONS = [
  { code: "Kannada", native: "ಕನ್ನಡ" },
  { code: "Hindi", native: "हिन्दी" },
  { code: "English", native: "English" },
];

function LanguagePage() {
  const { setLanguage } = useApp();
  const navigate = useNavigate();

  const choose = (lang: string) => {
    setLanguage(lang);
    navigate({ to: "/candidate/instructions" });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Languages className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Choose your language</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Interview will be conducted in your chosen language
          </p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map((opt) => (
            <Card
              key={opt.code}
              className="cursor-pointer p-4 transition hover:border-primary hover:shadow-md"
              onClick={() => choose(opt.code)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{opt.native}</p>
                  <p className="text-xs text-muted-foreground">{opt.code}</p>
                </div>
                <Button size="sm">Select</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
