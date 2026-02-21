import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('prose-dark', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold text-foreground mt-6 mb-4 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold text-foreground mt-5 mb-3" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-semibold text-foreground mt-3 mb-2" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="text-sm text-foreground/90 leading-relaxed mb-3" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside text-sm text-foreground/90 mb-3 space-y-1 ml-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside text-sm text-foreground/90 mb-3 space-y-1 ml-2" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-sm text-foreground/90" {...props}>
              {children}
            </li>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          code: ({ children, className: codeClassName, ...props }) => {
            const isInline = !codeClassName
            if (isInline) {
              return (
                <code
                  className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-emerald-400 font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('text-sm font-mono', codeClassName)} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children, ...props }) => (
            <pre
              className="rounded-lg bg-zinc-900 border border-border p-4 overflow-x-auto mb-3 text-sm"
              {...props}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-2 border-border pl-4 italic text-muted-foreground mb-3"
              {...props}
            >
              {children}
            </blockquote>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm border-collapse" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="border-b border-border" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="py-2 px-3 text-sm text-foreground/90 border-b border-border/50" {...props}>
              {children}
            </td>
          ),
          hr: (props) => <hr className="border-border my-4" {...props} />,
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="text-foreground/80" {...props}>
              {children}
            </em>
          ),
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              disabled
              className="mr-2 accent-emerald-500"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
