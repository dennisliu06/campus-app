import Modal from "@/components/Modal";
import { useEffect, useRef, useState } from "react";

// GroupRideModal with two tabs: Create and Join
export default function GroupRideModal({ isOpen, onClose, onCreate, onJoin }) {
  const [activeTab, setActiveTab] = useState("create");

  // State for Create Group form
  const [createForm, setCreateForm] = useState({
    name: "",
    destination: "",
    description: "",
    image: null,
    color: "red", // default color value
  });

  // State for Join Group form (code only)
  const [joinCode, setJoinCode] = useState("");

  const handleCreateChange = (e) => {
    const { name, value, files } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreate(createForm);
    onClose();
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    onJoin(joinCode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Tabs Header */}
      <div className="relative flex justify-around mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("create")}
          className="relative z-10 w-1/2 text-center py-2 font-medium"
        >
          Create Group
        </button>
        <button
          onClick={() => setActiveTab("join")}
          className="relative z-10 w-1/2 text-center py-2 font-medium"
        >
          Join Group
        </button>

        {/* Animated Underline */}
        <span
          className="absolute bottom-0 h-1 bg-campus-purple transition-all duration-300 ease-in-out"
          style={{
            width: "50%",
            left: activeTab === "create" ? "0%" : "50%",
          }}
        />
      </div>


      {activeTab === "create" ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Create a Group Ride</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Ski Trip 2025"
                value={createForm.name}
                onChange={handleCreateChange}
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <input
                type="text"
                name="destination"
                placeholder="Mount Everest"
                value={createForm.destination}
                onChange={handleCreateChange}
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={createForm.description}
                onChange={handleCreateChange}
                rows="4"
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleCreateChange}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <ColorDropdown
                value={createForm.color}
                onChange={(val) =>
                  setCreateForm((prev) => ({ ...prev, color: val }))
                }
              />
            </div>
            <button
              type="submit"
              className="w-full bg-campus-purple text-white py-2 rounded hover:bg-campus-purple-hover"
            >
              Create Group Ride
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Join a Group Ride</h2>
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Group Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-campus-purple text-white py-2 rounded hover:bg-campus-purple-hover"
            >
              Join Group Ride
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}

// Define the available colors with their labels and hex values
const colors = [
  { value: "red", label: "Red", primary: "#e53e3e", hover: "#c53030" },
  { value: "blue", label: "Blue", primary: "#3182ce", hover: "#2b6cb0" },
  { value: "green", label: "Green", primary: "#38a169", hover: "#2f855a" },
  { value: "yellow", label: "Yellow", primary: "#d69e2e", hover: "#b7791f" },
  { value: "purple", label: "Purple", primary: "#8163e9", hover: "#6f51d9" },
];

// Custom color dropdown component
const ColorDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = colors.find((color) => color.value === value) || colors[0];
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 w-full border rounded px-3 py-2 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center">
          <span
            className="inline-block w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: selected.primary }}
          ></span>
          <span>{selected.label}</span>
        </div>
        <svg className="w-4 h-4" viewBox="0 0 20 20">
          <path fill="currentColor" d="M10 12l-4-4h8l-4 4z" />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
          {colors.map((color) => (
            <li
              key={color.value}
              onClick={() => {
                onChange(color.value);
                setIsOpen(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <span
                className="inline-block w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: color.primary }}
              ></span>
              <span>{color.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
