import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Consistently extract a clean error message from various response formats
export async function extractErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  
  // Try to parse the error as JSON to extract the message
  let errorMessage = res.statusText;
  
  try {
    // Check if it's valid JSON
    const errorJson = JSON.parse(text);
    
    // Check for common error message patterns
    if (errorJson.message) {
      errorMessage = errorJson.message;
    } else if (errorJson.error) {
      errorMessage = errorJson.error;
    } else if (typeof errorJson === 'string') {
      errorMessage = errorJson;
    } else if (typeof errorJson === 'object' && Object.keys(errorJson).length > 0) {
      // Get the first property if it's a simple object with a message-like property
      errorMessage = errorJson[Object.keys(errorJson)[0]];
    }
  } catch (e) {
    // If the error text is not valid JSON, clean up the text
    // Remove any status code prefixes like "400:" or "500: "
    errorMessage = text || res.statusText;
    errorMessage = errorMessage.replace(/^\d{3}:?\s*/, '');
  }
  
  return errorMessage;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorMessage = await extractErrorMessage(res);
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
