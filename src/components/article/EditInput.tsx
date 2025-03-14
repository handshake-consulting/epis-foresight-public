"use client"

import { Button } from "@/components/ui/button";
import { Send, StopCircle } from "lucide-react";
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
        <div className="border-t py-4 px-4 w-full">
            <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto">
                <div className="mb-2">
                    <label htmlFor="edit-input" className="block text-sm font-medium text-gray-700 mb-1">
                        {isFirstGeneration
                            ? "Enter a topic to generate an article"
                            : "Refine or edit the article"}
                    </label>
                    <div className="relative bg-white rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                        <textarea
                            id="edit-input"
                            ref={inputRef}
                            placeholder={isFirstGeneration
                                ? "Enter a topic or question..."
                                : "Describe how you'd like to refine the article..."}
                            className="w-full bg-transparent border-none focus:outline-none py-3 px-4 text-sm sm:text-base resize-none min-h-[100px]"
                            disabled={isStreaming}
                        />
                        <div className="absolute bottom-2 right-2">
                            {isStreaming ? (
                                <Button
                                    type="button"
                                    onClick={onStop}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                >
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    Stop
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    variant="default"
                                    size="sm"
                                    className="rounded-full"
                                >
                                    <Send className="h-4 w-4 mr-1" />
                                    {isFirstGeneration ? "Generate" : "Update"}
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
                            className="rounded-full text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                            size="sm"
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            New Article
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
