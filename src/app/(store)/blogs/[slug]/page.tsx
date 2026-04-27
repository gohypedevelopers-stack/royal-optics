export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const blog = await prisma.blogPost.findFirst({
    where: { slug: params.slug, status: "PUBLISHED" },
  });

  if (!blog) notFound();

  const related = await prisma.blogPost.findMany({
    where: { id: { not: blog.id }, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(blog.content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/blogs" className="text-sm font-semibold text-blue-700 hover:underline">
        Back to blogs
      </Link>
      <article className="mt-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{blog.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          By {blog.author} on {new Date(blog.createdAt).toLocaleDateString("en-IN")}
        </p>
        {looksLikeHtml ? (
          <div className="prose mt-5 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: blog.content }} />
        ) : (
          <div className="mt-5 whitespace-pre-line text-slate-700">{blog.content}</div>
        )}
      </article>

      {!!related.length && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">Related Posts</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.id} href={`/blogs/${item.slug}`} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.content}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
