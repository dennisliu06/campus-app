import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="relative bg-white rounded-xl p-6 w-96 shadow-lg">
          {/* X Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
          >
            <X />
          </button>
  
          {children}
        </div>
      </div>
    );
}

// <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}> {children} </Modal>