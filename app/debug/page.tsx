export default function DebugPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', color: 'white', background: '#000', minHeight: '100vh' }}>
      <h1>ENV DEBUG</h1>
      <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING'}</p>
      <p>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'}</p>
    </div>
  );
}