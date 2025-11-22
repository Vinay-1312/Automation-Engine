from fastmcp import FastMCP

mcp = FastMCP("action_server")

@mcp.tool()
async def add(a: int, b: int) -> str:
    """add two numbers."""
    return a + b

@mcp.tool()
async def create_task(taskType: str) -> str:
    """Create a task with a name, id, and location."""
    return f"Task '{taskType}' created successfully."

# Create ASGI application for Daphne
app = mcp.http_app()

if __name__ == "__main__":
    mcp.run(transport="streamable-http")