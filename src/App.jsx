import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AddEmployee from "./pages/AddEmployee";
import ViewEmployee from "./pages/ViewEmployee";
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
import LeaveType from "./pages/LeaveType";
import AdminLevel from "./pages/AdminLevel";
import AdminProfile from "./pages/AdminProfile";
import SupervisorDashboard from "./pages/Supervisor/Dashboard";
import SupervisorLeaveRequest from "./pages/Supervisor/LeaveRequest";
import SupervisorOvertimeRequest from "./pages/Supervisor/OvertimeRequest";
import SupervisorAttendance from "./pages/Supervisor/Attendance";
import SupervisorSchedule from "./pages/Supervisor/Schedule";
import AdminProtectedLayout from "./pages/AdminProtectedLayout";
import EmployeeProtectedLayout from "./pages/EmployeeProtectedLayout";
import SupervisorProtectedLayout from "./pages/SupervisorProtectedLayout";
import './App.css';

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Admin Routes */}
      <Route element={<AdminProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/view-employee" element={<ViewEmployee />} />
        <Route path="/settings/site" element={<Site />} />
        <Route path="/settings/department" element={<Department />} />
        <Route path="/settings/cluster" element={<Cluster />} />
        <Route path="/settings/position" element={<Position />} />
        <Route path="/settings/employee-level" element={<EmployeeLevel />} />
        <Route path="/settings/holiday-calendar" element={<Calendar />} />
        <Route path="/settings/overtime-type" element={<OvertimeType />} />
        <Route path="/settings/leave-type" element={<LeaveType />} />
        <Route path="/settings/cut-off" element={<CutOff />} />
        <Route path="/settings/admin-user" element={<AdminUser />} />
        <Route path="/profile" element={<AdminProfile />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/dtr" element={<DTR />} />
        <Route path="/settings/bulletin" element={<Bulletin />} />
        <Route path="/settings/admin-level" element={<AdminLevel />} />
      </Route>

      {/* Employee Routes */}
      <Route element={<EmployeeProtectedLayout />}>
        <Route path="/employee_dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee_attendance" element={<EmployeeAttendance />} />
        <Route path="/employee_payslip" element={<EmployeePayslip />} />
        <Route path="/employee_overtime_request" element={<OvertimeRequest />} />
        <Route path="/employee_leave_request" element={<LeaveRequest />} />
      </Route>

      <Route element={<SupervisorProtectedLayout />}>
        <Route path="/supervisor_dashboard" element={<SupervisorDashboard />} />
        <Route path="/supervisor_leave_request" element={<SupervisorLeaveRequest />} />
        <Route path="/supervisor_overtime_request" element={<SupervisorOvertimeRequest />} />
        <Route path="/supervisor_attendance" element={<SupervisorAttendance />} />
        <Route path="/supervisor_schedule" element={<SupervisorSchedule />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
