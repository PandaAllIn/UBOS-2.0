import Dropzone from '@components/Dropzone';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@store/useAppStore';

function Upload() {
  const navigate = useNavigate();
  const analyze = useAppStore((s) => s.analyze);

  return (
    <section className="container-max py-10">
      <h2 className="text-2xl font-semibold">Upload Documents</h2>
      <p className="text-gray-600 mt-2">Add your project documents to run compliance analysis.</p>
      <div className="mt-6">
        <Dropzone
          onFilesAccepted={() => {
            analyze();
            navigate('/analysis');
          }}
        />
      </div>
    </section>
  );
}

export default Upload;

