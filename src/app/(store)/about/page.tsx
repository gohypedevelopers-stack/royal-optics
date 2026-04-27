export const dynamic = "force-dynamic";
import { getSiteProfile } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function AboutPage() {
  const [profile, blogs] = await Promise.all([
    getSiteProfile(),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-slate-900">About {profile.name}</h1>
      <p className="mt-3 text-sm text-slate-700">{profile.legacyText}</p>
      <p className="mt-2 text-sm text-slate-700">{profile.address}</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Latest Blog Insights</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {blogs.map((blog) => (
            <article key={blog.id} className="rounded-xl border bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900">{blog.title}</h3>
              <p className="mt-2 line-clamp-4 text-sm text-slate-600">{blog.content}</p>
              <p className="mt-3 text-xs text-slate-500">By {blog.author}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}


