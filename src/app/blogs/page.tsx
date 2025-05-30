// File 1: app/blog/page.js
export default function BlogPage() {
  const posts = [
    {
      slug: 'first-post',
      title: "My First Blog Post",
      date: "2024-03-20",
      content: "<p>This is my first blog post content...</p>"
    },
    {
      slug: 'second-post',
      title: "Another Blog Post",
      date: "2024-03-21",
      content: "<p>More blog content here...</p>"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 min-h-svh">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <div className="space-y-8">
        {posts.map(post => (
          <article key={post.slug} className="border-b pb-6">
            <a href={`/blogs/${post.slug}`} className="block hover:bg-gray-50 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <time className="text-sm text-gray-500">
                {new Date(post.date).toLocaleDateString()}
              </time>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}