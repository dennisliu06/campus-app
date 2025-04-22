import { z } from "zod";

const groupRideSchema = z.object({
  carId: z.string().nonempty("Please select a car."),
  maxRiders: z.number().nonnegative(),
  vibe: z.string().nonempty("Please select a vibe."),
})