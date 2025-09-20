// /Users/apple/Desktop/UBOS_2.0/UBOS/eufm-portal/src/App.tsx
import { useState } from 'react';

function App() {
  const [title, setTitle] = useState('');
  const [budgetTarget, setBudgetTarget] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/eufm/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'eufm-portal', // Mock tenant ID
        },
        body: JSON.stringify({
          title,
          budgetTarget: parseInt(budgetTarget, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">EUFM Portal</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="budgetTarget" className="block text-gray-700">
            Budget Target (€)
          </label>
          <input
            type="number"
            id="budgetTarget"
            value={budgetTarget}
            onChange={(e) => setBudgetTarget(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Result</h2>
          <pre className="bg-gray-100 p-4 rounded">{result}</pre>
        </div>
      )}
    </div>
  );
}

export default App;