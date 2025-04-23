import Modal from "@/components/Modal";
import { getCarsByUserId } from "@/data/cars";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface RideFormActions {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (form: { carId: string; maxRiders: number; vibe: string }) => void;
}

interface Car {
  id: string;
  name: string;
  maxCapacity: number;
}

export default function RideForm({
  userId,
  isOpen,
  onClose,
  onCreate,
}: RideFormActions) {
  const [cars, setCars] = useState<Car[]>();
  const [hasCars, setHasCars] = useState(true);
  const [selectedCar, setSelectedCar] = useState<{id: string, maxCapacity: number} | null>(null);
  const [form, setForm] = useState({
    carId: "",
    maxRiders: 1,
    vibe: "",
  });

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const fetchedCars = await getCarsByUserId(userId);
        setCars(fetchedCars);

        if (fetchedCars && fetchedCars[0]) {
          setForm((prev) => ({...prev, carId: fetchedCars[0].id }));
        } else {
          setHasCars(false);
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchCars();
  }, [userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(selectedCar) {
      onCreate({carId: selectedCar.id, maxRiders: selectedCar.maxCapacity, vibe: form.vibe})
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <AnimatePresence>
        <motion.div
          key="create"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
          transition={{ duration: 0.3 }}
          className="overflow-visible"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {!hasCars ? (
              <div className="p-6">
                <div className="flex flex-col items-center justify-center gap-4 bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 text-center">
                  <p className="text-gray-600 text-sm">
                    You don't have any cars registered 😢
                  </p>
                  <Link
                    href="/car-form"
                    className="inline-block bg-campus-purple text-white  px-4 py-2 rounded-md hover:bg-campus-purple-hover transition"
                  >
                    Register a Car
                  </Link>
                </div>
              </div>
            ) : (
              <>
              <h1 className="px-6 font-semibold mt-4 text-xl">Your ride details</h1>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="carId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Your Car
                  </label>
                  {cars && (
                    <CustomDropdown
                      cars={cars}
                      selectedCar={selectedCar}
                      onChange={setSelectedCar}
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="vibe"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Vibe
                  </label>
                  <input
                    type="text"
                    id="vibe"
                    name="vibe"
                    value={form.vibe}
                    onChange={(e) => setForm({ ...form, vibe: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-campus-purple focus:border-campus-purple sm:text-sm p-2"
                    placeholder="e.g., Party on wheels"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-campus-purple text-white py-2 px-4 rounded-md hover:bg-campus-purple-hover transition"
                >
                  Create Ride
                </button>
              </form>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}

interface CustomDropdownProps {
  cars: Car[];
  selectedCar: {id: string, maxCapacity: number} | null;
  onChange: ({id, maxCapacity}: {id: string, maxCapacity: number}) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  cars,
  selectedCar,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = cars.find((car) => car.id === selectedCar?.id) || cars[0];
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
          <span>{selected.name}</span>
          <span className="ml-2 text-sm text-gray-500">Seats: {selected.maxCapacity}</span>
        </div>
        <svg className="w-4 h-4" viewBox="0 0 20 20">
          <path fill="currentColor" d="M10 12l-4-4h8l-4 4z" />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg">
          {cars.map((car) => (
            <li
              key={car.id}
              onClick={() => {
                onChange({id: car.id, maxCapacity: car.maxCapacity}); // Trigger onChange callback when a car is selected
                setIsOpen(false); // Close dropdown after selection
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <span>{car.name}</span>
              <span className="text-sm text-gray-500">Seats: {car.maxCapacity}</span>
            </li>
          ))}

              <Link href="/car-form" className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                Register a new car
              </Link>

        </ul>
        
      )}
    </div>
  );
};
