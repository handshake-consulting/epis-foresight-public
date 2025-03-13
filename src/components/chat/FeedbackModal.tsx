"use client"

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string, rating: number) => Promise<void>;
    isLoading: boolean;
}

export function FeedbackModal({ isOpen, onClose, onSubmit, isLoading }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState("");
    const [rating, setRating] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (rating === null) return;
        await onSubmit(feedback, rating);
        setFeedback("");
        setRating(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-center">Rate this response</h2>

                {/* Rating buttons */}
                <div className="flex justify-center gap-4 mb-4">
                    <Button
                        variant={rating === 1 ? "default" : "outline"}
                        onClick={() => setRating(1)}
                        className="w-10 h-10 sm:w-12 sm:h-12"
                    >
                        👎
                    </Button>
                    <Button
                        variant={rating === 5 ? "default" : "outline"}
                        onClick={() => setRating(5)}
                        className="w-10 h-10 sm:w-12 sm:h-12"
                    >
                        👍
                    </Button>
                </div>

                {/* Feedback text area */}
                <div className="mb-4">
                    <textarea
                        className="w-full p-2 border rounded-md bg-background text-sm sm:text-base"
                        rows={4}
                        placeholder="Tell us more about your feedback (optional)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="text-sm sm:text-base">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={rating === null || isLoading} className="text-sm sm:text-base">
                        {isLoading ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
