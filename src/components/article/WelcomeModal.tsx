import Dialog from '@/components/ui/Dialog';
import { useSettingsStore } from '@/store/settingsStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { settings } = useSettingsStore();

    const slides = [
        {
            title: "Welcome to Leaders Make the Future: Infinite Edition",
            content: "This is a collaborative, generative extension of the book Leaders Make the Future, Third Edition: 10 New Skills to Humanize Leadership with Generative AI, by Bob Johansen, Jeremy Kirshbaum, and Gabe Cervantes."
        },
        {
            title: "Create New Content",
            content: "By asking questions, you create and edit new pages of the book that never existed before, grounded in the original text. Any new page created is visible and sharable to everyone else."
        }
    ];

    const goToNextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onClose();
        }
    };

    const goToPrevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    // Determine theme-based styles
    const getThemeStyles = () => {
        switch (settings.theme) {
            case 'dark':
                return {
                    bg: 'bg-gray-800',
                    text: 'text-gray-100',
                    border: 'border-gray-700',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    indicator: {
                        active: 'bg-blue-500',
                        inactive: 'bg-gray-600'
                    }
                };
            case 'sepia':
                return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-900',
                    border: 'border-amber-200',
                    button: 'bg-amber-600 hover:bg-amber-700 text-white',
                    indicator: {
                        active: 'bg-amber-600',
                        inactive: 'bg-amber-300'
                    }
                };
            default: // light
                return {
                    bg: 'bg-white',
                    text: 'text-gray-800',
                    border: 'border-gray-200',
                    button: 'bg-blue-500 hover:bg-blue-600 text-white',
                    indicator: {
                        active: 'bg-blue-500',
                        inactive: 'bg-gray-300'
                    }
                };
        }
    };

    const styles = getThemeStyles();

    return (
        <Dialog isOpen={isOpen} title="Welcome" onClose={onClose}>
            <div className="flex flex-col items-center">
                <div className="text-center mb-8 mt-4">
                    <h2 className="text-xl font-bold mb-4">{slides[currentSlide].title}</h2>
                    <p className="text-base">{slides[currentSlide].content}</p>
                </div>

                {/* Navigation dots */}
                <div className="flex space-x-2 mb-6">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 w-2 rounded-full ${index === currentSlide ? styles.indicator.active : styles.indicator.inactive
                                }`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between w-full mb-4">
                    <button
                        onClick={goToPrevSlide}
                        className={`p-2 rounded-full ${currentSlide === 0 ? 'invisible' : ''
                            }`}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        onClick={goToNextSlide}
                        className={`${styles.button} px-4 py-2 rounded-md`}
                    >
                        {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
                    </button>

                    <button
                        onClick={goToNextSlide}
                        className={`p-2 rounded-full ${currentSlide === slides.length - 1 ? 'invisible' : ''
                            }`}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </Dialog>
    );
};

export default WelcomeModal;
