import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ViewEmployee from "./pages/ViewEmployee";
import Dashboard from "./pages/Dashboard";
import AddEmployee from "./pages/AddEmployee";
import Site from "./pages/Site";
import Department from "./pages/Department";
import Cluster from "./pages/Cluster";
import Position from "./pages/Position";
import EmployeeLevel from "./pages/EmployeeLevel";
import Calendar from "./pages/Calendar";
import OvertimeType from "./pages/OvertimeType";
import CutOff from "./pages/CutOff";
import AdminUser from "./pages/AdminUser";
import Attendance from "./pages/Attendance";
import DTR from "./pages/DTR";
import Bulletin from "./pages/Bulletin";
import EmployeeDashboard from "./pages/Employee Page/Dashboard";
import EmployeeAttendance from "./pages/Employee Page/Attendance";
import EmployeePayslip from "./pages/Employee Page/Payslip";
import LeaveRequest from "./pages/Employee Page/LeaveRequest";
import OvertimeRequest from "./pages/Employee Page/OvertimeRequest";
import AdminLevel from "./pages/AdminLevel";
import ProtectedLayout from "./ProtectedLayout";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/add-employee" element={<AddEmployee />} />
          <Route path="/view-employee" element={<ViewEmployee />} />
          <Route path="/settings/site" element={<Site />} />
          <Route path="/settings/department" element={<Department />} />
          <Route path="/settings/cluster" element={<Cluster />} />
          <Route path="/settings/position" element={<Position />} />
          <Route path="/settings/employee-level" element={<EmployeeLevel />} />
          <Route path="/settings/holiday-calendar" element={<Calendar />} />
          <Route path="/settings/overtime-typgite" element={<OvertimeType />} />
          <Route path="/settings/cut-off" element={<CutOff />} />
          <Route path="/settings/admin-user" element={<AdminUser />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/dtr" element={<DTR />} />
          <Route path="/settings/bulletin" element={<Bulletin />} />
          <Route path="/employee_dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee_attendance" element={<EmployeeAttendance />} />
          <Route path="/employee_payslip" element={<EmployeePayslip />} />
          <Route path="/employee_overtime_request" element={<OvertimeRequest />} />
          <Route path="/employee_leave_request" element={<LeaveRequest />} />
          <Route path="/settings/admin-level" element={<AdminLevel />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
