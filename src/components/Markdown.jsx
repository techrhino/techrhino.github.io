import ReactMarkdown from 'react-markdown'

export default function Markdown({ route }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown>{route.source}</ReactMarkdown>
    </div>
  )
}