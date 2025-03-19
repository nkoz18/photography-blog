// pages/debug.js

export async function getServerSideProps() {
    // We'll read the URL from environment variable
    const strapiURL = process.env.NEXT_PUBLIC_STRAPI_API_URL || null;
  
    // We'll try a simple fetch to /api/articles
    const testEndpoint = strapiURL
      ? `${strapiURL}/api/articles`
      : "No strapiURL found";
  
    let data = null;
    let errorMsg = null;
  
    try {
      // Only attempt fetch if we have a valid URL
      if (!strapiURL) {
        throw new Error("No NEXT_PUBLIC_STRAPI_API_URL set in environment!");
      }
  
      const res = await fetch(testEndpoint);
      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }
      data = await res.json();
    } catch (err) {
      errorMsg = err.message || String(err);
    }
  
    return {
      props: {
        nodeEnv: process.env.NODE_ENV || null,
        strapiURL,
        testEndpoint,
        data,
        errorMsg,
      },
    };
  }
  
  export default function DebugPage({
    nodeEnv,
    strapiURL,
    testEndpoint,
    data,
    errorMsg,
  }) {
    return (
      <div style={{ padding: "1rem" }}>
        <h1>Debug SSR Page</h1>
        <p><strong>NODE_ENV:</strong> {nodeEnv}</p>
        <p><strong>NEXT_PUBLIC_STRAPI_API_URL:</strong> {strapiURL}</p>
        <p><strong>Test Endpoint:</strong> {testEndpoint}</p>
  
        <h2>Result:</h2>
        {errorMsg ? (
          <pre style={{ color: "red" }}>ERROR: {errorMsg}</pre>
        ) : (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    );
  }
  