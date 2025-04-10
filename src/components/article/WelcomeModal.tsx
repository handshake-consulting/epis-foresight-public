import Dialog from '@/components/ui/Dialog';
import { useSettingsStore } from '@/store/settingsStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { settings } = useSettingsStore();

    // Determine theme-based styles
    const styles = useMemo(() => {
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
    }, [settings.theme]);

    // Create slides after styles are defined
    const slides = useMemo(() => [
        {
            title: "",
            content: "",
            customContent: (
                <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-full max-w-[240px] mb-6">
                        <Image
                            src="/cover infinite edition.png"
                            alt="Leaders Make the Future: Infinite Edition Cover"
                            width={240}
                            height={360}
                            className="w-full rounded-md"
                            priority
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
                            quality={75}
                        />
                    </div>
                    <button
                        onClick={() => setCurrentSlide(1)}
                        className={`${styles.button} px-4 py-2 rounded-md`}
                    >
                        Enter
                    </button>
                </div>
            )
        },
        {
            title: "Welcome to Leaders Make the Future: Infinite Edition",
            content: "This is a collaborative, generative extension of the book <a href='https://www.amazon.com/Leaders-Make-Future-Third-Leadership/dp/B0D66H9BF1/ref=asc_df_B0D66H9BF1' target='_blank' rel='noopener noreferrer' style='color: #3b82f6; text-decoration: underline;'>Leaders Make the Future, Third Edition: 10 New Skills to Humanize Leadership with Generative AI</a>, by Bob Johansen, Jeremy Kirshbaum, and Gabe Cervantes."
        },
        {
            title: "Create New Content",
            content: "By asking questions, you create and edit new pages of the book that never existed before, grounded in the original text. Any new page created is visible and sharable to everyone else."
        }
    ], [styles]);

    const goToNextSlide = useCallback(() => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onClose();
        }
    }, [currentSlide, slides.length, onClose]);

    const goToPrevSlide = useCallback(() => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    }, [currentSlide]);

    const totalSlides = slides.length;

    return (
        <Dialog isOpen={isOpen} onClose={onClose} hideHeader={true}>
            <div className="flex flex-col items-center justify-center h-full relative">
                {slides[currentSlide].customContent ? (
                    slides[currentSlide].customContent
                ) : (
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold mb-4">{slides[currentSlide].title}</h2>
                        <p className="text-base" dangerouslySetInnerHTML={{ __html: slides[currentSlide].content }}></p>
                    </div>
                )}

                {/* Navigation dots */}
                <div className="flex space-x-2 mb-2 mt-2">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 w-2 rounded-full ${index === currentSlide
                                ? styles.indicator.active
                                : styles.indicator.inactive
                                }`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>

                {/* Navigation buttons - Hide on first slide */}
                {currentSlide !== 0 && (
                    <div className="flex justify-between w-full mb-4">
                        <button
                            onClick={goToPrevSlide}
                            className={`p-2 rounded-full ${currentSlide === 1 ? 'invisible' : ''
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
                )}
            </div>
        </Dialog>
    );
};

export default WelcomeModal;
