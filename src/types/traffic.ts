export type Direction = "N" | "S" | "E" | "W";
export type VehicleClass = "car" | "truck" | "bus" | "motorcycle";
export type Severity = "info" | "warning" | "critical";
export type EventType =
  | "congestion"
  | "stalled_vehicle"
  | "wrong_way"
  | "pedestrian_conflict"
  | "signal_fault"
  | "sensor_health";
export type TimeRange = "1h" | "6h" | "24h";
export type SignalPhase = "NS_GREEN" | "NS_AMBER" | "EW_GREEN" | "EW_AMBER";
export type CongestionState = "free" | "moderate" | "heavy";

export interface Vehicle {
  id: string;
  dir: Direction;
  cls: VehicleClass;
  confidence: number; // simulated detector score
  pos: number; // distance travelled along path (0..PATH_LEN)
  speed: number;
  stopped: boolean;
}

export interface TrafficEvent {
  id: string;
  type: EventType;
  severity: Severity;
  zone: string;
  direction: Direction;
  timestamp: number; // epoch ms
  title: string;
  description: string;
  vehiclesInvolved: number;
  durationMin: number;
  status: "open" | "acknowledged" | "resolved";
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VolumePoint {
  label: string;
  t: number;
  N: number;
  S: number;
  E: number;
  W: number;
}

export interface DemoDataset {
  generatedAt: number;
  range: TimeRange;
  events: TrafficEvent[];
  volume: VolumePoint[];
}
