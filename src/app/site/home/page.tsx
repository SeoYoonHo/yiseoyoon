// Home page is now background only

export default function HomePage() {
  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>

      {/* Main Content - Empty for background only */}
      <div className="flex-1"></div>

      {/* Footer Space */}
      <div className="h-8"></div>
    </main>
  );
}
