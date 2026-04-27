export const dynamic = "force-dynamic";
import { getTermsContent } from "@/lib/content";

export default async function TermsPage() {
  const content = await getTermsContent();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 text-slate-700 md:px-8">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">{content.title}</h1>
        <p className="mt-4 text-base text-slate-500 md:text-xl">Last updated: {content.lastUpdated}</p>
      </header>

      <div className="my-7 border-t border-slate-300" />

      <div className="space-y-10 text-base leading-8 md:text-[18px]">
        {content.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl font-bold text-blue-600 md:text-4xl">{section.title}</h2>
            {section.intro && <p className="mt-4">{section.intro}</p>}
            {!!section.bullets?.length && (
              <ul className="mt-4 list-disc space-y-3 pl-8">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {!!section.paragraphs?.length &&
              section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4">
                  {paragraph}
                </p>
              ))}
          </section>
        ))}
      </div>
    </section>
  );
}

