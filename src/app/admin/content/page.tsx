export const dynamic = "force-dynamic";
import { upsertContentJsonAction, upsertSiteProfileAction } from "@/app/actions";
import {
  CMS_KEYS,
  defaultPoliciesContent,
  defaultPrivacyContent,
  defaultSiteProfile,
  defaultTermsContent,
} from "@/lib/content";
import { prisma } from "@/lib/prisma";

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function AdminContentPage() {
  const blocks = await prisma.contentBlock.findMany({
    where: { key: { in: [CMS_KEYS.siteProfile, CMS_KEYS.terms, CMS_KEYS.privacy, CMS_KEYS.policies] } },
  });

  const byKey = new Map(blocks.map((row) => [row.key, row.value]));

  const siteProfile = (byKey.get(CMS_KEYS.siteProfile) as any) || defaultSiteProfile;
  const terms = byKey.get(CMS_KEYS.terms) || defaultTermsContent;
  const privacy = byKey.get(CMS_KEYS.privacy) || defaultPrivacyContent;
  const policies = byKey.get(CMS_KEYS.policies) || defaultPoliciesContent;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-slate-900">Content Management</h1>
      <p className="text-sm text-slate-600">
        Manage major static website content from here. Storefront pages update as soon as changes are saved.
      </p>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Global Site Profile</h2>
        <form action={upsertSiteProfileAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="name" defaultValue={siteProfile.name || ""} placeholder="Brand Name" className="rounded-lg border px-3 py-2 text-sm" required />
          <input
            name="logoPath"
            defaultValue={siteProfile.logoPath || "/logo.jpeg"}
            placeholder="/logo.jpeg"
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <input name="phone" defaultValue={siteProfile.phone || ""} placeholder="Phone" className="rounded-lg border px-3 py-2 text-sm" required />
          <input
            name="supportPhone"
            defaultValue={siteProfile.supportPhone || ""}
            placeholder="Support Phone"
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <input
            name="email"
            type="email"
            defaultValue={siteProfile.email || ""}
            placeholder="Email"
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <input
            name="address"
            defaultValue={siteProfile.address || ""}
            placeholder="Address"
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <textarea
            name="legacyText"
            defaultValue={siteProfile.legacyText || ""}
            rows={3}
            placeholder="Legacy line"
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            required
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 md:col-span-2" type="submit">
            Save Site Profile
          </button>
        </form>
      </section>

      {[
        { title: "Terms and Conditions (JSON)", key: CMS_KEYS.terms, value: terms },
        { title: "Privacy Policy (JSON)", key: CMS_KEYS.privacy, value: privacy },
        { title: "Policies Page (JSON)", key: CMS_KEYS.policies, value: policies },
      ].map((item) => (
        <section key={item.key} className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
          <p className="mt-1 text-xs text-slate-500">Keep the JSON structure intact. Invalid JSON will not be saved.</p>
          <form action={upsertContentJsonAction} className="mt-4 space-y-3">
            <input type="hidden" name="key" value={item.key} />
            <textarea
              name="json"
              defaultValue={formatJson(item.value)}
              rows={20}
              className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
              required
            />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save {item.title}
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
