function MessageBubble({ role, content }) {
  return (
    <div
      className={`p-3 rounded-xl max-w-[70%] mb-4 ${
        role === "user"
          ? "bg-blue-500 ml-auto"
          : "bg-zinc-800"
      }`}
    >
      {content}
    </div>
  )
}

export default MessageBubble