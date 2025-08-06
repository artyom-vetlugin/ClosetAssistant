const Suggestions = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Outfit Suggestions</h1>

      {/* Generate Button */}
      <div className="card text-center">
        <h2 className="text-xl font-semibold mb-3">Generate New Outfits</h2>
        <p className="text-gray-600 mb-4">
          Get personalized outfit suggestions based on your wardrobe
        </p>
        <button className="btn-primary">
          Generate Suggestions
        </button>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Empty state */}
        <div className="col-span-full">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No suggestions yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add some items to your wardrobe to get personalized outfit suggestions
            </p>
            <button className="btn-secondary">
              Browse Wardrobe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;