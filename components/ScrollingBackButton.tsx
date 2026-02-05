import React, { useEffect, useState } from 'react';

interface ScrollingBackButtonProps {
  onBack: () => void;
  showHomeButton?: boolean;
}

const ScrollingBackButton: React.FC<ScrollingBackButtonProps> = ({ 
  onBack, 
  showHomeButton = true 
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolling(true);
          ticking = false;

          // Clear previous timeout
          if (scrollTimeout) {
            clearTimeout(scrollTimeout);
          }

          // Hide button 1.5 seconds after scroll stops
          const timeout = setTimeout(() => {
            setIsScrolling(false);
          }, 1500);

          setScrollTimeout(timeout);
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  return (
    <>
      {/* Scrolling Back Button - appears on scroll */}
      <div
        className={`fixed bottom-6 left-6 z-40 transition-all duration-300 ${
          isScrolling
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
          title="Go back"
          aria-label="Go back"
        >
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </button>
      </div>

      {/* Home Button - always visible (original) */}
      {showHomeButton && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-12 h-12 bg-white border-2 border-emerald-500 text-emerald-600 rounded-full shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
            title="Go home"
            aria-label="Go home"
          >
            <i className="fa-solid fa-home text-lg"></i>
          </button>
        </div>
      )}
    </>
  );
};

export default ScrollingBackButton;
