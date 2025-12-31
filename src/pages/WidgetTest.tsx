import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export default function WidgetTest() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug') || 'demo';
  const buttonColor = searchParams.get('color') || '#E07A5F';
  const buttonPosition = searchParams.get('position') || 'bottom-right';
  const buttonText = searchParams.get('text') || 'Order Now';

  useEffect(() => {
    // Remove any existing widget scripts and elements
    const existingScript = document.querySelector('script[data-restaurant-slug]');
    if (existingScript) existingScript.remove();
    
    const existingButton = document.querySelector('.tf-widget-button');
    if (existingButton) existingButton.remove();
    
    const existingOverlay = document.querySelector('.tf-widget-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const existingModal = document.querySelector('.tf-widget-modal');
    if (existingModal) existingModal.remove();
    
    const existingStyles = document.querySelector('style[data-tf-widget]');
    if (existingStyles) existingStyles.remove();

    // Create and inject the widget script
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.setAttribute('data-restaurant-slug', slug);
    script.setAttribute('data-button-color', buttonColor);
    script.setAttribute('data-button-position', buttonPosition);
    script.setAttribute('data-button-text', buttonText);
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      script.remove();
      document.querySelector('.tf-widget-button')?.remove();
      document.querySelector('.tf-widget-overlay')?.remove();
      document.querySelector('.tf-widget-modal')?.remove();
    };
  }, [slug, buttonColor, buttonPosition, buttonText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Simulated website header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg" />
            <span className="font-semibold text-slate-800">Your Restaurant Website</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-900">Home</a>
            <a href="#" className="hover:text-slate-900">About</a>
            <a href="#" className="hover:text-slate-900">Menu</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </nav>
        </div>
      </header>

      {/* Simulated website content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Welcome to Our Restaurant
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Experience the finest dining with our carefully crafted menu. 
            Use the floating button in the corner to place your order!
          </p>
        </div>

        {/* Test info card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Widget Test Mode</h2>
          </div>
          <p className="text-slate-600 mb-4">
            This page simulates how the TableFlow ordering widget will appear on your website.
            Look for the floating <strong>"{buttonText}"</strong> button in the {buttonPosition.replace('-', ' ')} corner.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="font-medium">Restaurant:</span>
                <span className="font-mono text-primary">{slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Button Color:</span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: buttonColor }} />
                  {buttonColor}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Position:</span>
                <span>{buttonPosition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-full h-32 bg-slate-100 rounded-lg mb-4" />
              <div className="h-4 bg-slate-100 rounded mb-2 w-3/4" />
              <div className="h-3 bg-slate-50 rounded w-full" />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">
          <p>This is a test page to preview your TableFlow widget integration.</p>
          <p className="mt-2">
            <a href="/dashboard" className="text-primary hover:underline">← Back to Dashboard</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
