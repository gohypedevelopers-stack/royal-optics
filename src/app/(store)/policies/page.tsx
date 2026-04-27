export const dynamic = "force-dynamic";
import { getPoliciesContent } from "@/lib/content";

export default async function PoliciesPage() {
  const content = await getPoliciesContent();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 text-slate-700 md:px-8">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">{content.title}</h1>
      </header>

      <div className="my-7 border-t border-slate-300" />

      <div className="space-y-12 text-base leading-8 md:text-[18px]">
        {content.sections.map((section, index) => (
          <div key={section.title}>
            <section>
              <h2 className="text-2xl font-bold text-blue-600 md:text-4xl">{section.title}</h2>
              {section.items.map((item) => (
                <div key={item.title} className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  {item.body && <p className="mt-1">{item.body}</p>}
                  {!!item.lines?.length && (
                    <div className="mt-1">
                      {item.lines.map((line, lineIndex) => (
                        <p key={`${item.title}-${lineIndex}`} className={lineIndex === 0 ? "font-semibold text-slate-900" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
            {index < content.sections.length - 1 && <div className="mt-8 border-t border-slate-300" />}
          </div>
        ))}
      </div>
    </section>
  );
}

