import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "FitTrack — Your Premium Fitness Companion",
  description: "Track workouts, visualize progress, and crush your fitness goals with beautiful charts and insights.",
  keywords: "fitness tracker, workout log, progress charts, health, exercise",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
