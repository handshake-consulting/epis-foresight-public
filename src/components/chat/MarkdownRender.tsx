"use client"

import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRenderProps {
    text: string;
}

const MarkdownRender = ({ text }: MarkdownRenderProps) => {
    return (
        <div className="text-xs sm:text-sm">
            <Markdown remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1
                            className="text-xl sm:text-2xl md:text-3xl mb-2 pb-2 border-b font-serif"
                        >
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2
                            className="text-lg sm:text-xl md:text-2xl mb-2 pb-2 border-b font-serif"
                        >
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base sm:text-lg font-semibold mb-2">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-sm sm:text-base font-semibold mb-2">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => <p className="text-gray-700 mb-4">{children}</p>,
                    a: ({ children, href }) => (
                        <Link href={href ?? ""} className="text-blue-500 hover:underline">
                            {children}
                        </Link>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc ml-4 mb-4">{children}</ul>
                    ),
                    li: ({ children }) => <li className="mb-2">{children}</li>,
                    ol: ({ children }) => (
                        <ol className="list-decimal ml-4 mb-4">{children}</ol>
                    ),
                    code: ({ className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        return (
                            <code
                                className={`${className || ''} ${isInline ? 'bg-gray-100 rounded px-1 text-xs sm:text-sm' : 'block bg-gray-100 p-1 sm:p-2 rounded my-2 overflow-x-auto text-xs sm:text-sm'}`}
                                {...props}
                            >
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-gray-100 p-1 sm:p-2 rounded my-2 overflow-x-auto text-xs sm:text-sm">
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
                            {children}
                        </blockquote>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-gray-50">
                            {children}
                        </thead>
                    ),
                    tbody: ({ children }) => (
                        <tbody className="bg-white divide-y divide-gray-200">
                            {children}
                        </tbody>
                    ),
                    tr: ({ children }) => (
                        <tr>
                            {children}
                        </tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 break-words">
                            {children}
                        </td>
                    ),
                }}
            >{text}</Markdown>
        </div>
    )
}

export default MarkdownRender
