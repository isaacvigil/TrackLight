import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const dummyApplications = [
  {
    id: "1",
    company: "Acme Corp",
    role: "Senior Frontend Developer",
    location: "San Francisco",
    remoteStatus: "Hybrid",
    salary: "$120k-$150k",
    applicationStatus: "interviewing",
  },
  {
    id: "2",
    company: "Tech Innovators",
    role: "Full Stack Engineer",
    location: "Remote",
    remoteStatus: "Remote",
    salary: "$100k-$130k",
    applicationStatus: "applied",
  },
  {
    id: "3",
    company: "Digital Solutions",
    role: "React Developer",
    location: "London",
    remoteStatus: "In-office",
    salary: "£60k-£80k",
    applicationStatus: "bookmarked",
  },
];

const statusLabels: Record<string, string> = {
  bookmarked: "Bookmarked",
  applied: "Applied",
  interviewing: "Interviewing",
  no_match: "No match",
  accepted: "Accepted!",
};

export function PreviewApplicationsTable() {
  return (
    <Card>
      <div className="w-full overflow-x-auto pt-2 pb-4 px-2">
        <Table>
          <TableHeader className="mb-2">
            <TableRow>
              <TableHead className="w-[180px]">Company</TableHead>
              <TableHead className="w-[200px]">Role</TableHead>
              <TableHead className="w-[150px]">Location</TableHead>
              <TableHead className="w-[110px]">Remote</TableHead>
              <TableHead className="w-[130px]">Salary</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyApplications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium h-8">{app.company}</TableCell>
                <TableCell className="h-8">{app.role}</TableCell>
                <TableCell className="h-8">{app.location}</TableCell>
                <TableCell className="h-8">{app.remoteStatus}</TableCell>
                <TableCell className="h-8">{app.salary}</TableCell>
                <TableCell className="h-8">
                  {statusLabels[app.applicationStatus]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

