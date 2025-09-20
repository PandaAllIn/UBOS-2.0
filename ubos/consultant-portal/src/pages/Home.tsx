import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="container-max py-10">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">EUFM Consultant Portal</h1>
        <p className="mt-3 text-gray-600">AI-powered EU funding consultancy. Upload documents, analyze compliance, and discover opportunities.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/upload" className="px-4 py-2 rounded bg-eufm-primary text-white hover:bg-sky-600">Get Started</Link>
          <Link to="/opportunities" className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">View Opportunities</Link>
        </div>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium">Smart Uploads</h3>
          <p className="text-sm text-gray-600 mt-2">Drag-and-drop project docs to start automated analysis.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium">Compliance Insights</h3>
          <p className="text-sm text-gray-600 mt-2">Instant feedback on eligibility, SME status, and fit.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium">Matched Opportunities</h3>
          <p className="text-sm text-gray-600 mt-2">Receive curated EU funding calls with match scores.</p>
        </div>
      </div>
    </section>
  );
}

export default Home;

