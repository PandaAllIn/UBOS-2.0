import ResultsCard from '@components/ResultsCard';
import { useAppStore } from '@store/useAppStore';

function Analysis() {
  const { compliance, deadlines, files } = useAppStore((s) => ({
    compliance: s.compliance,
    deadlines: s.deadlines,
    files: s.files,
  }));

  return (
    <section className="container-max py-10">
      <h2 className="text-2xl font-semibold">Analysis Results</h2>
      <p className="text-gray-600 mt-2">Summary of eligibility and upcoming deadlines.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <ResultsCard
          title="Compliance"
          items={compliance.map((c) => ({ label: c.check, value: c.detail ?? c.status.toUpperCase(), status: c.status }))}
        />
        <ResultsCard
          title="Deadlines"
          items={deadlines.map((d) => ({ label: d.program, value: new Date(d.deadline).toLocaleDateString() }))}
        />
      </div>

      <div className="mt-8">
        <h3 className="font-medium">Uploaded Files</h3>
        {files.length === 0 ? (
          <p className="text-sm text-gray-600 mt-2">No files uploaded yet.</p>
        ) : (
          <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
            {files.map((f) => (
              <li key={f.name}>{f.name} — {(f.size / 1024).toFixed(1)} KB</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Analysis;

