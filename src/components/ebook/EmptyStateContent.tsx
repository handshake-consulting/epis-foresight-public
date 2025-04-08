"use client"

import { BookOpen } from "lucide-react";

interface EmptyStateContentProps {
    theme: string;
}

export function EmptyStateContent({ theme }: EmptyStateContentProps) {
    return (
        <div className="flex flex-col h-full pt-16 pb-24">
            <div className={`flex-1 overflow-y-auto px-4 py-6 ${theme === "dark"
                ? "bg-gray-900"
                : theme === "sepia"
                    ? "bg-amber-50"
                    : "bg-gray-50"
                }`}>
                <div className="max-w-3xl mx-auto h-full flex items-center justify-center">
                    <div className={`${theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-gray-100"
                        : theme === "sepia"
                            ? "bg-amber-100 border-amber-200 text-amber-900"
                            : "bg-white border-gray-200 text-gray-800"
                        } border rounded-lg shadow-lg p-8 w-full max-w-2xl relative`}>

                        {/* Decorative book elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-gray-200 to-transparent opacity-10"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-t from-gray-200 to-transparent opacity-10"></div>
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-400 to-transparent opacity-10"></div>

                        <div className="text-center space-y-6">
                            <BookOpen className={`h-16 w-16 mx-auto ${theme === "dark"
                                ? "text-gray-400"
                                : theme === "sepia"
                                    ? "text-amber-700"
                                    : "text-gray-500"
                                }`} />

                            <h1 className={`text-2xl font-bold ${theme === "dark"
                                ? "text-white"
                                : theme === "sepia"
                                    ? "text-amber-900"
                                    : "text-gray-800"
                                }`}>
                                Create Your New Page
                            </h1>

                            <p className={`${theme === "dark"
                                ? "text-gray-300"
                                : theme === "sepia"
                                    ? "text-amber-800"
                                    : "text-gray-600"
                                } max-w-md mx-auto`}>
                                Enter a topic or question in the text box below to create a new page of the book.
                                You can refine the page after with Revise Page.
                            </p>

                            <div className={`p-4 rounded-lg ${theme === "dark"
                                ? "bg-gray-700 text-gray-300"
                                : theme === "sepia"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-gray-100 text-gray-700"
                                } text-sm italic`}>
                                <p>Try prompts like:</p>
                                <ul className="text-left list-disc pl-5 mt-2 space-y-1">
                                    <li>{`"How will this impact CIOs?"`}</li>
                                    <li>{`"What will be the affect of the leadership skills on jurisprudence?"`}</li>
                                    <li>{`"In a world of ubiquitous AI agents, how can I organize my teams better?"`}</li>
                                </ul>
                            </div>

                            <div className={`text-sm ${theme === "dark"
                                ? "text-gray-400"
                                : theme === "sepia"
                                    ? "text-amber-700"
                                    : "text-gray-500"
                                }`}>
                                <p></p>
                                <p className="mt-1">↓</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
