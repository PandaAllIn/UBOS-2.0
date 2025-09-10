function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="container-max py-6 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} EUFM — European Union Funds Manager</p>
        <p className="text-gray-500">AI Agent Orchestration System</p>
      </div>
    </footer>
  );
}

export default Footer;

