export const createMcpResponse = (text: string, isError = false) => ({
  content: [{ 
    type: "text" as const, 
    text 
  }],
  ...(isError && { isError }),
});

export const createMcpError = (text: string) => createMcpResponse(text, true);