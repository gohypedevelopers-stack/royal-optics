export const dynamic = "force-dynamic";
import { getPrivacyContent } from "@/lib/content";

export default async function PrivacyPolicyPage() {
  const content = await getPrivacyContent();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 text-slate-700 md:px-8">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">{content.title}</h1>
        <p className="mt-4 text-base text-slate-500 md:text-xl">Last updated: {content.lastUpdated}</p>
      </header>

      <div className="my-7 border-t border-slate-300" />

      <div className="space-y-8 text-base leading-8 md:text-[18px]">
        <p>{content.intro}</p>

        {content.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl font-bold text-blue-600 md:text-4xl">{section.title}</h2>
            <p className="mt-3">{section.body}</p>
          </section>
        ))}

        <section>
          <h2 className="text-2xl font-bold text-blue-600 md:text-4xl">Contact Us</h2>
          <p className="mt-3">{content.contactLabel}</p>
          <p className="mt-3">
            <strong>Email:</strong>{" "}
            <a className="text-blue-600 underline" href={`mailto:${content.email}`}>
              {content.email}
            </a>
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            <a className="text-blue-600 underline" href={`tel:${content.phone.replace(/\s/g, "")}`}>
              {content.phone}
            </a>
          </p>
        </section>
      </div>
    </section>
  );
}

