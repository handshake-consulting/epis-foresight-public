"use client"

import { Button } from "@/components/ui/button";
import { BookPlus, Feather, StopCircle } from "lucide-react";
import { FormEvent, RefObject } from "react";

interface EditInputProps {
    inputRef: RefObject<HTMLTextAreaElement>;
    isStreaming: boolean;
    isFirstGeneration: boolean;
    onSubmit: (e: FormEvent) => Promise<void>;
    onStop: () => void;
    onNewArticle: () => void;
}

export function EditInput({
    inputRef,
    isStreaming,
    isFirstGeneration,
    onSubmit,
    onStop,
    onNewArticle
}: EditInputProps) {
    return (
        <div className="border-t border-[#e8e1d1] py-4 px-6 w-full bg-[#fcf9f2]">
            <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto">
                <div className="mb-2">
                    <label htmlFor="edit-input" className="block text-sm font-medium font-serif text-[#5d5545] mb-2 italic">
                        {isFirstGeneration
                            ? "What would you like to write about?"
                            : "How would you like to revise this page?"}
                    </label>
                    <div className="relative bg-white rounded-lg border border-[#e8e1d1] shadow-md focus-within:border-[#8a7e66] focus-within:ring-1 focus-within:ring-[#8a7e66]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-[#e8e1d1] to-transparent opacity-30"></div>
                        <textarea
                            id="edit-input"
                            ref={inputRef}
                            placeholder={isFirstGeneration
                                ? "Enter a topic or question for your new book..."
                                : "Provide instructions for revising this page..."}
                            className="w-full bg-transparent border-none focus:outline-none py-4 px-5 text-sm sm:text-base resize-none min-h-[100px] font-serif text-[#2d2d2d]"
                            disabled={isStreaming}
                        />
                        <div className="absolute bottom-3 right-3">
                            {isStreaming ? (
                                <Button
                                    type="button"
                                    onClick={onStop}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-md bg-[#f5f1e6] text-[#8a7e66] hover:bg-[#e8e1d1] border-[#e8e1d1] font-serif"
                                >
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    Stop Writing
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="default"
                                    size="sm"
                                    className="rounded-md bg-[#8a7e66] hover:bg-[#5d5545] text-white border-none font-serif"
                                >
                                    <Feather className="h-4 w-4 mr-1" />
                                    {isFirstGeneration ? "Begin Writing" : "Continue Writing"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Article button - only shown when not in first generation */}
                {!isFirstGeneration && (
                    <div className="flex justify-center mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onNewArticle}
                            className="rounded-md text-sm px-4 py-2 bg-[#f5f1e6] text-[#5d5545] hover:bg-[#e8e1d1] border-[#e8e1d1] font-serif"
                            size="sm"
                        >
                            <BookPlus className="h-4 w-4 mr-2" />
                            Start New Page
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
