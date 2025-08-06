const History = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wear History</h1>

      {/* History List */}
      <div className="space-y-4">
        {/* Empty state */}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No wear history yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start tracking your outfits to see your wear patterns
          </p>
          <button className="btn-secondary">
            Get Outfit Suggestions
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;