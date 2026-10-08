import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/SupabaseRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Portal from "./pages/Portal";
import Admin from "./pages/Admin";
import TeacherRegister from "./pages/TeacherRegisterSupabase";
import Teachers from "./pages/Teachers";
import TeacherDetail from "./pages/TeacherDetail";
import TeacherBooking from "./pages/TeacherBooking";
import TeacherAvailabilitySupabase from "./pages/TeacherAvailabilitySupabase";
import TeacherBookings from "./pages/TeacherBookings";
import StudentBookings from "./pages/StudentBookings";
import PaymentResult from "./pages/PaymentResult";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/auth" component={Auth} />
              <Route path="/teacher/register" component={TeacherRegister} />
              <Route path="/teachers" component={Teachers} />
              <Route path="/book/:id" component={TeacherBooking} />
              <Route path="/teachers/:id" component={TeacherDetail} />
              <Route path="/teacher/availability"><ProtectedRoute roles={["teacher"]}><TeacherAvailabilitySupabase /></ProtectedRoute></Route>
              <Route path="/teacher/bookings"><ProtectedRoute roles={["teacher"]}><TeacherBookings /></ProtectedRoute></Route>
              <Route path="/student/bookings"><ProtectedRoute roles={["student"]}><StudentBookings /></ProtectedRoute></Route>
              <Route path="/payment/result"><ProtectedRoute roles={["student"]}><PaymentResult /></ProtectedRoute></Route>
              <Route path="/portal"><ProtectedRoute><Portal /></ProtectedRoute></Route>
              <Route path="/admin"><ProtectedRoute roles={["admin", "super_admin", "support"]}><Admin /></ProtectedRoute></Route>
              <Route path="/admin/:section"><ProtectedRoute roles={["admin", "super_admin", "support"]}><Admin /></ProtectedRoute></Route>
              <Route component={Home} />
            </Switch>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}