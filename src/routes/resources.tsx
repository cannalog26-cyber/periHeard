import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "PeriHeard Resources — Trusted menopause guidance" },
      {
        name: "description",
        content:
          "Trusted resources and guidance for perimenopause, including NICE NG23, the British Menopause Society and NHS information.",
      },
      { property: "og:title", content: "PeriHeard Resources" },
      {
        property: "og:description",
        content:
          "Trusted resources and guidance for perimenopause, including NICE NG23, the British Menopause Society and NHS information.",
      },
    ],
  }),
  component: Resources,
});

function Resources() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background-bottom">
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-5 py-12 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-foreground">
              Resources
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Trusted information and guidance to help you understand your symptoms and prepare for your GP appointment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://www.nice.org.uk/guidance/ng23"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/50 transition-colors"
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">NICE NG23</h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Menopause: identification and management — the clinical guideline that anchors every brief.
              </p>
            </a>

            <a
              href="https://thebms.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/50 transition-colors"
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">British Menopause Society</h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Specialist guidance, patient information and accredited menopause clinics.
              </p>
            </a>

            <a
              href="https://www.menopauseforall.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/50 transition-colors"
            >
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">NHS Menopause Support</h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                NHS-recognised advice on symptoms, treatment options and lifestyle support.
              </p>
            </a>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Your GP brief</h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Use the symptom checker on the home page to build a one-page summary for your appointment.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
