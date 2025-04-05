"use client"

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettingsStore } from '../../store/settingsStore';

interface ArticleMarkdownRenderProps {
    text: string;
}

// Create a proper React component for images
const ImageRenderer = ({ src, alt }: { src: string | undefined, alt: string }) => {
    const [isHovering, setIsHovering] = useState(false);

    const handleDownload = async () => {
        if (!src) return;

        try {
            // Fetch the image as a blob
            const response = await fetch(src);
            if (!response.ok) throw new Error('Failed to download image');

            const blob = await response.blob();

            // Create a blob URL and trigger download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `image-${Date.now()}.jpg`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const handleFullscreen = () => {
        if (!src) return;

        // Open the image in a new tab for fullscreen viewing
        window.open(src, '_blank');
    };

    // Use a span instead of div to avoid invalid nesting
    if (!src) return null;

    return (
        <span
            className="relative inline-block float-right ml-6 mb-4 mt-1 w-1/3 max-w-[300px] md:block hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <Image
                src={src}
                alt={alt || ''}
                width={300}
                height={200}
                className="rounded-md shadow-md hover:shadow-lg w-full h-auto"
                style={{ objectFit: 'cover' }}
                quality={80}
                sizes="(max-width: 768px) 0px, 300px"
                data-testid="article-image"
            />

            {isHovering && (
                <span className="absolute top-2 right-2 flex gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDownload();
                        }}
                        className="bg-white/80 hover:bg-white p-1 rounded shadow text-gray-800 transition-colors"
                        aria-label="Download image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleFullscreen();
                        }}
                        className="bg-white/80 hover:bg-white p-1 rounded shadow text-gray-800 transition-colors"
                        aria-label="View fullscreen"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    </button>
                </span>
            )}
        </span>
    );
};

export const ArticleMarkdownRender = ({ text }: ArticleMarkdownRenderProps) => {
    const { settings } = useSettingsStore();

    // Create style objects from settings
    const baseStyles = {
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        textAlign: settings.textAlign,
    };

    // Create paragraph styles with spacing
    const paragraphStyles = {
        ...baseStyles,
        marginBottom: `${settings.paragraphSpacing}em`,
    };

    return (
        <div style={baseStyles}>
            <Markdown remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1
                            className="text-2xl sm:text-3xl md:text-4xl mb-6 pb-2 border-b border-[#e8e1d1] font-serif font-bold "
                            style={baseStyles}
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2
                            className="text-xl sm:text-2xl md:text-3xl mb-4 pb-2 border-b border-[#e8e1d1] font-serif font-semibold "
                            style={baseStyles}
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3
                            className="text-lg sm:text-xl font-serif font-semibold mb-3 "
                            style={baseStyles}
                        >
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4
                            className="text-base sm:text-lg font-serif font-semibold mb-2 "
                            style={baseStyles}
                        >
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => (
                        <p
                            className=" font-serif leading-relaxed"
                            style={paragraphStyles}
                        >
                            {children}
                        </p>
                    ),
                    a: ({ children, href }) => (
                        <Link
                            href={href ?? ""}
                            className="text-blue-700 hover:underline font-serif"
                            style={baseStyles}
                        >
                            {children}
                        </Link>
                    ),
                    ul: ({ children }) => (
                        <ul
                            className="list-disc ml-6 mb-4 font-serif"
                            style={baseStyles}
                        >
                            {children}
                        </ul>
                    ),
                    li: ({ children }) => (
                        <li
                            className="mb-2 leading-relaxed"
                            style={baseStyles}
                        >
                            {children}
                        </li>
                    ),
                    ol: ({ children }) => (
                        <ol
                            className="list-decimal ml-6 mb-4 font-serif"
                            style={baseStyles}
                        >
                            {children}
                        </ol>
                    ),
                    code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return (
                            <code
                                className={`${className || ''} ${isInline ? 'bg-[#f5f1e6] rounded px-1 text-xs sm:text-sm font-mono' : 'block bg-[#f5f1e6] p-2 sm:p-3 rounded my-4 overflow-x-auto text-xs sm:text-sm font-mono'}`}
                                style={baseStyles}
                                {...props}
                            >
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre
                            className="bg-[#f5f1e6] p-2 sm:p-3 rounded my-4 overflow-x-auto text-xs sm:text-sm font-mono"
                            style={baseStyles}
                        >
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote
                            className="border-l-4 border-[#e8e1d1] pl-4 italic my-6 font-serif text-gray-700"
                            style={baseStyles}
                        >
                            {children}
                        </blockquote>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6 border border-[#e8e1d1] rounded">
                            <table
                                className="min-w-full divide-y divide-[#e8e1d1]"
                                style={baseStyles}
                            >
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead
                            className="bg-[#f5f1d6]"
                            style={baseStyles}
                        >
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody
                            className="bg-white divide-y divide-[#e8e1d1]"
                            style={baseStyles}
                        >
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr style={baseStyles}>
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th
                            className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-serif"
                            style={baseStyles}
                        >
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td
                            className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 break-words font-serif"
                            style={baseStyles}
                        >
                            {children}
                        </td>
                    ),
                    img: ({ src, alt }) => <ImageRenderer src={src} alt={alt || ''} />,
                    hr: () => (
                        <hr className="my-8 border-t border-[#e8e1d1]" />
                    ),
                    strong: ({ children }) => (
                        <strong
                            className="font-semibold "
                            style={baseStyles}
                        >
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em
                            className="italic "
                            style={baseStyles}
                        >
                            {children}
                        </em>
                    ),
                }}
            >{text}</Markdown>

            {/* Global CSS for image controls using data attributes to control visibility */}
            <style jsx global>{`
                @media (min-width: 768px) {
                    /* Only apply on desktop */
                    img[data-testid="article-image"] {
                        cursor: pointer;
                    }
                    
                    img[data-testid="article-image"]:hover {
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    }
                }
            `}</style>
        </div>
    )
}
