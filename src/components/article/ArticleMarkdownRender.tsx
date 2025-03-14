"use client"

import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleMarkdownRenderProps {
    text: string;
}

export const ArticleMarkdownRender = ({ text }: ArticleMarkdownRenderProps) => {
    return (
        <div className="text-sm sm:text-base">
            <Markdown remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1
                            className="text-2xl sm:text-3xl md:text-4xl mb-6 pb-2 border-b border-[#e8e1d1] font-serif font-bold text-[#2d2d2d]"
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2
                            className="text-xl sm:text-2xl md:text-3xl mb-4 pb-2 border-b border-[#e8e1d1] font-serif font-semibold text-[#2d2d2d]"
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg sm:text-xl font-serif font-semibold mb-3 text-[#2d2d2d]">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-base sm:text-lg font-serif font-semibold mb-2 text-[#2d2d2d]">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => (
                        <p className="text-[#2d2d2d] mb-4 font-serif leading-relaxed">
                            {children}
                        </p>
                    ),
                    a: ({ children, href }) => (
                        <Link href={href ?? ""} className="text-blue-700 hover:underline font-serif">
                            {children}
                        </Link>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc ml-6 mb-4 font-serif">{children}</ul>
                    ),
                    li: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
                    ol: ({ children }) => (
                        <ol className="list-decimal ml-6 mb-4 font-serif">{children}</ol>
                    ),
                    code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return (
                            <code
                                className={`${className || ''} ${isInline ? 'bg-[#f5f1e6] rounded px-1 text-xs sm:text-sm font-mono' : 'block bg-[#f5f1e6] p-2 sm:p-3 rounded my-4 overflow-x-auto text-xs sm:text-sm font-mono'}`}
                                {...props}
                            >
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-[#f5f1e6] p-2 sm:p-3 rounded my-4 overflow-x-auto text-xs sm:text-sm font-mono">
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#e8e1d1] pl-4 italic my-6 font-serif text-gray-700">
                            {children}
                        </blockquote>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6 border border-[#e8e1d1] rounded">
                            <table className="min-w-full divide-y divide-[#e8e1d1]">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-[#f5f1e6]">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="bg-white divide-y divide-[#e8e1d1]">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr>
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-serif">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-700 break-words font-serif">
                            {children}
                        </td>
                    ),
                    img: ({ src, alt }) => (
                        <div className="my-6">
                            <img
                                src={src || ''}
                                alt={alt || ''}
                                className="mx-auto rounded-md shadow-md max-w-full"
                            />
                            {alt && <p className="text-center text-sm text-gray-600 mt-2 italic font-serif">{alt}</p>}
                        </div>
                    ),
                    hr: () => (
                        <hr className="my-8 border-t border-[#e8e1d1]" />
                    ),
                    strong: ({ children }) => (
                        <strong className="font-semibold text-[#2d2d2d]">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-[#2d2d2d]">{children}</em>
                    ),
                }}
            >{text}</Markdown>
        </div>
    )
}
