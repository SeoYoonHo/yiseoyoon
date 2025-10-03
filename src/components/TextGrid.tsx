interface TextPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
}

interface TextGridProps {
  readonly texts: TextPost[];
  readonly columns?: 2 | 3 | 4;
}

export default function TextGrid({ texts, columns = 3 }: TextGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-8`}>
      {texts.map((post) => (
        <article key={post.id} className="group cursor-pointer">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            {/* Featured Image */}
            <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-sm font-medium">{post.category}</p>
                <p className="text-xs mt-1">Featured Image</p>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-gray-500">{post.readTime}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{post.author}</span>
                <span>{new Date(post.date).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
