import { useEffect, useState } from 'react';

const BookLoadingAnimation = () => {
    const [visibleLines, setVisibleLines] = useState([]);
    const [isFlipping, setIsFlipping] = useState(false);
    const [currentPhrase, setCurrentPhrase] = useState(0);
    const [phraseOpacity, setPhraseOpacity] = useState(0);
    const totalLines = 10;

    const loadingPhrases = [
        "Loading strategic clarity modules...",
        "Optimizing AI foresight APIs...",
        "Installing generative research libraries..."
    ];

    useEffect(() => {
        // Animation for the writing lines appearing from top to bottom
        const linesInterval = setInterval(() => {
            setVisibleLines(prev => {
                // If all lines visible, reset to empty
                if (prev.length >= totalLines) {
                    return [];
                }
                // Add next line
                return [...prev, prev.length];
            });
        }, 400);

        // Animation for page flipping
        const flipInterval = setInterval(() => {
            setIsFlipping(true);
            setTimeout(() => setIsFlipping(false), 300);
        }, 3000);

        // Animation for cycling phrases
        let fadeDirection = true; // true = fade in, false = fade out
        const phraseFadeInterval = setInterval(() => {
            setPhraseOpacity(prev => {
                // Fading in
                if (fadeDirection && prev < 1) {
                    return prev + 0.1;
                }
                // Fully faded in, start fading out
                else if (fadeDirection && prev >= 1) {
                    fadeDirection = false;
                    return 1;
                }
                // Fading out
                else if (!fadeDirection && prev > 0) {
                    return prev - 0.1;
                }
                // Fully faded out, change phrase and start fading in
                else {
                    fadeDirection = true;
                    setCurrentPhrase(prev => (prev + 1) % loadingPhrases.length);
                    return 0;
                }
            });
        }, 100);

        return () => {
            clearInterval(linesInterval);
            clearInterval(flipInterval);
            clearInterval(phraseFadeInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-amber-50">
            <div className="relative w-64 h-80">
                {/* Book cover */}
                <div className="absolute w-full h-full bg-amber-800 rounded shadow-lg flex items-center justify-center">
                    <div className="text-amber-100 text-lg font-serif">Generating Content</div>
                </div>

                {/* Pages */}
                <div className="absolute w-full h-full">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="absolute w-full h-full bg-white rounded shadow-sm"
                            style={{
                                transform: `translateX(${index * 2}px)`,
                                zIndex: 5 - index
                            }}
                        >
                            {/* Empty page */}
                        </div>
                    ))}
                </div>

                {/* Active page with appearing lines */}
                <div
                    className={`absolute w-full h-full bg-white rounded shadow transition-transform duration-300 origin-left transform ${isFlipping ? 'rotate-y-180' : ''
                        }`}
                    style={{
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        zIndex: 10
                    }}
                >
                    <div className="p-6">
                        {Array.from({ length: totalLines }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 bg-amber-200 rounded mb-3 transition-all duration-300 ease-out ${visibleLines.includes(i) ? 'opacity-100' : 'opacity-0'
                                    }`}
                                style={{
                                    width: `${70 + (i % 3) * 10}%`,
                                    transform: `translateY(${visibleLines.includes(i) ? '0' : '-10px'})`,
                                    transitionDelay: `${i * 50}ms`
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Loading text with cycling phrases */}
            <div
                className="mt-8 text-amber-900 font-serif h-6 text-center"
                style={{
                    opacity: phraseOpacity,
                    transition: 'opacity 0.3s ease-in-out',
                    minWidth: '300px'
                }}
            >
                {loadingPhrases[currentPhrase]}
            </div>
        </div>
    );
};

export default BookLoadingAnimation; 