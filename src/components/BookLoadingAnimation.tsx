"use client";

import { useEffect, useState } from 'react';

const BookLoadingAnimation = () => {
    const [visibleLines, setVisibleLines] = useState<number[]>([]);
    const [isFlipping, setIsFlipping] = useState(false);
    const [currentPhrase, setCurrentPhrase] = useState(0);
    const [phraseOpacity, setPhraseOpacity] = useState(1); // Start fully visible
    const totalLines = 10;

    const loadingPhrases = [
        "30. Loading strategic clarity modules...",
        "29. Optimizing AI foresight APIs...",
        "28. Installing generative research libraries...",
        "27. Calibrating neural pathways...",
        "26. Initializing quantum prediction engines...",
        "25. Synchronizing distributed knowledge bases...",
        "24. Deploying adaptive learning protocols...",
        "23. Activating contextual reasoning systems...",
        "22. Connecting to insight acceleration network...",
        "21. Establishing creative pattern recognition...",
        "20. Bootstrapping cognitive enhancement modules...",
        "19. Rendering decision matrix frameworks...",
        "18. Allocating deep learning resources...",
        "17. Expanding semantic analysis capabilities...",
        "16. Harmonizing multilayered inference engines...",
        "15. Preparing augmented intelligence protocols...",
        "14. Integrating strategic foresight algorithms...",
        "13. Mapping innovation potential pathways...",
        "12. Assembling thought acceleration structures...",
        "11. Calibrating breakthrough probability metrics...",
        "10. Initializing disruptive ideation processes...",
        "9. Constructing insight visualization networks...",
        "8. Launching conceptual expansion routines...",
        "7. Optimizing lateral thinking parameters...",
        "6. Compiling wisdom extraction databases...",
        "5. Enhancing predictive analytics capabilities...",
        "4. Integrating advanced pattern recognition systems...",
        "3. Deploying advanced decision-making frameworks...",
        "2. Establishing advanced learning algorithms...",
        "1. Optimizing advanced inference engines...",
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

        // Animation for cycling phrases - improved for continuous transitions
        let isFadingOut = true;
        const phraseFadeInterval = setInterval(() => {
            setPhraseOpacity(prev => {
                // Fading out
                if (isFadingOut) {
                    const newOpacity = prev - 0.05;
                    if (newOpacity <= 0) {
                        isFadingOut = false;
                        // Change to next phrase immediately when fully faded out
                        setCurrentPhrase(current => (current + 1) % loadingPhrases.length);
                        return 0;
                    }
                    return newOpacity;
                }
                // Fading in
                else {
                    const newOpacity = prev + 0.05;
                    if (newOpacity >= 1) {
                        isFadingOut = true;
                        // Hold at full opacity for a moment before fading out
                        setTimeout(() => { }, 800);
                        return 1;
                    }
                    return newOpacity;
                }
            });
        }, 50); // Faster interval for smoother transitions

        return () => {
            clearInterval(linesInterval);
            clearInterval(flipInterval);
            clearInterval(phraseFadeInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#f0e6d2]">
            <div className="relative w-64 h-80">
                {/* Book cover */}
                <div className="absolute w-full h-full bg-[#8a7e66] rounded shadow-lg flex items-center justify-center">
                    {/* Empty book cover - text removed */}
                </div>

                {/* Pages */}
                <div className="absolute w-full h-full">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="absolute w-full h-full bg-amber-100 rounded shadow-sm"
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
                    className={`absolute w-full h-full bg-amber-100 rounded shadow transition-transform duration-300 origin-left`}
                    style={{
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                        zIndex: 10,
                        transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                >
                    <div className="p-6">
                        {Array.from({ length: totalLines }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 bg-[#d3c7a7] rounded mb-3 transition-all duration-300 ease-out ${visibleLines.includes(i) ? 'opacity-100' : 'opacity-0'
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
                className="mt-8 text-[#5d5545] font-sans h-6 text-center text-lg"
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