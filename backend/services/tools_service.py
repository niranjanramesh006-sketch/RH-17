from ddgs import DDGS
import os
import re

def calculator(expression: str) -> str:
    """Safe calculator tool"""
    try:
        allowed = set("0123456789+-*/().,% ")
        if not all(c in allowed for c in expression):
            return "Invalid expression"
        result = eval(expression)
        return str(round(result, 4))
    except Exception as e:
        return f"Calculation error: {str(e)}"

def web_search(query: str) -> str:
    """Search the web using DuckDuckGo — no API key needed"""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=3):
                results.append(f"• {r['title']}\n{r['body'][:200]}")
        if not results:
            return "No results found"
        return "\n\n".join(results)
    except Exception as e:
        return f"Search error: {str(e)}"

def detect_tools_needed(message: str) -> list:
    tools = []
    msg = message.lower()

    calc_keywords = [
        "calculate", "what is", "how much is", "compute",
        "%", "percent", "salary", "total", "sum", "multiply",
        "divide", "add", "subtract"
    ]
    if any(k in msg for k in calc_keywords):
        if any(c.isdigit() for c in message):
            tools.append("calculator")

    search_keywords = [
        "search", "latest", "current", "today", "news",
        "recent", "right now", "what's happening",
        "find online", "search for", "look up"
    ]
    if any(k in msg for k in search_keywords):
        tools.append("web_search")

    return tools

def extract_math_expression(message: str) -> str:
    expression = re.sub(r'[^0-9+\-*/().,% ]', ' ', message)
    expression = ' '.join(expression.split())
    return expression.strip()