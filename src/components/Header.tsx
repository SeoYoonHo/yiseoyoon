interface HeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
}

export default function Header({ title, subtitle, description }: HeaderProps) {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md">
            {subtitle}
          </p>
        )}
        {description && (
          <p className="text-lg text-white/80 max-w-2xl mx-auto drop-shadow-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
