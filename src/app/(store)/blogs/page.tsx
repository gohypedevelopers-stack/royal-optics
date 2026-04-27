export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function BlogsPage() {
  const blogs = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="ro-title">Blogs</h1>
      <p className="mt-1 text-sm text-slate-600">Eyewear guides, lens knowledge and buying tips.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <article key={blog.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{blog.title}</h2>
            <p className="mt-2 line-clamp-4 text-sm text-slate-600">{blog.content}</p>
            <p className="mt-2 text-xs text-slate-500">By {blog.author}</p>
            <Link href={`/blogs/${blog.slug}`} className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline">
              Read more
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
