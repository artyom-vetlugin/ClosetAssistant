const AddItem = () => {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h1>
      
      <div className="card">
        <div className="space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-600 mb-4">Take a photo or upload from gallery</p>
              <div className="space-y-2">
                <button className="btn-primary w-full">
                  Take Photo
                </button>
                <button className="btn-secondary w-full">
                  Upload from Gallery
                </button>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-lg">
              <option value="">Select type...</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="dress">Dress</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
              <option value="accessory">Accessory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-lg">
              <option value="">Select color...</option>
              <option value="black">Black</option>
              <option value="white">White</option>
              <option value="gray">Gray</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="pink">Pink</option>
              <option value="purple">Purple</option>
              <option value="brown">Brown</option>
              <option value="orange">Orange</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Season
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Spring
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Summer
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Fall
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Winter
              </label>
            </div>
          </div>

          <button className="btn-primary w-full">
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItem;