import { useState } from "react";

export default function GroupRideForm({ onSubmit }) {
    const [form, setForm] = useState({
      name: '',
      description: '',
      image: null,
      color: '#000000',
    });
  
    const handleChange = (e) => {
      const { name, value, files } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(form); // pass data back to parent
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Group Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="mt-1 w-full"
          />
        </div>
  
        <div>
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <input
            type="color"
            name="color"
            value={form.color}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
  
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Create Group Ride
        </button>
      </form>
    );
  };
  