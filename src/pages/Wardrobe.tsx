const Wardrobe = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Wardrobe</h1>
        <button className="btn-primary">
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select className="w-full p-2 border border-gray-300 rounded">
              <option value="">All types</option>
              <option value="top">Tops</option>
              <option value="bottom">Bottoms</option>
              <option value="dress">Dresses</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select className="w-full p-2 border border-gray-300 rounded">
              <option value="">All colors</option>
              <option value="black">Black</option>
              <option value="white">White</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select className="w-full p-2 border border-gray-300 rounded">
              <option value="">All seasons</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="fall">Fall</option>
              <option value="winter">Winter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Empty state */}
        <div className="col-span-full">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No items yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start building your digital wardrobe by adding your first item
            </p>
            <button className="btn-primary">
              Add Your First Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wardrobe;