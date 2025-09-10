type Props = {
  title: string;
  items: { label: string; value: string; status?: 'pass' | 'warn' | 'fail' }[];
};

function statusColor(status?: 'pass' | 'warn' | 'fail') {
  switch (status) {
    case 'pass':
      return 'text-green-600';
    case 'warn':
      return 'text-yellow-600';
    case 'fail':
      return 'text-red-600';
    default:
      return 'text-gray-700';
  }
}

function ResultsCard({ title, items }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-medium ${statusColor(item.status)}`}>{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ResultsCard;

