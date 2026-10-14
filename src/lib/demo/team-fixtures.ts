// Sample data for the company team demo (/demo/app/team): schedule, tasks, pay and the public profile lines.
// Nothing here is real and none of it is stored. It shows the shape of the four missing team features.

export type Person = { id: string; name: string; role: "owner" | "member"; title: string; rate: number; since: string };
export const people: Person[] = [
  { id: "sophea", name: "Sophea", role: "owner", title: "Owner", rate: 0, since: "Jan 2026" },
  { id: "dara", name: "Dara", role: "member", title: "Barista", rate: 2.5, since: "Mar 2026" },
  { id: "srey", name: "Srey", role: "member", title: "Cashier", rate: 2.2, since: "Jun 2026" },
  { id: "vuthy", name: "Vuthy", role: "member", title: "Kitchen helper", rate: 2, since: "Aug 2026" },
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const TODAY = 2; // Wednesday in the demo

export type Shift = { id: string; day: number; start: string; end: string; person: string; clock: "none" | "in" | "out" | "absent" };
export const initialShifts: Shift[] = [
  { id: "s1", day: 0, start: "07:00", end: "12:00", person: "dara", clock: "out" },
  { id: "s2", day: 0, start: "12:00", end: "17:00", person: "srey", clock: "out" },
  { id: "s3", day: 1, start: "07:00", end: "12:00", person: "dara", clock: "out" },
  { id: "s4", day: 1, start: "08:00", end: "16:00", person: "vuthy", clock: "out" },
  { id: "s5", day: 2, start: "07:00", end: "12:00", person: "dara", clock: "none" },
  { id: "s6", day: 2, start: "12:00", end: "17:00", person: "srey", clock: "none" },
  { id: "s7", day: 3, start: "07:00", end: "12:00", person: "srey", clock: "none" },
  { id: "s8", day: 4, start: "08:00", end: "16:00", person: "vuthy", clock: "none" },
  { id: "s9", day: 5, start: "07:00", end: "15:00", person: "dara", clock: "none" },
];

export type TaskStatus = "todo" | "doing" | "done";
export type Task = { id: string; title: string; person: string; status: TaskStatus; due: string };
export const initialTasks: Task[] = [
  { id: "t1", title: "Count milk and coffee beans", person: "dara", status: "doing", due: "Today" },
  { id: "t2", title: "Clean the espresso machine", person: "vuthy", status: "todo", due: "Today" },
  { id: "t3", title: "Update the menu board prices", person: "srey", status: "todo", due: "Friday" },
  { id: "t4", title: "Send the supplier order", person: "sophea", status: "done", due: "Monday" },
];

export const hoursOf = (s: { start: string; end: string }) => {
  const [h1, m1] = s.start.split(":").map(Number);
  const [h2, m2] = s.end.split(":").map(Number);
  return Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
};
